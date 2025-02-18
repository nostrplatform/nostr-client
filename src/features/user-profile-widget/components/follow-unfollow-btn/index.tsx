import { NDKUser } from '@nostr-dev-kit/ndk';
import { useFollows } from 'nostr-hooks';
import { memo, useMemo, useState } from 'react';

import { Button } from '@/shared/components/ui/button';

export const FollowUnfollowBtn = memo(
  ({ targetUser, activeUser }: { targetUser: NDKUser; activeUser: NDKUser }) => {
    const { follows } = useFollows({ pubkey: activeUser.pubkey });
    const [isLoadingFollow, setIsLoadingFollow] = useState(false);
    const [localIsFollowed, setLocalIsFollowed] = useState<boolean | null>(null);

    const isFollowed = useMemo(
      () => localIsFollowed ?? follows?.some((u) => u.pubkey === targetUser.pubkey),
      [follows, targetUser.pubkey, localIsFollowed],
    );

    const handleFollow = async () => {
      setIsLoadingFollow(true);
      try {
        await activeUser.follow(targetUser);
        setLocalIsFollowed(true);
      } catch (error) {
        console.error('Failed to follow:', error);
      }
      setIsLoadingFollow(false);
    };

    const handleUnfollow = async () => {
      setIsLoadingFollow(true);
      try {
        await activeUser.unfollow(targetUser);
        setLocalIsFollowed(false);
      } catch (error) {
        console.error('Failed to unfollow:', error);
      }
      setIsLoadingFollow(false);
    };

    if (activeUser.pubkey === targetUser.pubkey) {
      return null;
    }

    if (isFollowed) {
      return (
        <Button
          variant="secondary"
          className="rounded-full"
          onClick={handleUnfollow}
          disabled={isLoadingFollow}
        >
          {isLoadingFollow ? 'Loading...' : 'Unfollow'}
        </Button>
      );
    } else {
      return (
        <Button
          variant="secondary"
          className="rounded-full"
          onClick={handleFollow}
          disabled={isLoadingFollow}
        >
          {isLoadingFollow ? 'Loading...' : 'Follow'}
        </Button>
      );
    }
  },
  (prev, next) =>
    prev.targetUser.pubkey === next.targetUser.pubkey &&
    prev.activeUser.pubkey === next.activeUser.pubkey,
);
