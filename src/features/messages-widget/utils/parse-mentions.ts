import { nip19 } from 'nostr-tools';

export interface ParsedTag {
  type: 'mention' | 'hashtag';
  text: string;
  value: string;
  index: number;
  length: number;
}

/**
 * Parses text for mentions (@username) and hashtags (#topic)
 */
export const parseMentionsAndHashtags = (text: string): ParsedTag[] => {
  const mentionRegex = /@([a-zA-Z0-9_.]+)/g;
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
  
  const tags: ParsedTag[] = [];
  
  
  let match: RegExpExecArray | null;
  while ((match = mentionRegex.exec(text)) !== null) {
    const fullMatch = match[0]; 
    const username = match[1]; 
    
    tags.push({
      type: 'mention',
      text: fullMatch,
      value: username,
      index: match.index,
      length: fullMatch.length
    });
  }
  
  
  while ((match = hashtagRegex.exec(text)) !== null) {
    const fullMatch = match[0]; 
    const tag = match[1]; 
    
    tags.push({
      type: 'hashtag',
      text: fullMatch,
      value: tag,
      index: match.index,
      length: fullMatch.length
    });
  }
  
  
  return tags.sort((a, b) => a.index - b.index);
};

/**
 * Attempts to convert an npub or hex pubkey into the other format
 */
export const normalizePublicKey = (pubkey: string): string => {
  
  if (/^[0-9a-f]{64}$/i.test(pubkey)) {
    return pubkey;
  }
  
  
  if (pubkey.startsWith('npub1')) {
    try {
      const { type, data } = nip19.decode(pubkey);
      if (type === 'npub') {
        return data as string;
      }
    } catch (e) {
      console.error('Invalid npub:', e);
    }
  }
  
  return pubkey;
};

/**
 * Converts a mention (@username or @npub) to a proper pubkey if possible
 */
export const resolveMention = (mention: string): string | null => {
  
  const value = mention.startsWith('@') ? mention.substring(1) : mention;
  
  
  if (value.startsWith('npub1')) {
    return normalizePublicKey(value);
  }
  
  
  
  return null;
};
