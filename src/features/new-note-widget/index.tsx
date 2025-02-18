import { NDKEvent } from '@nostr-dev-kit/ndk';
import { CornerDownRightIcon, ImageIcon, HashIcon, BoldIcon, ItalicIcon, LinkIcon } from 'lucide-react';
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
  const [isFocused, setIsFocused] = useState(false);

  const onEmojiClick = (emojiData: any) => {
    setContent((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const characterCount = content.length;
  const maxCharacters = 280;

   return (
    <div className="px-4 py-3">
      <div
        className={cn(
          'rounded-xl bg-background border transition-all duration-200',
          isFocused ? 'shadow-lg border-primary/30' : 'shadow-sm hover:border-muted-foreground/30',
          replyingToEvent && 'ml-6 border-l-4 border-l-primary/20'
        )}
      >
        <div className="p-4">
          <div className="flex gap-3">
            {replyingToEvent && (
              <div className="absolute -ml-8 mt-2 text-muted-foreground">
                <CornerDownRightIcon size={16} />
              </div>
            )}

            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.image} alt={profile?.name} className="object-cover" />
              <AvatarFallback className="bg-muted" />
            </Avatar>

            <div className="flex-1 flex flex-col gap-3">
              <div className="flex gap-2 relative">
                <Textarea
                  className="bg-background w-full min-h-[100px] resize-none p-0 border-0 focus-visible:ring-0"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="What's on your mind?"
                  maxLength={maxCharacters}
                />
              </div>

              <div className="flex items-center justify-between border-t pt-3 mt-1">
                <div className="flex items-center gap-0.5">
                  <FloatingEmojiPicker
                    isOpen={showEmojiPicker}
                    onClose={() => setShowEmojiPicker(false)}
                    onEmojiClick={onEmojiClick}
                    variant="compact"
                    position="bottom"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="h-9 w-9 rounded-full hover:bg-muted"
                    >
                      😊
                    </Button>
                  </FloatingEmojiPicker>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full hover:bg-muted"
                    title="Attach image"
                  >
                    <ImageIcon size={18} />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full hover:bg-muted"
                    title="Add hashtag"
                  >
                    <HashIcon size={18} />
                  </Button>
                </div>

                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-sm",
                    characterCount > maxCharacters * 0.9 ? "text-destructive" : "text-muted-foreground"
                  )}>
                    {characterCount}/{maxCharacters}
                  </span>
                  <Button 
                    onClick={post}
                    disabled={characterCount === 0 || characterCount > maxCharacters}
                    className="rounded-full px-6"
                  >
                    Post
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
