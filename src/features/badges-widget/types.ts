import { NDKEvent } from '@nostr-dev-kit/ndk';

export interface BadgeDefinition {
  id: string;
  pubkey: string;
  d: string;
  name?: string;
  description?: string;
  image?: string;
  thumb?: string;
  event: NDKEvent;
}

export interface BadgeAward {
  id: string;
  awarder: string;
  recipient: string;
  definitionEventId?: string; // a tag: <kind>:<pubkey>:<d>
  definition?: BadgeDefinition; // Populated after fetching
  awardedAt: number;
  event: NDKEvent;
}
