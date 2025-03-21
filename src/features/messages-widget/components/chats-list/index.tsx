import { NDKEvent, NDKKind, NDKUser } from '@nostr-dev-kit/ndk';
import { useActiveUser, useNdk, useSubscription } from 'nostr-hooks';
import { memo, useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { FloatingEmojiPicker } from '@/shared/components/emoji-picker';
import { AtSign, Hash, SendIcon, SmileIcon, Users } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

import { ChatItem } from '../chat-item';
import { ProfileHeader } from '../profile-header';
import { ContactSearchModal } from '../contact-search-modal';

export const ChatsList = memo(
  ({ npub }: { npub: string }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showContactsModal, setShowContactsModal] = useState(false);
    const [selectedMention, setSelectedMention] = useState<{start: number, end: number} | null>(null);
    
    const inputRef = useRef<HTMLInputElement>(null);

    const { activeUser } = useActiveUser();
    const { ndk } = useNdk();

    const subId = activeUser ? `messages-${activeUser.pubkey}` : undefined;
    const { createSubscription, events } = useSubscription(subId);

    useEffect(() => {
      if (!activeUser) {
        return;
      }

      createSubscription({
        filters: [
          { kinds: [NDKKind.EncryptedDirectMessage], '#p': [activeUser.pubkey] },
          { kinds: [NDKKind.EncryptedDirectMessage], authors: [activeUser.pubkey] },
        ],
      });
    }, [activeUser, createSubscription]);

    const targetUser = useMemo(() => new NDKUser({ npub }), [npub]);

    const chats = useMemo(() => {
      if (!activeUser) {
        return [];
      }

      if (!events || events.length === 0) {
        return [];
      }

      const targetPubkey = targetUser.pubkey;

      return (events ?? []).filter(
        (e) =>
          e.pubkey === targetPubkey || e.tags.some((t) => t[0] === 'p' && t[1] === targetPubkey),
      );
    }, [events, targetUser, activeUser]);

    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chats]);

    // This function detects mentions and hashtags in input
    const extractTags = (content: string) => {
      const mentionRegex = /@([a-zA-Z0-9_]+)/g;
      const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
      
      const mentions = Array.from(content.matchAll(mentionRegex)).map(match => ({
        type: 'mention',
        text: match[0],
        name: match[1],
        index: match.index || 0
      }));
      
      const hashtags = Array.from(content.matchAll(hashtagRegex)).map(match => ({
        type: 'hashtag',
        text: match[0],
        tag: match[1],
        index: match.index || 0
      }));
      
      return [...mentions, ...hashtags].sort((a, b) => a.index - b.index);
    };

    const handleMentionSelect = (user: NDKUser) => {
      if (!inputRef.current || selectedMention === null) return;
      
      const beforeMention = input.substring(0, selectedMention.start);
      const afterMention = input.substring(selectedMention.end);
      
      // Replace the current @mention text with the selected user's name or npub
      const newText = `${beforeMention}@${user.npub} ${afterMention}`;
      setInput(newText);
      
      // Reset mention selection state
      setSelectedMention(null);
      
      // Focus back on the input after selection
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInput(newValue);
      
      // Find if cursor is positioned at a mention
      const cursorPos = e.target.selectionStart || 0;
      const textBeforeCursor = newValue.substring(0, cursorPos);
      
      // Check if we're typing a mention (after @)
      const mentionMatch = /@(\w*)$/.exec(textBeforeCursor);
      if (mentionMatch) {
        const start = mentionMatch.index;
        const end = start + mentionMatch[0].length;
        setSelectedMention({ start, end });
        setShowContactsModal(true);
      } else {
        setSelectedMention(null);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    };

    const sendMessage = useCallback(async () => {
      if (!ndk || !activeUser || !input.trim()) {
        return;
      }

      const u = new NDKUser({ npub });

      // Extract mentions and hashtags for tags
      const tags: string[][] = [['p', u.pubkey]];
      const extractedTags = extractTags(input);
      
      // Process extracted tags for Nostr format
      extractedTags.forEach(item => {
        if (item.type === 'mention') {
          // Here you would ideally resolve the mention to a pubkey
          // For now we'll just include the mention text
          // In a real implementation, you'd need to resolve @username to pubkey
          // tags.push(['p', pubkeyFromMention]);
        } else if (item.type === 'hashtag' && 'tag' in item) {
          tags.push(['t', item.tag]);
        }
      });

      try {
        const encrypted = await ndk.signer?.encrypt(u, input, 'nip04');

        if (!encrypted) {
          return;
        }

        const e = new NDKEvent(ndk);
        e.kind = NDKKind.EncryptedDirectMessage;
        e.content = encrypted;
        e.tags = tags;
        await e.publish();

        setInput('');
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    }, [ndk, activeUser, input, npub, extractTags]);

    const onEmojiClick = (emojiData: any) => {
      setInput((prev) => prev + emojiData.emoji);
      setShowEmojiPicker(false);
    };

    return (
      <>
        <div className="w-full h-full overflow-hidden flex flex-col justify-between">
          <ProfileHeader user={targetUser} />
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chats.map((chat) => (
              <ChatItem key={chat.id} chat={chat} targetUser={targetUser} />
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-4 border-t">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full hover:bg-muted"
                onClick={() => setShowContactsModal(true)}
                title="Mention a contact"
              >
                <Users size={18} />
              </Button>
              
              <div className="relative flex-1">
                <Input
                  ref={inputRef}
                  placeholder="Type a message..."
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className="pr-20"
                />
                
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <FloatingEmojiPicker
                    isOpen={showEmojiPicker}
                    onClose={() => setShowEmojiPicker(false)}
                    onEmojiClick={onEmojiClick}
                    variant="compact"
                    position="top"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="h-8 w-8 rounded-full hover:bg-muted"
                    >
                      <SmileIcon size={18} />
                    </Button>
                  </FloatingEmojiPicker>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={sendMessage}
                    disabled={!input.trim()}
                    className="h-8 w-8 rounded-full hover:bg-muted"
                  >
                    <SendIcon size={18} />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex mt-2 flex-col gap-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <AtSign size={12} />
                <span>@username for mentions</span>
              </div>
              <div className="flex items-center gap-1">
                <Hash size={12} />
                <span>#hashtag for topics</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Contact search modal */}
        <ContactSearchModal 
          isOpen={showContactsModal}
          onClose={() => setShowContactsModal(false)}
          onSelect={handleMentionSelect}
          searchQuery={selectedMention ? input.substring(selectedMention.start + 1, selectedMention.end) : ''}
        />
      </>
    );
  },
  (prev, next) => prev.npub === next.npub,
);
