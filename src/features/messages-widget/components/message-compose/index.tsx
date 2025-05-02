import { useState, useRef } from 'react';
import { NDKUser } from '@nostr-dev-kit/ndk';
import { AtSign } from 'lucide-react';
import { Textarea } from '@/shared/components/ui/textarea';
import { Button } from '@/shared/components/ui/button';
import { ContactSearchModal } from '../contact-search-modal';
import { insertMentionInText } from '../message-input/mention-helpers';



export const MessageComposeBox = (/* your existing props */) => {
  const [message, setMessage] = useState('');
  const [isMentionModalOpen, setIsMentionModalOpen] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  

  const openMentionModal = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
      setIsMentionModalOpen(true);
    }
  };

  const handleSelectUser = (user: NDKUser) => {
    console.log('User selected:', user);
    if (!user || !user.npub) return;
    
    
    const profile = user.profile || {};
    const displayName = profile.displayName || profile.name || user.npub?.slice(0, 8) + '...';
    
    
    const mention = displayName.startsWith('@') ? displayName : `@${displayName}`;
    
    
    const { newText, newCursorPosition } = insertMentionInText(
      message, 
      mention, 
      cursorPosition
    );
    
    console.log('Setting message to:', newText);
    setMessage(newText);
    
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);
  };

  
  
  return (
    <div className="relative">
      <div className="flex flex-col space-y-2">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="min-h-[80px] resize-none pr-10"
          />
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-2 top-2 h-6 w-6"
            onClick={openMentionModal}
            title="Mention a user"
            type="button"
          >
            <AtSign className="h-4 w-4" />
          </Button>
        </div>
        
        
      </div>

      <ContactSearchModal
        isOpen={isMentionModalOpen}
        onClose={() => setIsMentionModalOpen(false)}
        onSelect={handleSelectUser}
      />
    </div>
  );
};
