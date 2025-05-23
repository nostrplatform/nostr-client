import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { useRealtimeProfile } from 'nostr-hooks';

interface SmartTextProps {
  text: string;
  className?: string;
}

export const SmartText = ({ text, className = '' }: SmartTextProps) => {
  
  const [parsedContent, setParsedContent] = useState<React.ReactNode[]>([]);

  useEffect(() => {
    const parseText = async () => {
      if (!text) {
        setParsedContent([]);
        return;
      }

      try {
        
        const npubRegex = /npub1[a-zA-Z0-9]{58}/g;
        const hashtagRegex = /#[\p{L}0-9_]+/gu;

        let lastIndex = 0;
        const contentParts: React.ReactNode[] = [];
        const matches: { index: number; length: number; node: React.ReactNode }[] = [];

        
        let npubMatch;
        const textToSearch = text || '';
        
        
        npubRegex.lastIndex = 0;
        
        while ((npubMatch = npubRegex.exec(textToSearch)) !== null) {
          const npub = npubMatch[0];
          matches.push({
            index: npubMatch.index,
            length: npub.length,
            node: <NpubLink key={`npub-${npubMatch.index}`} npub={npub} />
          });
        }

        
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

        
        matches.sort((a, b) => a.index - b.index);

        
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


const NpubLink = ({ npub }: { npub: string }) => {
  
  let hexPubkey = '';
  try {
    const { type, data } = nip19.decode(npub);
    if (type === 'npub') {
      hexPubkey = data as string;
    }
  } catch (e) {
    console.error('Invalid npub format:', npub);
    
    return <span className="break-all">{npub}</span>;
  }

  
  const { profile } = useRealtimeProfile(hexPubkey);

  
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
