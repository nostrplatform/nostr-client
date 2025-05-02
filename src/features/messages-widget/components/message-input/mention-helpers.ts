import { NDKUser } from '@nostr-dev-kit/ndk';

/**
 * Formats a user mention to be inserted into a text input
 */
export const formatUserMention = (user: NDKUser): string => {
  if (!user || !user.npub) return '';
  
  const profile = user.profile || {};
  const displayName = profile.displayName || profile.name || user.npub?.slice(0, 8) + '...';
  
  
  return `@${displayName}`;
};

/**
 * Inserts a mention into the text at the current cursor position
 */
export const insertMentionInText = (
  text: string,
  mention: string,
  cursorPosition: number
): { newText: string; newCursorPosition: number } => {
  const beforeCursor = text.substring(0, cursorPosition);
  const afterCursor = text.substring(cursorPosition);
  
  
  const mentionWithSpace = mention + ' ';
  
  const newText = `${beforeCursor}${mentionWithSpace}${afterCursor}`;
  const newCursorPosition = cursorPosition + mentionWithSpace.length;
  
  return { newText, newCursorPosition };
};
