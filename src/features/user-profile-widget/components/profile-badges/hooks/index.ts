import { NDKEvent, NDKFilter, NDKKind, NDKUser } from '@nostr-dev-kit/ndk';
import { useNdk } from 'nostr-hooks';
import { useState, useEffect, useMemo } from 'react';
import { BadgeAward, BadgeDefinition } from '@/features/badges-widget/types';
import { parseBadgeAward, parseBadgeDefinition } from '@/features/badges-widget/utils';

// Define the specific d tag for the badge visibility list (NIP-51)
const BADGE_VISIBILITY_LIST_D_TAG = 'badge_visibility'; // Renamed constant

export const useProfileBadges = ({ user }: { user: NDKUser }) => {
  const { ndk } = useNdk();
  const profilePubkey = user.pubkey;

  const [receivedBadgeEvents, setReceivedBadgeEvents] = useState<NDKEvent[]>([]); // Kind 8 awards received by the user
  const [loadingReceivedBadges, setLoadingReceivedBadges] = useState<boolean>(true);
  // State specifically for the badge visibility list event (Kind 10003 with d tag)
  const [visibilityListEvent, setVisibilityListEvent] = useState<NDKEvent | null>(null); // Renamed state
  const [loadingVisibilityList, setLoadingVisibilityList] = useState<boolean>(true); // Renamed state
  const [processedReceivedBadges, setProcessedReceivedBadges] = useState<BadgeAward[]>([]);
  const [badgeDefinitionsCache, setBadgeDefinitionsCache] = useState<Record<string, BadgeDefinition>>({});
  const [isLoadingBadgeDefs, setIsLoadingBadgeDefs] = useState(false);

  // Fetch Received Badges (Kind 8 where #p = profilePubkey)
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

  // Fetch the specific Badge Visibility List (Kind 10003 with d tag)
  useEffect(() => {
    if (!ndk || !profilePubkey) {
      setLoadingVisibilityList(false); 
      setVisibilityListEvent(null); 
      return;
    }
    setLoadingVisibilityList(true); 
    // Filter for the specific list using the renamed d tag
    const filter: NDKFilter = {
        kinds: [NDKKind.BookmarkList], // Using Kind 10003 as per NIP-51 for generic lists
        authors: [profilePubkey],
        '#d': [BADGE_VISIBILITY_LIST_D_TAG], 
        limit: 1 // Expecting only one such list per user (latest)
    };
    let latestEvent: NDKEvent | null = null;

    const sub = ndk.subscribe(filter, { closeOnEose: false }); // Keep open for potential updates

    sub.on('event', (event: NDKEvent) => {
        // Keep track of the latest version of the list
        if (!latestEvent || event.created_at! > latestEvent.created_at!) {
            latestEvent = event;
            setVisibilityListEvent(latestEvent); 
        }
    });
     sub.on('eose', () => {
      // If no event received by EOSE, set to null
      if (!latestEvent) {
        setVisibilityListEvent(null); 
      }
      setLoadingVisibilityList(false); 
    });

    // Replaceable events (like Kind 10003) don't need explicit deletion handling here

    return () => {
        sub.stop();
    };
  }, [ndk, profilePubkey]);

  // Process Received Badges and Fetch Their Definitions
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
        // Check if the definition ('a' tag coordinate) is needed and not already cached
        if (award.definitionEventId && !currentCache[award.definitionEventId]) {
          definitionCoords.add(award.definitionEventId);
        }
      });

      // Fetch missing badge type definitions if any
      if (definitionCoords.size > 0 && ndk) {
        setIsLoadingBadgeDefs(true);
        try {
          // Create filters to fetch each unique definition event
          const filters = Array.from(definitionCoords).map(coord => {
            const [kind, pubkey, d] = coord.split(':');
            return {
              kinds: [parseInt(kind)], // Should be NDKKind.BadgeDefinition
              authors: [pubkey],
              '#d': [d],
              limit: 1, // Fetch only the latest version
            };
          });
          const fetchedDefs = await ndk.fetchEvents(filters);
          const newCacheEntries: Record<string, BadgeDefinition> = {};
          fetchedDefs.forEach(event => {
            const def = parseBadgeDefinition(event);
            if (def) {
              // Use the definition coordinate (a tag format) as the key for the cache
              const coord = `${NDKKind.BadgeDefinition}:${def.pubkey}:${def.d}`;
              newCacheEntries[coord] = def;
            }
          });
          // Update the cache with newly fetched definitions
          setBadgeDefinitionsCache(prev => ({ ...prev, ...newCacheEntries }));
        } catch (error) {
          console.error("Error fetching badge definitions for profile awards:", error);
        } finally {
          setIsLoadingBadgeDefs(false);
        }
      }

      // Update the state with the processed awards, sorted by awarded date
      setter(parsedAwards.sort((a, b) => b.awardedAt - a.awardedAt));
    };

    // Process the received badge events
    processBadges(receivedBadgeEvents, setProcessedReceivedBadges, badgeDefinitionsCache);

  }, [receivedBadgeEvents, ndk, badgeDefinitionsCache]);

  // Filter processed badges based on the specific visibility list event
  const publiclyVisibleBadges = useMemo(() => {
    if (!visibilityListEvent) { // Use renamed state
        return []; // No visibility list found or empty, so no badges are publicly visible
    }
    // Get the set of visible badge award IDs from the 'e' tags of the specific list
    const visibleAwardIds = new Set( // Renamed variable
      visibilityListEvent.tags.filter(t => t[0] === 'e' && t[1]).map(t => t[1])
    );
    // Return only those received badges whose award ID is present in the visible set
    return processedReceivedBadges.filter(award => visibleAwardIds.has(award.id));
  }, [processedReceivedBadges, visibilityListEvent]); // Depend on renamed state

  // Combined loading state
  const isLoading = loadingReceivedBadges || loadingVisibilityList || isLoadingBadgeDefs; // Use renamed state

  // Return the filtered list of publicly visible badges and the loading state
  return { publiclyVisibleBadges, badgeDefinitionsCache, isLoading };
};