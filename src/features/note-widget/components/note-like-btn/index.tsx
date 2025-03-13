import { NDKEvent } from '@nostr-dev-kit/ndk';
import { HeartIcon, Heart } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils';
import { useNoteLikeBtn } from './hooks';

export const NoteLikeBtn = ({ event, inView }: { event: NDKEvent; inView: boolean }) => {
  const { count, isLikedByMe, like } = useNoteLikeBtn(inView ? event : undefined);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAnimating(true);
    like();
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <Button
      variant="link"
      className={cn('px-0', isLikedByMe ? 'text-red-600' : 'opacity-50 hover:opacity-100')}
      onClick={handleLike}
    >
      <div className={isAnimating ? 'animate-heartBeat' : ''}>
        {isLikedByMe ? <Heart size={18} fill="currentColor" /> : <HeartIcon size={18} />}
      </div>
      <span className="ml-1 text-xs">{count < 1000 ? count : '1K+'}</span>
    </Button>
  );
};
