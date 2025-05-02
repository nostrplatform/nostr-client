import { NDKEvent, NDKFilter, NDKKind, NDKUser } from '@nostr-dev-kit/ndk';
import { useNdk } from 'nostr-hooks';
import { useState, useEffect, useMemo } from 'react';
import { BadgeAward, BadgeDefinition } from '@/features/badges-widget/types';
import { parseBadgeAward, parseBadgeDefinition } from '@/features/badges-widget/utils';

// Define a specific d tag for the badge acceptance list
const BADGE_ACCEPTANCE_LIST_D_TAG = 'badge_acceptances';

export const useProfileBadges = ({ user }: { user: NDKUser }) => {
  const { ndk } = useNdk();
  const profilePubkey = user.pubkey;

  const [receivedBadgeEvents, setReceivedBadgeEvents] = useState<NDKEvent[]>([]); // Kind 8
  const [loadingReceivedBadges, setLoadingReceivedBadges] = useState<boolean>(true);
  // State specifically for the badge acceptance list event (Kind 10003 with d tag)
  const [acceptanceListEvent, setAcceptanceListEvent] = useState<NDKEvent | null>(null);
  const [loadingAcceptance, setLoadingAcceptance] = useState<boolean>(true);
  const [processedReceivedBadges, setProcessedReceivedBadges] = useState<BadgeAward[]>([]);
  const [badgeDefinitionsCache, setBadgeDefinitionsCache] = useState<Record<string, BadgeDefinition>>({});
  const [isLoadingBadgeDefs, setIsLoadingBadgeDefs] = useState(false);

  // Fetch Received Badges (Kind 8)
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

  // Fetch the specific Badge Acceptance List (Kind 10003 with d tag)
  useEffect(() => {
    if (!ndk || !profilePubkey) {
      setLoadingAcceptance(false);
      setAcceptanceListEvent(null);
      return;
    }
    setLoadingAcceptance(true);
    // Filter for the specific list
    const filter: NDKFilter = {
        kinds: [NDKKind.BookmarkList],
        authors: [profilePubkey],
        '#d': [BADGE_ACCEPTANCE_LIST_D_TAG],
        limit: 1 // Expecting only one such list per user
    };
    let latestEvent: NDKEvent | null = null;

    const sub = ndk.subscribe(filter, { closeOnEose: false }); // Keep open for updates

    sub.on('event', (event: NDKEvent) => {
        // Keep track of the latest version of the list
        if (!latestEvent || event.created_at! > latestEvent.created_at!) {
            latestEvent = event;
            setAcceptanceListEvent(latestEvent);
        }
    });
     sub.on('eose', () => {
      // If no event received by EOSE, set to null
      if (!latestEvent) {
        setAcceptanceListEvent(null);
      }
      setLoadingAcceptance(false);
    });

    // No need to explicitly handle deletions for replaceable events

    return () => {
        sub.stop();
    };
  }, [ndk, profilePubkey]);

  // Process Received Badges and Fetch Definitions
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
              // Use the definition coordinate (a tag) as the key
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

  // Filter processed badges based on the specific acceptance list event
  const publiclyVisibleBadges = useMemo(() => {
    if (!acceptanceListEvent) {
        return []; // No acceptance list found or empty
    }
    // Get the set of accepted badge award IDs from the 'e' tags of the specific list
    const acceptedAwardIds = new Set(
      acceptanceListEvent.tags.filter(t => t[0] === 'e' && t[1]).map(t => t[1])
    );
    return processedReceivedBadges.filter(award => acceptedAwardIds.has(award.id));
  }, [processedReceivedBadges, acceptanceListEvent]);

  const isLoading = loadingReceivedBadges || loadingAcceptance || isLoadingBadgeDefs;

  // Return the filtered list and the loading state
  return { publiclyVisibleBadges, badgeDefinitionsCache, isLoading };
};