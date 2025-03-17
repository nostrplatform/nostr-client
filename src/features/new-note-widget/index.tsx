import { NDKEvent } from '@nostr-dev-kit/ndk';
import { CornerDownRightIcon, MicIcon, SmileIcon } from 'lucide-react';
import { useState, useEffect } from 'react';

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
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  const onEmojiClick = (emojiData: any) => {
    setContent((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const characterCount = content.length;
  const maxCharacters = 280;

  const handlePost = () => {
    post();
    setContent('');
    // Don't change focus state after posting
  };

  const handleCancel = () => {
    setContent('');
    setIsFocused(false); // Only collapse the form when cancel is clicked
  };

  const handleSpeechToText = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Speech recognition is not supported in your browser");
      return;
    }

    if (isListening && recognition) {
      recognition.stop();
      setIsListening(false);
      return;
    }
    
    // @ts-ignore - TypeScript doesn't know about SpeechRecognition API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const newRecognition = new SpeechRecognition();
    
    newRecognition.lang = 'en-US';
    newRecognition.interimResults = false;
    newRecognition.continuous = false;
    
    newRecognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setContent((prev) => {
        // Add a space before the transcript if prev doesn't end with a space
        const separator = prev && !prev.endsWith(' ') ? ' ' : '';
        return prev + separator + transcript;
      });
    };
    
    newRecognition.onend = () => {
      setIsListening(false);
      setRecognition(null);
    };
    
    setRecognition(newRecognition);
    setIsListening(true);
    newRecognition.start();
  };

  // Clean up speech recognition when component unmounts
  useEffect(() => {
    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [recognition]);

  return (
    <div className="px-4 py-3">
      <div
        className={cn(
          'rounded-xl bg-background border transition-all duration-300 ease-in-out',
          isFocused ? 'shadow-lg border-primary/30' : 'shadow-sm hover:border-muted-foreground/30',
          replyingToEvent && 'ml-6 border-l-4 border-l-primary/20'
        )}
      >
        <div className={cn(
          "transition-all duration-300", 
          isFocused || content ? "p-4" : "px-4 pt-4"
        )}>
          <div className="flex gap-3">
            {replyingToEvent && (
              <div className="absolute -ml-8 mt-2 text-muted-foreground">
                <CornerDownRightIcon size={16} />
              </div>
            )}

            <div className="w-10 flex-shrink-0">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile?.image} alt={profile?.name} className="object-cover" />
                <AvatarFallback className="bg-muted" />
              </Avatar>
            </div>

            <div className="flex-1 flex flex-col">
              <div 
                className={cn(
                  "flex flex-col transition-all duration-300 ease-in-out origin-top",
                  !isFocused && !content && "transform scale-y-95"
                )}
              >
                <Textarea
                  className={cn(
                    "bg-background w-full resize-none p-0 border-0 focus-visible:ring-0 transition-all duration-300",
                    isFocused || content ? "min-h-[100px]" : "min-h-[28px]"
                  )}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  placeholder="What's on your mind?"
                  maxLength={maxCharacters}
                />
              </div>

              <div 
                className={cn(
                  "flex items-center justify-between pt-3 mt-1 transition-all duration-300 ease-in-out origin-top",
                  isFocused || content ? "opacity-100 max-h-[100px] border-t" : "opacity-0 max-h-0 overflow-hidden"
                )}
              >
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
                      <SmileIcon size={18} />
                    </Button>
                  </FloatingEmojiPicker>

                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-9 w-9 rounded-full hover:bg-muted",
                      isListening && "bg-red-100 text-red-500"
                    )}
                    title="Voice to text"
                    onClick={handleSpeechToText}
                  >
                    <MicIcon size={18} />
                  </Button>
                </div>

                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-sm",
                    characterCount > maxCharacters * 0.9 ? "text-destructive" : "text-muted-foreground"
                  )}>
                    {characterCount}/{maxCharacters}
                  </span>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost"
                      onClick={handleCancel}
                      className="rounded-full px-6"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handlePost}
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
    </div>
  );
};
