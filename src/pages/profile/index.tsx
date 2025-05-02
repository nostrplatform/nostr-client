import { NDKEvent, NDKFilter, NDKKind, NDKUser } from '@nostr-dev-kit/ndk';
import { useMemo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useNdk } from 'nostr-hooks';

import { UserProfileWidget } from '@/features/user-profile-widget';
import { BadgeAwardItem } from '@/features/badges-widget/components/badge-award-item';
import { BadgeAward, BadgeDefinition } from '@/features/badges-widget/types';
import { parseBadgeAward, parseBadgeDefinition } from '@/features/badges-widget/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Spinner } from '@/shared/components/spinner';

/**
 * Profile page component that displays user profile information and received badges.
 *
 * This component takes a `npub` parameter from the URL and renders
 * a user profile widget for the corresponding user. If no valid npub
 * is provided or the user cannot be found, it displays an error message.
 *
 * Additionally, it fetches and displays badges awarded to the user.
 *
 * @returns A React component that renders:
 * - UserProfileWidget for valid user
 * - Received badges section
 * - "Invalid profile" message for invalid/missing npub
 */
export const ProfilePage = () => {
  const { npub } = useParams();
  const { ndk } = useNdk();

  const user = useMemo(() => (npub ? new NDKUser({ npub }) : undefined), [npub]);
  const profilePubkey = useMemo(() => user?.pubkey, [user]);

  // --- State for received badges ---
  const [receivedBadgeEvents, setReceivedBadgeEvents] = useState<NDKEvent[]>([]);
  const [loadingReceivedBadges, setLoadingReceivedBadges] = useState<boolean>(true);
  const [processedReceivedBadges, setProcessedReceivedBadges] = useState<BadgeAward[]>([]);
  const [badgeDefinitionsCache, setBadgeDefinitionsCache] = useState<Record<string, BadgeDefinition>>({});
  const [isLoadingBadgeDefs, setIsLoadingBadgeDefs] = useState(false);

  // --- Fetch Received Badges (Kind 8) for the profile user ---
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

  // --- Process Received Badges and Fetch Definitions ---
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

  if (!npub || !user) {
    return <p>Invalid profile</p>;
  }

  const renderLoading = () => (
    <div className="flex justify-center items-center p-8"><Spinner /></div>
  );

  return (
    <>
      <div className="h-full w-full overflow-y-auto space-y-4 p-2 md:p-4">
        <UserProfileWidget user={user} />

        {/* Received Badges Section */}
        <Card>
          <CardHeader>
            <CardTitle>Received Badges</CardTitle>
            <CardDescription>Badges awarded to this user.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingReceivedBadges || isLoadingBadgeDefs ? renderLoading() : processedReceivedBadges.length > 0 ? (
              processedReceivedBadges.map((award) => (
                <BadgeAwardItem
                  key={award.id}
                  award={award}
                  perspective="recipient"
                  definition={badgeDefinitionsCache[award.definitionEventId || '']}
                />
              ))
            ) : (
              <p className="text-muted-foreground text-center">This user hasn't earned any badges yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};
