import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { BadgeDefinition, BadgeAward } from './types';

// Helper to parse badge definition event
export const parseBadgeDefinition = (event: NDKEvent): BadgeDefinition | null => {
  const dTag = event.tagValue('d');
  if (!dTag) return null;

  return {
    id: event.id,
    pubkey: event.pubkey,
    d: dTag,
    name: event.tagValue('name'),
    description: event.tagValue('description'),
    image: event.tagValue('image'),
    thumb: event.tagValue('thumb'),
    event: event,
  };
};

// Helper to parse badge award event
export const parseBadgeAward = (event: NDKEvent): BadgeAward | null => {
  const aTag = event.tags.find(t => t[0] === 'a' && t[1]?.split(':').length === 3 && t[1]?.startsWith(`${NDKKind.BadgeDefinition}:`));
  const pTag = event.tags.find(t => t[0] === 'p'); // Assuming the first p tag is the recipient

  if (!aTag || !pTag || !pTag[1]) return null;

  return {
    id: event.id,
    awarder: event.pubkey,
    recipient: pTag[1],
    definitionEventId: aTag[1], // Format: <kind>:<pubkey>:<d>
    awardedAt: event.created_at ?? 0,
    event: event,
  };
};
