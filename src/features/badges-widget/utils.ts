import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { BadgeDefinition, BadgeAward } from './types';


export const parseBadgeDefinition = (event: NDKEvent): BadgeDefinition | null => {
  const dTag = event.tagValue('d');
  
  if (event.kind !== NDKKind.BadgeDefinition || !dTag) return null;

  return {
    id: event.id,
    pubkey: event.pubkey,
    d: dTag,
    name: event.tagValue('name') ?? undefined, 
    description: event.tagValue('description') ?? undefined,
    image: event.tagValue('image') ?? undefined,
    thumb: event.tagValue('thumb') ?? undefined,
    event: event,
  };
};


export const parseBadgeAward = (event: NDKEvent): BadgeAward | null => {
  
  if (event.kind !== NDKKind.BadgeAward) return null;

  
  const aTag = event.tags.find(t =>
    t[0] === 'a' &&
    t[1]?.startsWith(`${NDKKind.BadgeDefinition}:`) &&
    t[1]?.split(':').length === 3
  );
  
  const pTag = event.tags.find(t => t[0] === 'p' && t[1]);

  
  if (!aTag || !pTag) return null;

  return {
    id: event.id,
    awarder: event.pubkey,
    recipient: pTag[1], 
    definitionEventId: aTag[1], 
    awardedAt: event.created_at ?? 0,
    event: event,
  };
};
