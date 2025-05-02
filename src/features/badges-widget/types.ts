import { NDKEvent } from '@nostr-dev-kit/ndk';

/**
 * Represents a Badge Definition (NIP-58 Kind 30009).
 * Defines the properties of a badge that can be awarded.
 */
export interface BadgeDefinition {
  id: string; // Event ID of the definition
  pubkey: string; // Pubkey of the creator of the badge type
  d: string; // Unique identifier for the badge type within the creator's definitions
  name?: string; // Name of the badge type
  description?: string; // Description of the badge type
  image?: string; // URL for the full-size image of the badge
  thumb?: string; // URL for the thumbnail image of the badge
  event: NDKEvent; // The original NDKEvent
}

/**
 * Represents an instance of a Badge Award (NIP-58 Kind 8).
 * Signifies that a specific badge type was given to a recipient.
 */
export interface BadgeAward {
  id: string; // Event ID of the award
  awarder: string; // Pubkey of the user who gave the badge
  recipient: string; // Pubkey of the user who received the badge
  definitionEventId?: string; // 'a' tag coordinate (<kind>:<pubkey>:<d>) pointing to the BadgeDefinition event
  awardedAt: number; // Timestamp when the badge was awarded (created_at of the event)
  event: NDKEvent; // The original NDKEvent
}
