import { NDKEvent, NDKUser, zapInvoiceFromEvent } from '@nostr-dev-kit/ndk';
import { useRealtimeProfile } from 'nostr-hooks';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ZapIcon, ThumbsUp } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/components/ui/avatar';

import { useNoteReactions } from './hooks';

export const NoteReactionsModal = ({
  event,
  children,
  trigger
}: {
  event: NDKEvent;
  children?: React.ReactNode;
  trigger?: React.ReactNode;
}) => {
  const { likes, zaps, isLoading } = useNoteReactions(event);
  
  const hasReactions = (likes && likes.length > 0) || (zaps && zaps.length > 0);
  
  // Only show loading state when there's a trigger
  if (isLoading && trigger) {
    return trigger;
  }
  
  // If no reactions and no explicit children to show, just render the trigger
  if (!hasReactions && !children && trigger) {
    return trigger;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reactions</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="likes">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="likes" className="flex items-center gap-1">
              <Heart size={16} />
              <span>Likes ({likes?.length || 0})</span>
            </TabsTrigger>
            <TabsTrigger value="zaps" className="flex items-center gap-1">
              <ZapIcon size={16} />
              <span>Zaps ({zaps?.length || 0})</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="likes" className="max-h-96 overflow-y-auto">
            {likes && likes.length > 0 ? (
              likes.map((reaction) => (
                <ReactionUser key={reaction.id} event={reaction} type="like" />
              ))
            ) : (
              <div className="p-4 text-center text-muted-foreground">No likes yet</div>
            )}
          </TabsContent>
          
          <TabsContent value="zaps" className="max-h-96 overflow-y-auto">
            {zaps && zaps.length > 0 ? (
              zaps.map((zap) => (
                <ZapUser key={zap.id} event={zap} />
              ))
            ) : (
              <div className="p-4 text-center text-muted-foreground">No zaps yet</div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

const ReactionUser = ({ event, type }: { event: NDKEvent; type: 'like' | 'repost' }) => {
  const { profile } = useRealtimeProfile(event.pubkey);
  const npub = useMemo(() => event.author?.npub || '', [event.author]);
  
  const icon = type === 'like' ? <Heart size={16} className="text-red-500" /> : <ThumbsUp size={16} />;

  return (
    <Link to={`/profile/${npub}`}>
      <div className="flex items-center gap-3 p-3 hover:bg-muted rounded-md">
        <Avatar className="h-8 w-8">
          <AvatarImage src={profile?.image} />
          <AvatarFallback>{profile?.name?.[0] || npub[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{profile?.name || profile?.displayName || npub.slice(0, 10)}</p>
          <p className="text-sm text-muted-foreground truncate">{profile?.nip05 || npub.slice(0, 15) + '...'}</p>
        </div>
        <div>{icon}</div>
      </div>
    </Link>
  );
};

const ZapUser = ({ event }: { event: NDKEvent }) => {
  const invoice = zapInvoiceFromEvent(event);
  const pubkey = invoice?.zapper;
  const { profile } = useRealtimeProfile(pubkey);
  const npub = useMemo(() => pubkey ? new NDKUser({ pubkey }).npub : '', [pubkey]);
  const amount = (invoice?.amount || 0) / 1000;

  if (!pubkey) return null;
  
  return (
    <Link to={`/profile/${npub}`}>
      <div className="flex items-center gap-3 p-3 hover:bg-muted rounded-md">
        <Avatar className="h-8 w-8">
          <AvatarImage src={profile?.image} />
          <AvatarFallback>{profile?.name?.[0] || npub[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{profile?.name || profile?.displayName || npub.slice(0, 10)}</p>
          <p className="text-sm text-muted-foreground truncate">{profile?.nip05 || npub.slice(0, 15) + '...'}</p>
        </div>
        <div className="flex items-center gap-1 text-amber-500">
          <ZapIcon size={16} />
          <span className="font-medium">{amount} sats</span>
        </div>
      </div>
    </Link>
  );
};
