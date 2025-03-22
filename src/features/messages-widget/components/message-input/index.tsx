import React, { useState, useRef, useEffect } from 'react';
import { NDKUser } from '@nostr-dev-kit/ndk';
import { AtSign } from 'lucide-react';
import { Textarea } from '@/shared/components/ui/textarea';
import { Button } from '@/shared/components/ui/button';
import { ContactSearchModal } from '../contact-search-modal';
import { formatUserMention, insertMentionInText } from './mention-helpers';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export const MessageInput = ({
  value,
  onChange,
  onSend,
  placeholder = 'Type a message...',
  disabled = false
}: MessageInputProps) => {
  const [isMentionModalOpen, setIsMentionModalOpen] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Simple debug to ensure onChange is working
  useEffect(() => {
    console.log("MessageInput current value:", value);
  }, [value]);

  const handleMentionButtonClick = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
      setIsMentionModalOpen(true);
    }
  };

  const handleMentionUser = (user: NDKUser) => {
    console.log('User selected for mention:', user);
    
    if (!user || !user.npub) {
      console.error("Invalid user selected");
      return;
    }
    
    // Format the mention string
    const mention = formatUserMention(user);
    console.log('Formatted mention:', mention);
    
    // Insert the mention at cursor position
    const { newText, newCursorPosition } = insertMentionInText(
      value || '', 
      mention, 
      cursorPosition
    );
    
    console.log('New text with mention:', newText);
    
    // Update the input value
    onChange(newText);
    
    // Focus back to textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && onSend) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="relative">
      <div className="flex flex-col space-y-2">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="min-h-[80px] pr-10"
            disabled={disabled}
          />
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-2 top-2 h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={handleMentionButtonClick}
            title="Mention a user"
            type="button"
            disabled={disabled}
          >
            <AtSign className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={onSend} 
            disabled={disabled || !value?.trim()} 
            type="button"
          >
            Send
          </Button>
        </div>
      </div>

      {isMentionModalOpen && (
        <ContactSearchModal
          isOpen={isMentionModalOpen}
          onClose={() => setIsMentionModalOpen(false)}
          onSelect={handleMentionUser}
        />
      )}
    </div>
  );
};
