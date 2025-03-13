import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { useSubscription } from 'nostr-hooks';
import { useEffect, useMemo } from 'react';

export const useNoteReactions = (event: NDKEvent | undefined) => {
  // For likes
  const likesSubId = event ? `note-all-likes-${event.id}` : undefined;
  const { createSubscription: createLikesSubscription, events: likesEvents, isLoading: isLoadingLikes } = 
    useSubscription(likesSubId);

  // For zaps
  const zapsSubId = event ? `note-all-zaps-${event.id}` : undefined;
  const { createSubscription: createZapsSubscription, events: zapsEvents, isLoading: isLoadingZaps } = 
    useSubscription(zapsSubId);

  // Filter valid likes (content === '+')
  const likes = useMemo(() => 
    likesEvents?.filter(e => e.content === '+').sort((a, b) => (b.created_at || 0) - (a.created_at || 0))
  , [likesEvents]);

  // Sort zaps by amount
  const zaps = useMemo(() => 
    zapsEvents?.sort((a, b) => (b.created_at || 0) - (a.created_at || 0))
  , [zapsEvents]);

  // Subscribe to likes
  useEffect(() => {
    if (!event) return;
    
    createLikesSubscription({
      filters: [{ kinds: [NDKKind.Reaction], '#e': [event.id], limit: 100 }],
      opts: { groupableDelay: 500 },
    });
  }, [event, createLikesSubscription]);

  // Subscribe to zaps
  useEffect(() => {
    if (!event) return;
    
    createZapsSubscription({
      filters: [{ kinds: [NDKKind.Zap], '#e': [event.id], limit: 100 }],
      opts: { groupableDelay: 500 },
    });
  }, [event, createZapsSubscription]);

  return { 
    likes, 
    zaps, 
    isLoading: isLoadingLikes || isLoadingZaps 
  };
};
