import { NDKEvent, NDKUser, zapInvoiceFromEvent } from '@nostr-dev-kit/ndk';
import { useRealtimeProfile } from 'nostr-hooks';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ZapIcon, ThumbsUp, Share } from 'lucide-react';

import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/components/ui/avatar';
import { ScrollArea } from '@/shared/components/ui/scroll-area';

import { useNoteReactions } from './hooks';

interface NoteReactionsModalProps {
  event: NDKEvent;
  onClose?: () => void;
}

const LoadingUser = () => (
  <div className="flex items-center gap-3 p-3 animate-pulse">
    <div className="h-8 w-8 rounded-full bg-muted" />
    <div className="flex-1 space-y-2">
      <div className="h-4 w-24 bg-muted rounded" />
      <div className="h-3 w-32 bg-muted rounded" />
    </div>
  </div>
);

export const NoteReactionsModal = ({ event }: NoteReactionsModalProps) => {
  const { likes, zaps, reposts, isLoading } = useNoteReactions(event);

  return (
    <DialogContent className="w-[90vw] max-w-[600px] max-h-[600px]">
      <DialogHeader className="relative">
        <DialogTitle>Reactions</DialogTitle>
      </DialogHeader>
      
      <Tabs defaultValue="likes" className="w-full">
        <TabsList className="grid w-full grid-cols-3 gap-1">
          {["likes", "zaps", "reposts"].map((tab) => (
            <TabsTrigger 
              key={tab} 
              value={tab}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <div className="truncate text-sm px-2">
                {tab.charAt(0).toUpperCase() + tab.slice(1)} (
                {tab === "likes" ? likes.length :
                 tab === "zaps" ? zaps.length :
                 reposts.length})
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-4" style={{ height: '400px' }}>
          <TabsContent value="likes" className="h-full m-0 p-0">
            <ScrollArea className="h-full pr-4">
              {isLoading ? (
                <div className="space-y-2">
                  <LoadingUser />
                  <LoadingUser />
                  <LoadingUser />
                </div>
              ) : likes.length > 0 ? (
                <div className="space-y-2 pb-4">
                  {likes.map((like) => (
                    <ReactionUser key={like.id} event={like} type="like" />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <Heart size={40} className="mx-auto mb-4 text-muted-foreground/30" />
                  <p>No likes yet</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="zaps" className="h-full m-0 p-0">
            <ScrollArea className="h-full pr-4">
              {isLoading ? (
                <div className="space-y-2">
                  <LoadingUser />
                  <LoadingUser />
                  <LoadingUser />
                </div>
              ) : zaps.length > 0 ? (
                <div className="space-y-2 pb-4">
                  {zaps.map((zap) => (
                    <ZapUser key={zap.id} event={zap} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <ZapIcon size={40} className="mx-auto mb-4 text-muted-foreground/30" />
                  <p>No zaps yet</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="reposts" className="h-full m-0 p-0">
            <ScrollArea className="h-full pr-4">
              {isLoading ? (
                <div className="space-y-2">
                  <LoadingUser />
                  <LoadingUser />
                  <LoadingUser />
                </div>
              ) : reposts.length > 0 ? (
                <div className="space-y-2 pb-4">
                  {reposts.map((repost) => (
                    <ReactionUser key={repost.id} event={repost} type="repost" />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <Share size={40} className="mx-auto mb-4 text-muted-foreground/30" />
                  <p>No reposts yet</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </DialogContent>
  );
};

const ReactionUser = ({ event, type }: { event: NDKEvent; type: 'like' | 'repost' }) => {
  const { profile } = useRealtimeProfile(event.pubkey);
  const npub = useMemo(() => event.author?.npub || '', [event.author]);
  
  const icon = type === 'like' ? <Heart size={16} className="text-red-500" /> : <ThumbsUp size={16} />;

  if (profile === undefined) return <LoadingUser />;

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
  if (profile === undefined) return <LoadingUser />;
  
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
