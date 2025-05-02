import { NDKEvent, NDKFilter, NDKKind, NDKUser } from '@nostr-dev-kit/ndk';
import { useNdk } from 'nostr-hooks';
import { useState, useEffect, useMemo } from 'react';
import { BadgeAward, BadgeDefinition } from '@/features/badges-widget/types';
import { parseBadgeAward, parseBadgeDefinition } from '@/features/badges-widget/utils';


const BADGE_VISIBILITY_LIST_D_TAG = 'badge_visibility'; 

export const useProfileBadges = ({ user }: { user: NDKUser }) => {
  const { ndk } = useNdk();
  const profilePubkey = user.pubkey;

  const [receivedBadgeEvents, setReceivedBadgeEvents] = useState<NDKEvent[]>([]); 
  const [loadingReceivedBadges, setLoadingReceivedBadges] = useState<boolean>(true);
  
  const [visibilityListEvent, setVisibilityListEvent] = useState<NDKEvent | null>(null); 
  const [loadingVisibilityList, setLoadingVisibilityList] = useState<boolean>(true); 
  const [processedReceivedBadges, setProcessedReceivedBadges] = useState<BadgeAward[]>([]);
  const [badgeDefinitionsCache, setBadgeDefinitionsCache] = useState<Record<string, BadgeDefinition>>({});
  const [isLoadingBadgeDefs, setIsLoadingBadgeDefs] = useState(false);

  
  useEffect(() => {
    if (!ndk || !profilePubkey) {
      setLoadingReceivedBadges(false);
      setReceivedBadgeEvents([]);
      return;
    }
    setLoadingReceivedBadges(true);
    const filter: NDKFilter = { kinds: [NDKKind.BadgeAward], '#p': [profilePubkey] };
    const sub = ndk.subscribe(filter, { closeOnEose: true });
    const events: NDKEvent[] = [];
    sub.on('event', (event: NDKEvent) => { events.push(event); });
    sub.on('eose', () => {
      setReceivedBadgeEvents(events);
      setLoadingReceivedBadges(false);
    });
    return () => { sub.stop(); };
  }, [ndk, profilePubkey]);

  
  useEffect(() => {
    if (!ndk || !profilePubkey) {
      setLoadingVisibilityList(false); 
      setVisibilityListEvent(null); 
      return;
    }
    setLoadingVisibilityList(true); 
    
    const filter: NDKFilter = {
        kinds: [NDKKind.BookmarkList], 
        authors: [profilePubkey],
        '#d': [BADGE_VISIBILITY_LIST_D_TAG], 
        limit: 1 
    };
    let latestEvent: NDKEvent | null = null;

    const sub = ndk.subscribe(filter, { closeOnEose: false }); 

    sub.on('event', (event: NDKEvent) => {
        
        if (!latestEvent || event.created_at! > latestEvent.created_at!) {
            latestEvent = event;
            setVisibilityListEvent(latestEvent); 
        }
    });
     sub.on('eose', () => {
      
      if (!latestEvent) {
        setVisibilityListEvent(null); 
      }
      setLoadingVisibilityList(false); 
    });

    

    return () => {
        sub.stop();
    };
  }, [ndk, profilePubkey]);

  
  useEffect(() => {
    const processBadges = async (
      events: NDKEvent[],
      setter: React.Dispatch<React.SetStateAction<BadgeAward[]>>,
      currentCache: Record<string, BadgeDefinition>
    ) => {
      const parsedAwards = (events ?? [])
        .map(parseBadgeAward)
        .filter((award): award is BadgeAward => award !== null);

      const definitionCoords = new Set<string>();
      parsedAwards.forEach(award => {
        
        if (award.definitionEventId && !currentCache[award.definitionEventId]) {
          definitionCoords.add(award.definitionEventId);
        }
      });

      
      if (definitionCoords.size > 0 && ndk) {
        setIsLoadingBadgeDefs(true);
        try {
          
          const filters = Array.from(definitionCoords).map(coord => {
            const [kind, pubkey, d] = coord.split(':');
            return {
              kinds: [parseInt(kind)], 
              authors: [pubkey],
              '#d': [d],
              limit: 1, 
            };
          });
          const fetchedDefs = await ndk.fetchEvents(filters);
          const newCacheEntries: Record<string, BadgeDefinition> = {};
          fetchedDefs.forEach(event => {
            const def = parseBadgeDefinition(event);
            if (def) {
              
              const coord = `${NDKKind.BadgeDefinition}:${def.pubkey}:${def.d}`;
              newCacheEntries[coord] = def;
            }
          });
          
          setBadgeDefinitionsCache(prev => ({ ...prev, ...newCacheEntries }));
        } catch (error) {
          console.error("Error fetching badge definitions for profile awards:", error);
        } finally {
          setIsLoadingBadgeDefs(false);
        }
      }

      
      setter(parsedAwards.sort((a, b) => b.awardedAt - a.awardedAt));
    };

    
    processBadges(receivedBadgeEvents, setProcessedReceivedBadges, badgeDefinitionsCache);

  }, [receivedBadgeEvents, ndk, badgeDefinitionsCache]);

  
  const publiclyVisibleBadges = useMemo(() => {
    if (!visibilityListEvent) { 
        return []; 
    }
    
    const visibleAwardIds = new Set( 
      visibilityListEvent.tags.filter(t => t[0] === 'e' && t[1]).map(t => t[1])
    );
    
    return processedReceivedBadges.filter(award => visibleAwardIds.has(award.id));
  }, [processedReceivedBadges, visibilityListEvent]); 

  
  const isLoading = loadingReceivedBadges || loadingVisibilityList || isLoadingBadgeDefs; 

  
  return { publiclyVisibleBadges, badgeDefinitionsCache, isLoading };
};