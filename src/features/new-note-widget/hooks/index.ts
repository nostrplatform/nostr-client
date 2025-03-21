import { NDKEvent, NDKUser } from '@nostr-dev-kit/ndk';
import { useActiveUser, useNdk } from 'nostr-hooks';
import { useCallback, useEffect, useState } from 'react';

import { useToast } from '@/shared/components/ui/use-toast';

import { parseMentionsAndHashtags } from '../../messages-widget/utils/parse-mentions';
import { normalizePublicKey } from '../../messages-widget/utils/parse-mentions';

export const useNewNoteWidget = ({
  replyingToEvent,
}: {
  replyingToEvent?: NDKEvent | undefined;
}) => {
  const [content, setContent] = useState('');
  const { ndk } = useNdk();
  const { activeUser } = useActiveUser();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (activeUser) {
      activeUser.fetchProfile().then(setProfile);
    }
  }, [activeUser]);

  // Process mentions and hashtags in the content
  const processTagsInContent = (content: string) => {
    const parsedTags = parseMentionsAndHashtags(content);
    const tags: string[][] = [];
    
    parsedTags.forEach(tag => {
      if (tag.type === 'mention') {
        // Extract the pubkey from the mention text (after the @ symbol)
        const mentionText = tag.text.substring(1).trim();
        
        // Check if it's an npub or hex format pubkey
        if (mentionText.startsWith('npub1')) {
          try {
            const pubkey = normalizePublicKey(mentionText);
            if (pubkey) {
              tags.push(['p', pubkey]); // Add as a 'p' tag
            }
          } catch (e) {
            console.error('Invalid npub:', e);
          }
        }
      } else if (tag.type === 'hashtag') {
        // Extract hashtag without the # symbol
        const hashtagText = tag.value;
        if (hashtagText) {
          tags.push(['t', hashtagText]); // Add as a 't' tag
        }
      }
    });
    
    return tags;
  };

  const post = useCallback(() => {
    if (!ndk) {
      toast({
        title: 'Error',
        description: 'NDK not initialized',
        variant: 'destructive',
      });
      return;
    }

    const e = new NDKEvent(ndk);
    e.kind = 1;
    e.content = content;
    
    // Add tags from mentions and hashtags
    let tags = processTagsInContent(content);

    if (replyingToEvent) {
      const rootTag = replyingToEvent.tags.find((tag) => tag.length > 3 && tag[3] === 'root');

      if (rootTag) {
        tags.push(['e', rootTag[1], rootTag[2] || '', 'root']);
        tags.push(['e', replyingToEvent.id, '', 'reply']);
      } else {
        tags.push(['e', replyingToEvent.id, '', 'root']);
      }

      // Add p-tags from the replied-to event
      replyingToEvent.tags.forEach((tag) => {
        if (tag.length > 0 && tag[0] === 'p') {
          // Check if this p-tag is already in our tags (to avoid duplicates)
          if (!tags.some(t => t[0] === 'p' && t[1] === tag[1])) {
            tags.push(tag);
          }
        }
      });

      // Make sure we add the author of the replied-to event
      if (!tags.some(t => t[0] === 'p' && t[1] === replyingToEvent.pubkey)) {
        tags.push(['p', replyingToEvent.pubkey]);
      }
    }

    e.tags = tags;

    e.publish()
      .then((relaySet) => {
        if (relaySet.size === 0) {
          toast({
            title: 'Error',
            description: 'Failed to post note',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Success',
            description: 'Note posted successfully',
          });
        }
      })
      .catch((error) => {
        console.error('Failed to post note:', error);
        toast({
          title: 'Error',
          description: 'Failed to post note',
          variant: 'destructive',
        });
      });
  }, [ndk, content, replyingToEvent, toast]);

  return { content, setContent, post, profile };
};
