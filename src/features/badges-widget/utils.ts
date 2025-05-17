import { NDKEvent } from '@nostr-dev-kit/ndk';
import { BadgeDefinition, BadgeAward, ProfileBadge } from './types';

// NIP-58 defines badge definition as kind 30009
export const BADGE_DEFINITION_KIND = 30009;

// NIP-58 defines badge award as kind 8
export const BADGE_AWARD_KIND = 8;

// NIP-58 defines profile badges as kind 30008
export const PROFILE_BADGES_KIND = 30008;
export const PROFILE_BADGES_D_TAG = 'profile_badges';

export const parseBadgeDefinition = (event: NDKEvent): BadgeDefinition | null => {
  const dTag = event.tagValue('d');
  
  if (event.kind !== BADGE_DEFINITION_KIND || !dTag) return null;

  // Extract custom tags (those with 't' prefix)
  const customTags = event.tags
    .filter(tag => tag[0] === 't' && tag.length >= 3)
    .map(tag => ({
      name: tag[1],
      value: tag[2]
    }));
    
  // Extract hashtags
  const hashtags = event.tags
    .filter(tag => tag[0] === 't' && tag[1] === 'hashtag' && tag.length >= 3)
    .map(tag => tag[2]);
    
  // Extract image dimensions if available
  const imageTag = event.tags.find(tag => tag[0] === 'image');
  let imageWidth, imageHeight;
  if (imageTag && imageTag.length >= 3 && imageTag[2]) {
    const dimensions = imageTag[2].split('x');
    if (dimensions.length === 2) {
      imageWidth = parseInt(dimensions[0], 10) || undefined;
      imageHeight = parseInt(dimensions[1], 10) || undefined;
    }
  }
  
  // Extract thumbnails with dimensions
  const thumbTags = event.tags.filter(tag => tag[0] === 'thumb');
  const thumbs = thumbTags.map(tag => {
    const result: { url: string; width?: number; height?: number } = { url: tag[1] };
    if (tag.length >= 3 && tag[2]) {
      const dimensions = tag[2].split('x');
      if (dimensions.length === 2) {
        result.width = parseInt(dimensions[0], 10) || undefined;
        result.height = parseInt(dimensions[1], 10) || undefined;
      }
    }
    return result;
  });

  return {
    id: event.id,
    pubkey: event.pubkey,
    d: dTag,
    name: event.tagValue('name') ?? undefined, 
    description: event.tagValue('description') ?? undefined,
    image: event.tagValue('image') ?? undefined,
    imageWidth,
    imageHeight,
    thumbs: thumbs.length > 0 ? thumbs : undefined,
    thumb: event.tagValue('thumb') ?? undefined, // For backward compatibility
    hashtags: hashtags.length > 0 ? hashtags : undefined,
    tags: customTags.length > 0 ? customTags : undefined,
    event: event,
  };
};

export const parseBadgeAward = (event: NDKEvent): BadgeAward | null => {
  if (event.kind !== BADGE_AWARD_KIND) return null;
  
  // According to NIP-58, badge award must have an 'a' tag referencing a badge definition
  const aTag = event.tags.find(t =>
    t[0] === 'a' &&
    t[1]?.startsWith(`${BADGE_DEFINITION_KIND}:`) &&
    t[1]?.split(':').length === 3
  );
  
  // Must have at least one 'p' tag for the recipient
  const pTag = event.tags.find(t => t[0] === 'p' && t[1]);
  
  if (!aTag || !pTag) return null;
  
  // Extract optional badge metadata that may be included in the award
  const badgeD = event.tagValue('d');
  const badgeName = event.tagValue('name');
  const badgeDescription = event.tagValue('description');
  const badgeImage = event.tagValue('image');
  const badgeThumb = event.tagValue('thumb');

  return {
    id: event.id,
    awarder: event.pubkey,
    recipient: pTag[1], 
    definitionEventId: aTag[1],
    badgeD,
    badgeName,
    badgeDescription,
    badgeImage,
    badgeThumb,
    awardedAt: event.created_at ?? 0,
    event: event,
  };
};

export const parseProfileBadges = (event: NDKEvent): ProfileBadge[] | null => {
  if (event.kind !== PROFILE_BADGES_KIND) return null;
  
  // According to NIP-58, profile badges must have a 'd' tag with value 'profile_badges'
  const dTag = event.tagValue('d');
  if (dTag !== PROFILE_BADGES_D_TAG) return null;
  
  const badges: ProfileBadge[] = [];
  
  // NIP-58 specifies that profile badges are stored as consecutive pairs of 'a' and 'e' tags
  for (let i = 0; i < event.tags.length - 1; i++) {
    const currentTag = event.tags[i];
    const nextTag = event.tags[i + 1];
    
    if (currentTag[0] === 'a' && nextTag[0] === 'e' && currentTag[1] && nextTag[1]) {
      badges.push({
        definitionId: currentTag[1],
        awardId: nextTag[1],
        relayUrl: nextTag[2]
      });
      // Skip the next tag as we've already processed it
      i++;
    }
  }
  
  return badges;
};

export const createBadgeDefinitionCoordinate = (
  pubkey: string,
  dTag: string
): string => {
  return `${BADGE_DEFINITION_KIND}:${pubkey}:${dTag}`;
};

// Get the best thumbnail for a badge based on desired size
export const getBestThumbnail = (
  definition: BadgeDefinition,
  preferredSize = 64 // Default to medium size
): string | undefined => {
  if (!definition.thumbs || definition.thumbs.length === 0) {
    return definition.thumb || definition.image;
  }
  
  // Sort thumbnails by size (closest to preferred)
  const sortedThumbs = [...definition.thumbs].sort((a, b) => {
    const aSize = a.width || 0;
    const bSize = b.width || 0;
    return Math.abs(aSize - preferredSize) - Math.abs(bSize - preferredSize);
  });
  
  return sortedThumbs[0].url;
};
