/**
 * Highlights mentions and hashtags in text
 * @param text The text to process
 * @returns Text with HTML span elements for highlighting
 */
export const highlightMentionsAndHashtags = (text: string): string => {
  if (!text) return '';
  
  
  const mentionRegex = /@([a-zA-Z0-9_.]+)/g;
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
  
  
  let result = text.replace(mentionRegex, '<span class="text-blue-500">$&</span>');
  
  
  result = result.replace(hashtagRegex, '<span class="text-green-500">$&</span>');
  
  return result;
};

/**
 * Extracts mentions from text
 * @param text The text to process
 * @returns Array of mention strings
 */
export const extractMentions = (text: string): string[] => {
  if (!text) return [];
  
  const mentionRegex = /@([a-zA-Z0-9_.]+)/g;
  const mentions: string[] = [];
  
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[0]);
  }
  
  return mentions;
};

/**
 * Extracts hashtags from text
 * @param text The text to process
 * @returns Array of hashtag strings
 */
export const extractHashtags = (text: string): string[] => {
  if (!text) return [];
  
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
  const hashtags: string[] = [];
  
  let match;
  while ((match = hashtagRegex.exec(text)) !== null) {
    hashtags.push(match[0]);
  }
  
  return hashtags;
};
