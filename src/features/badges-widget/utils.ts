import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { BadgeDefinition, BadgeAward } from './types';

// Helper to parse badge definition event
export const parseBadgeDefinition = (event: NDKEvent): BadgeDefinition | null => {
  const dTag = event.tagValue('d');
  // Basic validation: ensure kind is BadgeDefinition and d tag exists
  if (event.kind !== NDKKind.BadgeDefinition || !dTag) return null;

  return {
    id: event.id,
    pubkey: event.pubkey,
    d: dTag,
    name: event.tagValue('name') ?? undefined, // Use undefined if null
    description: event.tagValue('description') ?? undefined,
    image: event.tagValue('image') ?? undefined,
    thumb: event.tagValue('thumb') ?? undefined,
    event: event,
  };
};

// Helper to parse badge award event
export const parseBadgeAward = (event: NDKEvent): BadgeAward | null => {
  // Basic validation: ensure kind is BadgeAward
  if (event.kind !== NDKKind.BadgeAward) return null;

  // Find the 'a' tag pointing to a BadgeDefinition
  const aTag = event.tags.find(t =>
    t[0] === 'a' &&
    t[1]?.startsWith(`${NDKKind.BadgeDefinition}:`) &&
    t[1]?.split(':').length === 3
  );
  // Find the first 'p' tag for the recipient
  const pTag = event.tags.find(t => t[0] === 'p' && t[1]);

  // Both 'a' and 'p' tags are required for a valid award
  if (!aTag || !pTag) return null;

  return {
    id: event.id,
    awarder: event.pubkey,
    recipient: pTag[1], // Recipient pubkey from the 'p' tag
    definitionEventId: aTag[1], // Coordinate: <kind>:<pubkey>:<d>
    awardedAt: event.created_at ?? 0,
    event: event,
  };
};
