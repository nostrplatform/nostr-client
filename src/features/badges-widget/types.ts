import { NDKEvent } from '@nostr-dev-kit/ndk';

export interface BadgeDefinition {
  id: string;
  pubkey: string;
  d: string; // Unique identifier for the definition
  name?: string;
  description?: string;
  image?: string;
  thumb?: string;
  event: NDKEvent;
  // No need to add awardCount here, it's derived UI state
}

export interface BadgeAward {
  id: string;
  awarder: string;
  recipient: string;
  definitionEventId?: string; // a tag: <kind>:<pubkey>:<d>
  awardedAt: number;
  event: NDKEvent;
}
