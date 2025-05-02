import { NDKEvent, NDKFilter, NDKKind, NDKUser } from '@nostr-dev-kit/ndk';
import { useNdk } from 'nostr-hooks';
import { useState, useEffect, useMemo } from 'react';
import { BadgeAward, BadgeDefinition } from '@/features/badges-widget/types';
import { parseBadgeAward, parseBadgeDefinition } from '@/features/badges-widget/utils';

const PROFILE_BADGES_KIND = 30008;
const PROFILE_BADGES_D_TAG = 'profile_badges';

export const useProfileBadges = ({ user }: { user: NDKUser }) => {
  const { ndk } = useNdk();
  const profilePubkey = user.pubkey;

  const [receivedBadgeEvents, setReceivedBadgeEvents] = useState<NDKEvent[]>([]);
  const [loadingReceivedBadges, setLoadingReceivedBadges] = useState<boolean>(true);
  const [profileBadgesEvent, setProfileBadgesEvent] = useState<NDKEvent | null>(null);
  const [loadingProfileBadges, setLoadingProfileBadges] = useState<boolean>(true);
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
    sub.on('event', (event: NDKEvent) => {
      events.push(event);
    });
    sub.on('eose', () => {
      setReceivedBadgeEvents(events);
      setLoadingReceivedBadges(false);
    });
    return () => {
      sub.stop();
    };
  }, [ndk, profilePubkey]);

  useEffect(() => {
    if (!ndk || !profilePubkey) {
      setLoadingProfileBadges(false);
      setProfileBadgesEvent(null);
      return;
    }
    setLoadingProfileBadges(true);
    const filter: NDKFilter = {
      kinds: [PROFILE_BADGES_KIND],
      authors: [profilePubkey],
      '#d': [PROFILE_BADGES_D_TAG],
      limit: 1,
    };
    let latestEvent: NDKEvent | null = null;

    const sub = ndk.subscribe(filter, { closeOnEose: false });

    sub.on('event', (event: NDKEvent) => {
      if (!latestEvent || event.created_at! > latestEvent.created_at!) {
        latestEvent = event;
        setProfileBadgesEvent(latestEvent);
      }
    });
    sub.on('eose', () => {
      if (!latestEvent) {
        setProfileBadgesEvent(null);
      }
      setLoadingProfileBadges(false);
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
      parsedAwards.forEach((award) => {
        if (award.definitionEventId && !currentCache[award.definitionEventId]) {
          definitionCoords.add(award.definitionEventId);
        }
      });

      if (definitionCoords.size > 0 && ndk) {
        setIsLoadingBadgeDefs(true);
        try {
          const filters = Array.from(definitionCoords).map((coord) => {
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
          fetchedDefs.forEach((event) => {
            const def = parseBadgeDefinition(event);
            if (def) {
              const coord = `${NDKKind.BadgeDefinition}:${def.pubkey}:${def.d}`;
              newCacheEntries[coord] = def;
            }
          });
          setBadgeDefinitionsCache((prev) => ({ ...prev, ...newCacheEntries }));
        } catch (error) {
          console.error('Error fetching badge definitions for profile awards:', error);
        } finally {
          setIsLoadingBadgeDefs(false);
        }
      }

      setter(parsedAwards.sort((a, b) => b.awardedAt - a.awardedAt));
    };

    processBadges(receivedBadgeEvents, setProcessedReceivedBadges, badgeDefinitionsCache);
  }, [receivedBadgeEvents, ndk, badgeDefinitionsCache]);

  const publiclyVisibleBadges = useMemo(() => {
    if (!profileBadgesEvent) {
      return [];
    }

    const visibleAwardIds = new Set<string>();
    const tags = profileBadgesEvent.tags;
    for (let i = 0; i < tags.length - 1; i++) {
      if (tags[i][0] === 'a' && tags[i + 1][0] === 'e' && tags[i + 1][1]) {
        visibleAwardIds.add(tags[i + 1][1]);
        i++;
      }
    }

    const orderedVisibleBadges: BadgeAward[] = [];
    const receivedBadgesMap = new Map(processedReceivedBadges.map((b) => [b.id, b]));

    visibleAwardIds.forEach((awardId) => {
      const badge = receivedBadgesMap.get(awardId);
      if (badge) {
        orderedVisibleBadges.push(badge);
      }
    });

    return orderedVisibleBadges;
  }, [processedReceivedBadges, profileBadgesEvent]);

  const isLoading = loadingReceivedBadges || loadingProfileBadges || isLoadingBadgeDefs;

  return { publiclyVisibleBadges, badgeDefinitionsCache, isLoading };
};