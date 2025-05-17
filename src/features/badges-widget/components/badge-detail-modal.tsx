import { CalendarIcon, HashIcon, TagIcon, User as UserIcon } from 'lucide-react';
import { useProfile } from 'nostr-hooks';
import { nip19 } from 'nostr-tools';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { ellipsis } from '@/shared/utils';

import { BadgeDefinition, BadgeAward } from '../types';

interface BadgeDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  definition?: BadgeDefinition;
  award?: BadgeAward;
  perspective?: 'awarder' | 'recipient' | 'none';
}

export const BadgeDetailModal = ({
  open,
  onOpenChange,
  definition,
  award,
 }: BadgeDetailModalProps) => {
   const { profile: creatorProfile, status: creatorStatus } = useProfile({ 
    pubkey: definition?.pubkey ?? ''
  });
  
   const { profile: awarderProfile, status: awarderStatus } = useProfile({
    pubkey: award?.awarder ?? '',
   });
  
  const { profile: recipientProfile, status: recipientStatus } = useProfile({
    pubkey: award?.recipient ?? '',
   });
  
  // Format npubs for linking
  const creatorNpub = useMemo(() => {
    try {
      return definition?.pubkey ? nip19.npubEncode(definition.pubkey) : '';
    } catch { return ''; }
  }, [definition?.pubkey]);
  
  const awarderNpub = useMemo(() => {
    try {
      return award?.awarder ? nip19.npubEncode(award.awarder) : '';
    } catch { return ''; }
  }, [award?.awarder]);
  
  const recipientNpub = useMemo(() => {
    try {
      return award?.recipient ? nip19.npubEncode(award.recipient) : '';
    } catch { return ''; }
  }, [award?.recipient]);
  
  if (!definition) return null;

  // Extract hashtags from the badge definition (those stored as ['t', 'hashtag', value])
  const hashtags = definition.event.tags
    .filter(tag => tag.length >= 3 && tag[0] === 't' && tag[1] === 'hashtag')
    .map(tag => tag[2]);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] overflow-y-auto max-h-[85vh]">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <DialogTitle className="text-xl font-bold">{definition.name || 'Badge Details'}</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-6 py-4">
          {/* Badge image */}
          {(definition.image || definition.thumb) && (
            <div className="flex justify-center">
              <div className="w-32 h-32 rounded-lg overflow-hidden border border-border bg-muted/30 p-2">
                <img 
                  src={definition.image || definition.thumb} 
                  alt={definition.name || 'Badge image'} 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}
          
          {/* Badge info */}
          <div className="space-y-4">
            {definition.description && (
              <div className="text-sm leading-relaxed">
                {definition.description}
              </div>
            )}
            
            {/* Creator info */}
            <div className="flex items-center gap-2 text-sm border-t border-border pt-4">
              <span className="text-muted-foreground min-w-[80px]">Created by:</span>
              {creatorStatus === 'loading' ? (
                <Skeleton className="h-6 w-32" />
              ) : (
                <Link to={`/profile/${creatorNpub}`} className="flex items-center gap-2 hover:underline text-primary">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={creatorProfile?.image} />
                    <AvatarFallback className="text-xs"><UserIcon size={10} /></AvatarFallback>
                  </Avatar>
                  <span>{creatorProfile?.displayName || creatorProfile?.name || ellipsis(creatorNpub, 12)}</span>
                </Link>
              )}
            </div>
            
            {/* Badge identifier */}
            <div className="flex items-center gap-2 text-sm border-t border-border pt-4">
              <span className="text-muted-foreground min-w-[80px]">Unique ID:</span>
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{definition.d}</code>
            </div>
            
            {/* Hashtags section */}
            {hashtags && hashtags.length > 0 && (
              <div className="space-y-2 border-t border-border pt-4">
                <div className="flex items-center gap-1.5 text-sm">
                  <HashIcon size={14} className="text-muted-foreground" />
                  <span className="text-muted-foreground">Hashtags:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {hashtags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Tags section */}
            {definition.tags && definition.tags.length > 0 && (
              <div className="space-y-2 border-t border-border pt-4">
                <div className="flex items-center gap-1.5 text-sm">
                  <TagIcon size={14} className="text-muted-foreground" />
                  <span className="text-muted-foreground">Tags:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {definition.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      <span className="font-semibold mr-1">{tag.name}:</span> {tag.value}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Award details if present */}
            {award && (
              <div className="space-y-4 border-t border-border pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <CalendarIcon size={14} className="text-muted-foreground" />
                  <span className="text-muted-foreground">Awarded on:</span>
                  <span>{new Date(award.awardedAt * 1000).toLocaleDateString()}</span>
                </div>
                
                {/* Award participants */}
                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground min-w-[80px]">Awarded by:</span>
                    {awarderStatus === 'loading' ? (
                      <Skeleton className="h-6 w-32" />
                    ) : (
                      <Link to={`/profile/${awarderNpub}`} className="flex items-center gap-2 hover:underline text-primary">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={awarderProfile?.image} />
                          <AvatarFallback className="text-xs"><UserIcon size={10} /></AvatarFallback>
                        </Avatar>
                        <span>{awarderProfile?.displayName || awarderProfile?.name || ellipsis(awarderNpub, 12)}</span>
                      </Link>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground min-w-[80px]">Awarded to:</span>
                    {recipientStatus === 'loading' ? (
                      <Skeleton className="h-6 w-32" />
                    ) : (
                      <Link to={`/profile/${recipientNpub}`} className="flex items-center gap-2 hover:underline text-primary">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={recipientProfile?.image} />
                          <AvatarFallback className="text-xs"><UserIcon size={10} /></AvatarFallback>
                        </Avatar>
                        <span>{recipientProfile?.displayName || recipientProfile?.name || ellipsis(recipientNpub, 12)}</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
