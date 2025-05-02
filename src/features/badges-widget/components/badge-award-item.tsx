import { AwardIcon, User as UserIcon } from 'lucide-react';
import { useProfile } from 'nostr-hooks';
import { nip19 } from 'nostr-tools';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { ellipsis } from '@/shared/utils';
import { BadgeAward, BadgeDefinition } from '../types';

// Component to display a single badge award instance
export const BadgeAwardItem = ({ award, perspective, definition }: { award: BadgeAward; perspective: 'awarder' | 'recipient'; definition?: BadgeDefinition }) => {
  const otherPartyHex = perspective === 'awarder' ? award.recipient : award.awarder;
  const { profile: otherPartyProfile, status: profileStatus } = useProfile({ pubkey: otherPartyHex });

  const otherPartyNpub = useMemo(() => {
    try {
      return nip19.npubEncode(otherPartyHex);
    } catch { return otherPartyHex; }
  }, [otherPartyHex]);

  const badgeName = definition?.name || award.definitionEventId?.split(':')[2] || 'Unknown Badge';
  const badgeThumb = definition?.thumb || definition?.image;
  const otherPartyName = otherPartyProfile?.displayName || otherPartyProfile?.name || ellipsis(otherPartyNpub, 15);

  return (
    // Use theme-aware border color and rounded corners
    <div className="flex items-center justify-between gap-4 p-3 border border-border rounded-lg bg-card text-card-foreground">
      <div className="flex items-center gap-4 overflow-hidden">
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarImage src={badgeThumb} alt={badgeName} />
          {/* Use theme-aware fallback text color */}
          <AvatarFallback><AwardIcon className="w-5 h-5 text-muted-foreground" /></AvatarFallback>
        </Avatar>
        <div className="overflow-hidden">
          <p className="font-semibold truncate">{badgeName}</p>
          {/* Use theme-aware muted text color */}
          <div className="text-sm text-muted-foreground truncate flex items-center gap-1">
            <span>{perspective === 'awarder' ? 'To: ' : 'From: '}</span>
            {profileStatus === 'loading' ? (
              <Skeleton className="h-4 w-20 inline-block" />
            ) : (
              // Ensure link styling is theme-aware
              <Link to={`/profile/${otherPartyNpub}`} className="hover:underline flex items-center gap-1 text-primary hover:text-primary/80">
                <Avatar className="w-4 h-4">
                  <AvatarImage src={otherPartyProfile?.image} alt={otherPartyName} />
                  {/* Ensure fallback styling is theme-aware */}
                  <AvatarFallback className="text-xs bg-muted text-muted-foreground"><UserIcon size={10} /></AvatarFallback>
                </Avatar>
                <span>{otherPartyName}</span>
              </Link>
            )}
          </div>
        </div>
      </div>
      {/* Use theme-aware muted text color */}
      <span className="text-xs text-muted-foreground flex-shrink-0">
        {new Date(award.awardedAt * 1000).toLocaleDateString()}
      </span>
    </div>
  );
};
