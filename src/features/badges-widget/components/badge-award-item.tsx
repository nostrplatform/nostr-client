import { AwardIcon, User as UserIcon } from 'lucide-react';
import { useProfile } from 'nostr-hooks';
import { nip19 } from 'nostr-tools';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { ellipsis } from '@/shared/utils';
import { BadgeAward, BadgeDefinition } from '../types';
import { BadgeDetailModal } from './badge-detail-modal';


export const BadgeAwardItem = ({ award, perspective, definition }: { award: BadgeAward; perspective: 'awarder' | 'recipient'; definition?: BadgeDefinition }) => {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
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
    <>
      <div 
        className="flex items-center justify-between gap-4 p-3 border border-border rounded-lg bg-card text-card-foreground cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setDetailModalOpen(true)}
      >
        <div className="flex items-center gap-4 overflow-hidden">
          <Avatar className="w-10 h-10 flex-shrink-0">
            <AvatarImage src={badgeThumb} alt={badgeName} />
            
            <AvatarFallback><AwardIcon className="w-5 h-5 text-muted-foreground" /></AvatarFallback>
          </Avatar>
          <div className="overflow-hidden">
            <p className="font-semibold truncate">{badgeName}</p>
            
            <div className="text-sm text-muted-foreground truncate flex items-center gap-1">
              <span>{perspective === 'awarder' ? 'To: ' : 'From: '}</span>
              {profileStatus === 'loading' ? (
                <Skeleton className="h-4 w-20 inline-block" />
              ) : (
                
                <Link 
                  to={`/profile/${otherPartyNpub}`} 
                  className="hover:underline flex items-center gap-1 text-primary hover:text-primary/80"
                  onClick={(e) => e.stopPropagation()} // Prevent the modal from opening when clicking the link
                >
                  <Avatar className="w-4 h-4">
                    <AvatarImage src={otherPartyProfile?.image} alt={otherPartyName} />
                    
                    <AvatarFallback className="text-xs bg-muted text-muted-foreground"><UserIcon size={10} /></AvatarFallback>
                  </Avatar>
                  <span>{otherPartyName}</span>
                </Link>
              )}
            </div>
          </div>
        </div>
        
        <span className="text-xs text-muted-foreground flex-shrink-0">
          {new Date(award.awardedAt * 1000).toLocaleDateString()}
        </span>
      </div>

      {/* Badge detail modal */}
      <BadgeDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        definition={definition}
        award={award}
        perspective={perspective}
      />
    </>
  );
};
