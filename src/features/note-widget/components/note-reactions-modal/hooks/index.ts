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

  // For reposts
  const repostsSubId = event ? `note-all-reposts-${event.id}` : undefined;
  const { 
    createSubscription: createRepostsSubscription, 
    events: repostsEvents, 
    isLoading: isLoadingReposts 
  } = useSubscription(repostsSubId);

  // Filter valid likes (content === '+')
  const likes = useMemo(() => 
    [...(likesEvents || [])].filter(e => e.content === '+').sort((a, b) => (b.created_at || 0) - (a.created_at || 0))
  , [likesEvents]);

  // Sort zaps by amount
  const zaps = useMemo(() => 
    [...(zapsEvents || [])].sort((a, b) => (b.created_at || 0) - (a.created_at || 0))
  , [zapsEvents]);

  // Filter and sort reposts
  const reposts = useMemo(() => 
    [...(repostsEvents || [])].sort((a, b) => (b.created_at || 0) - (a.created_at || 0))
  , [repostsEvents]);

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

  // Subscribe to reposts
  useEffect(() => {
    if (!event) return;
    
    createRepostsSubscription({
      filters: [{ kinds: [NDKKind.Repost], '#e': [event.id], limit: 100 }],
      opts: { groupableDelay: 500 },
    });
  }, [event, createRepostsSubscription]);

  return { 
    likes, 
    zaps,
    reposts, 
    isLoading: isLoadingLikes || isLoadingZaps || isLoadingReposts 
  };
};
