import { NDKEvent } from '@nostr-dev-kit/ndk';

/**
 * Represents a Badge Definition (NIP-58 Kind 30009).
 * Defines the properties of a badge that can be awarded.
 */
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

/**
 * Represents an instance of a Badge Award (NIP-58 Kind 8).
 * Signifies that a specific badge type was given to a recipient.
 */
export interface BadgeAward {
  id: string; 
  awarder: string; 
  recipient: string; 
  definitionEventId?: string; 
  awardedAt: number; 
  event: NDKEvent; 
}
