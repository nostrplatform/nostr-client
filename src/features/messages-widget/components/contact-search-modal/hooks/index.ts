import { useEffect, useState, useCallback } from 'react';
import { NDKEvent, NDKKind, NDKUser, NDKFilter, NDKRelaySet } from '@nostr-dev-kit/ndk';
import { useActiveUser, useNdk, useSubscription } from 'nostr-hooks';

export const useContacts = () => {
  const [contacts, setContacts] = useState<NDKUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { ndk } = useNdk();
  const { activeUser } = useActiveUser();
  
  // Subscribe to the user's contact list
  const subId = activeUser ? `user-contacts-${activeUser.pubkey}` : undefined;
  const { createSubscription, events } = useSubscription(subId);
  
  // Function to filter contacts based on a query
  const filterContacts = useCallback((query: string) => {
    if (!query.trim()) {
      return contacts;
    }
    
    const searchLower = query.toLowerCase();
    return contacts.filter(contact => {
      const profile = contact.profile || {};
      return (
        (profile.name?.toLowerCase() || '').includes(searchLower) ||
        (profile.displayName?.toLowerCase() || '').includes(searchLower) ||
        (profile.nip05?.toLowerCase() || '').includes(searchLower) ||
        (profile.about?.toLowerCase() || '').includes(searchLower) ||
        contact.npub.toLowerCase().includes(searchLower)
      );
    });
  }, [contacts]);
  
  // Function to search for users across the network
  const searchContacts = useCallback(async (query: string) => {
    if (!ndk || !query.trim() || query.trim().length < 2) {
      return [];
    }
    
    const results: NDKUser[] = [];
    
    try {
      // Try NIP-05 search if query contains @
      if (query.includes('@') && query.includes('.')) {
        try {
          const user = new NDKUser({ nip05: query });
          await user.fetchProfile();
          if (user.profile) {
            results.push(user);
          }
        } catch (e) {
          console.log('NIP-05 search failed:', e);
        }
      }
      
      // Try to search via relay.nostr.band
      try {
        const filter: NDKFilter = { 
          kinds: [0], 
          limit: 10, 
          search: query 
        };
        
        const events = await ndk.fetchEvents(
          [filter],
          { closeOnEose: true },
          NDKRelaySet.fromRelayUrls(['wss://relay.nostr.band'], ndk),
        );
        
        events.forEach(event => {
          try {
            const user = new NDKUser({ pubkey: event.pubkey });
            user.profile = JSON.parse(event.content);
            
            // Check if this user is already in results
            if (!results.some(r => r.pubkey === user.pubkey)) {
              results.push(user);
            }
          } catch (e) {
            console.error('Failed to parse profile:', e);
          }
        });
      } catch (e) {
        console.log('Search relay query failed:', e);
      }
      
      // If we found remote results, also try to filter local contacts
      const filteredContacts = filterContacts(query);
      
      // Merge results, ensuring no duplicates
      filteredContacts.forEach(contact => {
        if (!results.some(r => r.pubkey === contact.pubkey)) {
          results.push(contact);
        }
      });
      
      return results;
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }, [ndk, filterContacts]);
  
  // Fetch the user's contact list
  useEffect(() => {
    if (!activeUser || !ndk) {
      setContacts([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    // Get contacts from subscription
    createSubscription({
      filters: [{ kinds: [NDKKind.Contacts], authors: [activeUser.pubkey], limit: 1 }],
    });
    
    // Backup direct fetch if subscription is slow
    const timeoutId = setTimeout(async () => {
      try {
        const filter: NDKFilter = { 
          kinds: [NDKKind.Contacts], 
          authors: [activeUser.pubkey], 
          limit: 1 
        };
        
        const contactsEvents = await ndk.fetchEvents([filter]);
        if (contactsEvents.size > 0 && events?.length === 0) {
          // Process the contact list from direct fetch
          processContactEvents(Array.from(contactsEvents));
        }
      } catch (error) {
        console.error('Direct contact fetch failed:', error);
      }
    }, 3000);
    
    return () => clearTimeout(timeoutId);
  }, [activeUser, ndk, createSubscription]);
  
  // Process contact events into user profiles
  const processContactEvents = useCallback(async (contactEvents: NDKEvent[]) => {
    if (contactEvents.length === 0 || !ndk) {
      setIsLoading(false);
      return;
    }
    
    try {
      const mostRecentEvent = contactEvents.reduce((latest, event) => 
        !latest || event.created_at! > latest.created_at! ? event : latest, 
        contactEvents[0]
      );
      
      const contactPubkeys = mostRecentEvent.tags
        .filter(tag => tag[0] === 'p' && tag[1])
        .map(tag => tag[1]);
      
      if (contactPubkeys.length === 0) {
        setContacts([]);
        setIsLoading(false);
        return;
      }
      
      // Fetch profiles in batches
      const batchSize = 20;
      const batches = [];
      
      for (let i = 0; i < contactPubkeys.length; i += batchSize) {
        batches.push(contactPubkeys.slice(i, i + batchSize));
      }
      
      const allContacts: NDKUser[] = [];
      
      for (const batch of batches) {
        const filter: NDKFilter = { 
          kinds: [0], 
          authors: batch 
        };
        
        try {
          const profileEvents = await ndk.fetchEvents([filter], { closeOnEose: true });
          
          // Create a map of pubkey -> profile events
          const profileMap = new Map<string, NDKEvent>();
          profileEvents.forEach(event => profileMap.set(event.pubkey, event));
          
          // Create NDKUsers for each pubkey
          const batchUsers = batch.map(pubkey => {
            const user = new NDKUser({ pubkey });
            const profileEvent = profileMap.get(pubkey);
            
            if (profileEvent) {
              try {
                user.profile = JSON.parse(profileEvent.content);
              } catch (e) {
                console.error(`Failed to parse profile for ${pubkey}:`, e);
              }
            }
            
            return user;
          });
          
          allContacts.push(...batchUsers);
        } catch (error) {
          console.error('Failed to fetch profiles for batch:', error);
        }
      }
      
      // Sort contacts by name
      allContacts.sort((a, b) => {
        const nameA = a.profile?.name?.toLowerCase() || a.profile?.displayName?.toLowerCase() || a.npub;
        const nameB = b.profile?.name?.toLowerCase() || b.profile?.displayName?.toLowerCase() || b.npub;
        return nameA.localeCompare(nameB);
      });
      
      setContacts(allContacts);
    } catch (error) {
      console.error('Failed to process contacts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [ndk]);
  
  // Process events from subscription
  useEffect(() => {
    if (events && events.length > 0) {
      processContactEvents(events);
    }
  }, [events, processContactEvents]);
  
  return { 
    contacts, 
    isLoading,
    filterContacts,
    searchContacts
  };
};
