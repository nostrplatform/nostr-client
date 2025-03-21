import { NDKEvent, NDKUserProfile, profileFromEvent } from '@nostr-dev-kit/ndk';
import { memo, useEffect, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { User, AtSign } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { ellipsis } from '@/shared/utils';

export const MentionSearchItem = memo(
  ({ event, onClick }: { event: NDKEvent; onClick: () => void }) => {
    const [profile, setProfile] = useState<NDKUserProfile | undefined | null>(undefined);
    const [isValidated, setIsValidated] = useState(false);

    useEffect(() => {
      (async () => {
        try {
          const extractedProfile = profileFromEvent(event);
          
          // Check NIP-05 validation if present
          if (extractedProfile.nip05 && typeof extractedProfile.nip05 === 'string') {
            try {
              const validated = await event.author.validateNip05(extractedProfile.nip05);
              setIsValidated(validated);
            } catch (e) {
              console.error("Failed to validate NIP-05:", e);
            }
          }
          
          setProfile(extractedProfile);
        } catch (e) {
          console.error("Failed to extract profile:", e);
          setProfile(null);
        }
      })();
    }, [event]);

    if (profile === undefined) {
      return (
        <div className="flex items-center gap-3 p-3 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-muted"></div>
          <div className="flex-1">
            <div className="h-4 w-24 bg-muted rounded mb-2"></div>
            <div className="h-3 w-32 bg-muted rounded"></div>
          </div>
        </div>
      );
    }

    if (profile === null) {
      return null;
    }

    const displayName = profile.name || profile.displayName || ellipsis(event.author.npub, 10);

    return (
      <div 
        className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer" 
        onClick={onClick}
      >
        <Avatar className="h-10 w-10">
          <AvatarImage src={profile.image} alt={displayName} />
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <div className="font-medium truncate">{displayName}</div>
            {isValidated && profile.nip05 && (
              <Badge variant="outline" className="ml-2 text-xs">
                <AtSign className="h-3 w-3 mr-1" />
                verified
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {profile.nip05 || ellipsis(event.author.npub, 16)}
          </div>
        </div>
      </div>
    );
  },
  (prev, next) => prev.event.id === next.event.id
);
