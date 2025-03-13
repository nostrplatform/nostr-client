import { NDKEvent } from '@nostr-dev-kit/ndk';
import { ZapIcon } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils';

import { ZapWidget } from '@/features/zap-widget';

import { useNoteZapBtn } from './hooks';

export const NoteZapBtn = ({ event, inView }: { event: NDKEvent; inView: boolean }) => {
  const { totalAmount, isZapedByMe } = useNoteZapBtn(inView ? event : undefined);

  const zapButton = (
    <Button
      variant="link"
      className={cn('px-0', isZapedByMe ? 'text-orange-600' : 'opacity-50 hover:opacity-100')}
    >
      <div>
        <ZapIcon size={18} />
      </div>
      <span className="ml-1 text-xs">{totalAmount < 1000 ? totalAmount : '1K+'}</span>
    </Button>
  );

  if (!inView) {
    return zapButton;
  }

  // Removed NoteReactionsModal from here since it's now in the menu
  return (
    <ZapWidget target={event}>
      <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        {zapButton}
      </div>
    </ZapWidget>
  );
};
