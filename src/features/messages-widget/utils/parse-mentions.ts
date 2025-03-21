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
  
  // Find mentions
  let match: RegExpExecArray | null;
  while ((match = mentionRegex.exec(text)) !== null) {
    const fullMatch = match[0]; // e.g., "@username"
    const username = match[1]; // e.g., "username"
    
    tags.push({
      type: 'mention',
      text: fullMatch,
      value: username,
      index: match.index,
      length: fullMatch.length
    });
  }
  
  // Find hashtags
  while ((match = hashtagRegex.exec(text)) !== null) {
    const fullMatch = match[0]; // e.g., "#topic"
    const tag = match[1]; // e.g., "topic"
    
    tags.push({
      type: 'hashtag',
      text: fullMatch,
      value: tag,
      index: match.index,
      length: fullMatch.length
    });
  }
  
  // Sort by position in text
  return tags.sort((a, b) => a.index - b.index);
};

/**
 * Attempts to convert an npub or hex pubkey into the other format
 */
export const normalizePublicKey = (pubkey: string): string => {
  // If it's already a hex pubkey
  if (/^[0-9a-f]{64}$/i.test(pubkey)) {
    return pubkey;
  }
  
  // If it's an npub, try to convert to hex
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
  // Remove the @ symbol
  const value = mention.startsWith('@') ? mention.substring(1) : mention;
  
  // If it looks like an npub, try to convert it
  if (value.startsWith('npub1')) {
    return normalizePublicKey(value);
  }
  
  // For usernames, we'd need a separate NIP-05 resolution service
  // which isn't implemented here
  return null;
};
