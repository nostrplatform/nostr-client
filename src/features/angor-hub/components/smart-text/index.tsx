import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { useRealtimeProfile } from 'nostr-hooks';

interface SmartTextProps {
  text: string;
  className?: string;
}

export const SmartText = ({ text, className = '' }: SmartTextProps) => {
  // Parse the text and replace npubs and hashtags with components
  const [parsedContent, setParsedContent] = useState<React.ReactNode[]>([]);

  useEffect(() => {
    const parseText = async () => {
      if (!text) {
        setParsedContent([]);
        return;
      }

      try {
        // Regular expressions for matching npubs and hashtags
        const npubRegex = /npub1[a-zA-Z0-9]{58}/g;
        const hashtagRegex = /#[\p{L}0-9_]+/gu;

        let lastIndex = 0;
        const contentParts: React.ReactNode[] = [];
        const matches: { index: number; length: number; node: React.ReactNode }[] = [];

        // Find npub matches
        let npubMatch;
        const textToSearch = text || '';
        
        // Reset regex lastIndex
        npubRegex.lastIndex = 0;
        
        while ((npubMatch = npubRegex.exec(textToSearch)) !== null) {
          const npub = npubMatch[0];
          matches.push({
            index: npubMatch.index,
            length: npub.length,
            node: <NpubLink key={`npub-${npubMatch.index}`} npub={npub} />
          });
        }

        // Find hashtag matches
        let hashtagMatch;
        hashtagRegex.lastIndex = 0;
        
        while ((hashtagMatch = hashtagRegex.exec(textToSearch)) !== null) {
          const hashtag = hashtagMatch[0];
          matches.push({
            index: hashtagMatch.index,
            length: hashtag.length,
            node: <HashtagLink key={`hashtag-${hashtagMatch.index}`} hashtag={hashtag} />
          });
        }

        // Sort matches by index
        matches.sort((a, b) => a.index - b.index);

        // Build the parsed content
        for (const match of matches) {
          if (match.index > lastIndex) {
            contentParts.push(textToSearch.substring(lastIndex, match.index));
          }
          contentParts.push(match.node);
          lastIndex = match.index + match.length;
        }

        if (lastIndex < textToSearch.length) {
          contentParts.push(textToSearch.substring(lastIndex));
        }

        setParsedContent(contentParts.length ? contentParts : [text]);
      } catch (error) {
        console.error('Error parsing text:', error);
        setParsedContent([text]);
      }
    };

    parseText();
  }, [text]);

  if (!text) return null;

  return (
    <span className={`${className} break-words`}>
      {parsedContent.length ? parsedContent : text}
    </span>
  );
};

// Component for rendering npub links with names
const NpubLink = ({ npub }: { npub: string }) => {
  // Try to decode the npub to get the hex pubkey
  let hexPubkey = '';
  try {
    const { type, data } = nip19.decode(npub);
    if (type === 'npub') {
      hexPubkey = data as string;
    }
  } catch (e) {
    console.error('Invalid npub format:', npub);
    // Return the original npub as text if we can't decode
    return <span className="break-all">{npub}</span>;
  }

  // Use the hook to fetch profile data for this pubkey
  const { profile } = useRealtimeProfile(hexPubkey);

  // If we have a profile, show the name, otherwise show shortened npub
  const displayText = profile?.name || profile?.display_name || `${npub.slice(0, 5)}...${npub.slice(-3)}`;

  return (
    <Link 
      to={`/profile/${npub}`}
      className="text-primary hover:underline font-medium inline-block max-w-full"
    >
      @{displayText}
    </Link>
  );
};

// Component for rendering hashtag links
const HashtagLink = ({ hashtag }: { hashtag: string }) => {
  return (
    <Link 
      to={`/search?q=${encodeURIComponent(hashtag)}`}
      className="text-primary hover:underline font-medium"
    >
      {hashtag}
    </Link>
  );
};
