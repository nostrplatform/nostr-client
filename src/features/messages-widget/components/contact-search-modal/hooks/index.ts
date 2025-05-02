import { useEffect, useState, useCallback } from 'react';
import { NDKEvent, NDKKind, NDKUser, NDKFilter, NDKRelaySet } from '@nostr-dev-kit/ndk';
import { useActiveUser, useNdk, useSubscription } from 'nostr-hooks';

export const useContacts = () => {
  const [contacts, setContacts] = useState<NDKUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { ndk } = useNdk();
  const { activeUser } = useActiveUser();
  
  
  const subId = activeUser ? `user-contacts-${activeUser.pubkey}` : undefined;
  const { createSubscription, events } = useSubscription(subId);
  
  
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
  
  
  const searchContacts = useCallback(async (query: string) => {
    if (!ndk || !query.trim() || query.trim().length < 2) {
      return [];
    }
    
    const results: NDKUser[] = [];
    
    try {
      
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
      
      
      const filteredContacts = filterContacts(query);
      
      
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
  
  
  useEffect(() => {
    if (!activeUser || !ndk) {
      setContacts([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    
    createSubscription({
      filters: [{ kinds: [NDKKind.Contacts], authors: [activeUser.pubkey], limit: 1 }],
    });
    
    
    const timeoutId = setTimeout(async () => {
      try {
        const filter: NDKFilter = { 
          kinds: [NDKKind.Contacts], 
          authors: [activeUser.pubkey], 
          limit: 1 
        };
        
        const contactsEvents = await ndk.fetchEvents([filter]);
        if (contactsEvents.size > 0 && events?.length === 0) {
          
          processContactEvents(Array.from(contactsEvents));
        }
      } catch (error) {
        console.error('Direct contact fetch failed:', error);
      }
    }, 3000);
    
    return () => clearTimeout(timeoutId);
  }, [activeUser, ndk, createSubscription]);
  
  
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
          
          
          const profileMap = new Map<string, NDKEvent>();
          profileEvents.forEach(event => profileMap.set(event.pubkey, event));
          
          
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
