import { NDKEvent } from '@nostr-dev-kit/ndk';
import { CornerDownRightIcon } from 'lucide-react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { useTheme } from '@/shared/components/theme-provider';
import { useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { FloatingEmojiPicker } from '@/shared/components/emoji-picker';

import { cn } from '@/shared/utils';

import { useNewNoteWidget } from './hooks';

export const NewNoteWidget = ({ replyingToEvent }: { replyingToEvent?: NDKEvent | undefined }) => {
  const { content, post, setContent, profile } = useNewNoteWidget({ replyingToEvent });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { theme } = useTheme();

  const onEmojiClick = (emojiData: any) => {
    setContent((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  return (
    <>
      <div className="px-2">
        <div
          className={cn(
            'p-2 flex flex-col gap-2 border rounded-sm bg-primary/10 shadow-md transition-colors duration-500 ease-out hover:border-primary/30',
            replyingToEvent && '-mx-2 pl-4',
          )}
        >
          <div className="flex gap-2">
            {replyingToEvent && (
              <div className="pt-2 opacity-50">
                <CornerDownRightIcon size={18} />
              </div>
            )}

            <Avatar>
              <AvatarImage src={profile?.image} alt={profile?.name} className="object-cover" />
              <AvatarFallback className="bg-muted" />
            </Avatar>

            <div className="flex-1 flex flex-col gap-2">
              <Textarea
                className="bg-background w-full"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              
              <div className="flex items-center gap-2">
                <FloatingEmojiPicker
                  isOpen={showEmojiPicker}
                  onClose={() => setShowEmojiPicker(false)}
                  onEmojiClick={onEmojiClick}
                  variant="full"
                  position="bottom"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="h-8 w-8"
                  >
                    😊
                  </Button>
                </FloatingEmojiPicker>
              </div>
            </div>
          </div>

          <div className="w-full flex justify-end">
            <Button className="px-8" size="sm" onClick={post}>
              Post
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
