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
  thumb?: string;
  tags?: BadgeTag[];
  event: NDKEvent;
}

export interface BadgeAward {
  id: string;
  awarder: string;
  recipient: string;
  definitionEventId: string;
  awardedAt: number;
  event: NDKEvent;
}
