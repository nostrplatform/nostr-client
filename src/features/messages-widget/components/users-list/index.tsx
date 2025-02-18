import { NDKKind } from '@nostr-dev-kit/ndk';
import { useActiveUser, useSubscription } from 'nostr-hooks';
import { memo, useEffect, useMemo } from 'react';

import { UserItem } from '../user-item';

export const UsersList = memo(() => {
  const { activeUser } = useActiveUser();

  const subId = activeUser ? `messages-${activeUser.pubkey}` : undefined;
  const { createSubscription, events } = useSubscription(subId);

  useEffect(() => {
    if (!activeUser) {
      return;
    }

    createSubscription({
      filters: [
        { kinds: [NDKKind.EncryptedDirectMessage], '#p': [activeUser.pubkey] },
        { kinds: [NDKKind.EncryptedDirectMessage], authors: [activeUser.pubkey] },
      ],
    });
  }, [activeUser, createSubscription]);

  const sortedUsers = useMemo(() => {
    if (!events || events.length === 0 || !activeUser) {
      return [];
    }

    // Create a map of pubkey to their latest message timestamp
    const latestMessageMap = new Map<string, number>();

    events.forEach((event) => {
      const otherPubkey = event.pubkey === activeUser.pubkey
        ? event.tags.find(t => t[0] === 'p')?.[1]
        : event.pubkey;

      if (!otherPubkey) return;

      const timestamp = event.created_at || 0;
      const currentLatest = latestMessageMap.get(otherPubkey) || 0;
      
      if (timestamp > currentLatest) {
        latestMessageMap.set(otherPubkey, timestamp);
      }
    });

    // Convert map to array and sort by timestamp
    return Array.from(latestMessageMap.entries())
      .sort(([, timestampA], [, timestampB]) => timestampB - timestampA)
      .map(([pubkey]) => pubkey);

  }, [events, activeUser]);

  return (
    <div className="flex flex-col w-full h-full overflow-y-auto overflow-x-hidden">
      {sortedUsers.map((pubkey) => (
        <UserItem key={pubkey} pubkey={pubkey} />
      ))}
    </div>
  );
});
