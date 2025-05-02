import { NDKUser } from '@nostr-dev-kit/ndk';
import { memo } from 'react';

import { Spinner } from '@/shared/components/spinner';
import { BadgeAwardItem } from '@/features/badges-widget/components/badge-award-item';

import { useProfileBadges } from './hooks';

export const ProfileBadges = memo(
  ({ user }: { user: NDKUser }) => {
    
    const { publiclyVisibleBadges, badgeDefinitionsCache, isLoading } = useProfileBadges({ user });

    if (isLoading) {
      return (
        <div className="flex justify-center items-center p-8">
          <Spinner />
        </div>
      );
    }

    return (
      <>
        
        <div className="flex flex-col gap-3 p-2 md:p-0"> 
          
          {publiclyVisibleBadges.length > 0 ? (
            publiclyVisibleBadges.map((award) => (
              <BadgeAwardItem
                key={award.id}
                award={award}
                perspective="recipient" 
                definition={badgeDefinitionsCache[award.definitionEventId || '']}
              />
            ))
          ) : (
            
            <p className="text-muted-foreground text-center p-6">This user hasn't made any badges publicly visible yet.</p>
          )}
        </div>
        
      </>
    );
  },
  (prev, next) => prev.user.pubkey === next.user.pubkey,
);