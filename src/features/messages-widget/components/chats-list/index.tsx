import { NDKEvent, NDKKind, NDKUser } from '@nostr-dev-kit/ndk';
import { useActiveUser, useNdk, useSubscription } from 'nostr-hooks';
import { memo, useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { FloatingEmojiPicker } from '@/shared/components/emoji-picker';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

import { ChatItem } from '../chat-item';
import { ProfileHeader } from '../profile-header';

export const ChatsList = memo(
  ({ npub }: { npub: string }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

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

    const sendMessage = useCallback(async () => {
      if (!ndk || !activeUser) {
        return;
      }

      const u = new NDKUser({ npub });

      const encrypted = await ndk.signer?.encrypt(u, input, 'nip04');

      if (!encrypted) {
        return;
      }

      const e = new NDKEvent(ndk);
      e.kind = NDKKind.EncryptedDirectMessage;
      e.content = encrypted;
      e.tags = [['p', u.pubkey]];
      e.publish();

      setInput('');
    }, [ndk, activeUser, input, npub, setInput]);

    const onEmojiClick = (emojiData: any) => {
      setInput((prev) => prev + emojiData.emoji);
      setShowEmojiPicker(false);
    };

    return (
      <>
        <div className="w-full h-full overflow-hidden flex flex-col justify-between">
          <ProfileHeader user={targetUser} />
          <div className="flex flex-col gap-4 overflow-y-auto h-full w-full p-4">
            {(chats || []).map((chat) => (
              <ChatItem key={chat.id} chat={chat} targetUser={targetUser} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex items-center gap-2 border-t p-4">
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
                className="h-10 w-10"
              >
                😊
              </Button>
            </FloatingEmojiPicker>

            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && input.trim()) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />

            <Button
              onClick={sendMessage}
              disabled={!input}
            >
              Send
            </Button>
          </div>
        </div>
      </>
    );
  },
  (prev, next) => prev.npub === next.npub,
);
