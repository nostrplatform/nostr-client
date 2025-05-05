import { NDKEvent } from '@nostr-dev-kit/ndk';

export type BadgeTag = {
  name: string;
  value: string;
};

export interface BadgeDefinition {
  id: string; 
  pubkey: string; 
  d: string; 
  name?: string; 
  description?: string; 
  image?: string;
  imageWidth?: number;
  imageHeight?: number;
  thumbs?: Array<{
    url: string;
    width?: number;
    height?: number;
  }>;
  thumb?: string; // For backward compatibility
  hashtags?: string[];
  tags?: BadgeTag[];
  event: NDKEvent; 
}

export interface BadgeAward {
  id: string; 
  awarder: string; 
  recipient: string; 
  definitionEventId: string; 
  badgeD?: string;
  badgeName?: string;
  badgeDescription?: string;
  badgeImage?: string;
  badgeThumb?: string;
  awardedAt: number; 
  event: NDKEvent; 
}

export interface ProfileBadge {
  definitionId: string; // a tag value (30009:pubkey:d-tag)
  awardId: string; // e tag value (event id of award)
  relayUrl?: string; // relay hint from e tag
}
