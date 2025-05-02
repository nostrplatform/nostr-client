import { AwardIcon, PlusIcon, Loader2 } from 'lucide-react';
import { NDKEvent, NDKFilter, NDKKind, NDKTag } from '@nostr-dev-kit/ndk';
import { useActiveUser, useNdk } from 'nostr-hooks';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { nip19 } from 'nostr-tools';

import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { useToast } from '@/shared/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Spinner } from '@/shared/components/spinner';
import { Switch } from '@/shared/components/ui/switch';
import { BadgeAward, BadgeDefinition } from './types';
import { parseBadgeAward, parseBadgeDefinition } from './utils';
import { BadgeAwardItem } from './components/badge-award-item';
import { Textarea } from '@/shared/components/ui/textarea';

const BADGE_ACCEPTANCE_LIST_D_TAG = 'badge_acceptances';

export const BadgesWidget = () => {
  const { ndk } = useNdk();
  const { activeUser } = useActiveUser();
  const { toast } = useToast();
  const [createDefOpen, setCreateDefOpen] = useState(false);
  const [awardBadgeOpen, setAwardBadgeOpen] = useState(false);
  const [selectedDefinition, setSelectedDefinition] = useState<BadgeDefinition | null>(null);
  const [awardRecipientNpub, setAwardRecipientNpub] = useState('');
  const [isPublishingDef, setIsPublishingDef] = useState(false);
  const [isPublishingAward, setIsPublishingAward] = useState(false);
  const [isTogglingAcceptance, setIsTogglingAcceptance] = useState<Record<string, boolean>>({});

  const pubkey = activeUser?.pubkey;

  const [definitionEvents, setDefinitionEvents] = useState<NDKEvent[]>([]);
  const [loadingDefs, setLoadingDefs] = useState<boolean>(true);
  const [awardedEvents, setAwardedEvents] = useState<NDKEvent[]>([]);
  const [loadingAwarded, setLoadingAwarded] = useState<boolean>(true);
  const [receivedEvents, setReceivedEvents] = useState<NDKEvent[]>([]);
  const [loadingReceived, setLoadingReceived] = useState<boolean>(true);
  const [acceptanceListEvent, setAcceptanceListEvent] = useState<NDKEvent | null>(null);
  const [loadingAcceptance, setLoadingAcceptance] = useState<boolean>(true);

  const [processedDefinitions, setProcessedDefinitions] = useState<BadgeDefinition[]>([]);
  const [processedAwardedBadges, setProcessedAwardedBadges] = useState<BadgeAward[]>([]);
  const [processedReceivedBadges, setProcessedReceivedBadges] = useState<BadgeAward[]>([]);
  const [badgeDefinitionsCache, setBadgeDefinitionsCache] = useState<Record<string, BadgeDefinition>>({});
  const [isLoadingBadgeDefs, setIsLoadingBadgeDefs] = useState(false);

  const acceptedBadgeAwardIds = useMemo(() => {
    if (!acceptanceListEvent) return new Set<string>();
    return new Set(acceptanceListEvent.tags.filter(t => t[0] === 'e' && t[1]).map(t => t[1]));
  }, [acceptanceListEvent]);

  const definitionAwardCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    processedAwardedBadges.forEach(award => {
      if (award.definitionEventId) {
        counts[award.definitionEventId] = (counts[award.definitionEventId] || 0) + 1;
      }
    });
    return counts;
  }, [processedAwardedBadges]);

  useEffect(() => {
    if (!ndk || !pubkey) {
      setLoadingDefs(false);
      setDefinitionEvents([]);
      return;
    }
    setLoadingDefs(true);
    const filter: NDKFilter = { kinds: [NDKKind.BadgeDefinition], authors: [pubkey] };
    const sub = ndk.subscribe(filter, { closeOnEose: true });
    const events: NDKEvent[] = [];
    sub.on('event', (event: NDKEvent) => { events.push(event); });
    sub.on('eose', () => {
      setDefinitionEvents(events);
      setLoadingDefs(false);
    });
    return () => { sub.stop(); };
  }, [ndk, pubkey]);

  useEffect(() => {
    if (!ndk || !pubkey) {
      setLoadingAwarded(false);
      setAwardedEvents([]);
      return;
    }
    setLoadingAwarded(true);
    const filter: NDKFilter = { kinds: [NDKKind.BadgeAward], authors: [pubkey] };
    const sub = ndk.subscribe(filter, { closeOnEose: true });
    const events: NDKEvent[] = [];
    sub.on('event', (event: NDKEvent) => { events.push(event); });
    sub.on('eose', () => {
      setAwardedEvents(events);
      setLoadingAwarded(false);
    });
    return () => { sub.stop(); };
  }, [ndk, pubkey]);

  useEffect(() => {
    if (!ndk || !pubkey) {
      setLoadingReceived(false);
      setReceivedEvents([]);
      return;
    }
    setLoadingReceived(true);
    const filter: NDKFilter = { kinds: [NDKKind.BadgeAward], '#p': [pubkey] };
    const sub = ndk.subscribe(filter, { closeOnEose: true });
    const events: NDKEvent[] = [];
    sub.on('event', (event: NDKEvent) => { events.push(event); });
    sub.on('eose', () => {
      setReceivedEvents(events);
      setLoadingReceived(false);
    });
    return () => { sub.stop(); };
  }, [ndk, pubkey]);

  useEffect(() => {
    if (!ndk || !pubkey) {
      setLoadingAcceptance(false);
      setAcceptanceListEvent(null);
      return;
    }
    setLoadingAcceptance(true);
    const filter: NDKFilter = {
      kinds: [NDKKind.BookmarkList],
      authors: [pubkey],
      '#d': [BADGE_ACCEPTANCE_LIST_D_TAG],
      limit: 1
    };
    let latestEvent: NDKEvent | null = null;

    const sub = ndk.subscribe(filter, { closeOnEose: false });

    sub.on('event', (event: NDKEvent) => {
      if (!latestEvent || event.created_at! > latestEvent.created_at!) {
        latestEvent = event;
        setAcceptanceListEvent(latestEvent);
      }
    });
    sub.on('eose', () => {
      if (!latestEvent) {
        setAcceptanceListEvent(null);
      }
      setLoadingAcceptance(false);
    });

    return () => {
      sub.stop();
    };
  }, [ndk, pubkey]);

  useEffect(() => {
    const parsed = (definitionEvents ?? [])
      .map(parseBadgeDefinition)
      .filter((def): def is BadgeDefinition => def !== null)
      .sort((a, b) => (b.event.created_at ?? 0) - (a.event.created_at ?? 0));
    setProcessedDefinitions(parsed);
  }, [definitionEvents]);

  useEffect(() => {
    const processBadges = async (
      events: NDKEvent[],
      setter: React.Dispatch<React.SetStateAction<BadgeAward[]>>,
      currentCache: Record<string, BadgeDefinition>
    ) => {
      const parsedAwards = (events ?? [])
        .map(parseBadgeAward)
        .filter((award): award is BadgeAward => award !== null);

      const definitionCoords = new Set<string>();
      parsedAwards.forEach(award => {
        if (award.definitionEventId && !currentCache[award.definitionEventId]) {
          definitionCoords.add(award.definitionEventId);
        }
      });

      if (definitionCoords.size > 0 && ndk) {
        setIsLoadingBadgeDefs(true);
        try {
          const filters = Array.from(definitionCoords).map(coord => {
            const [kind, pubkey, d] = coord.split(':');
            return {
              kinds: [parseInt(kind)],
              authors: [pubkey],
              '#d': [d],
              limit: 1,
            };
          });
          const fetchedDefs = await ndk.fetchEvents(filters);
          const newCacheEntries: Record<string, BadgeDefinition> = {};
          fetchedDefs.forEach(event => {
            const def = parseBadgeDefinition(event);
            if (def) {
              const coord = `${NDKKind.BadgeDefinition}:${def.pubkey}:${def.d}`;
              newCacheEntries[coord] = def;
            }
          });
          setBadgeDefinitionsCache(prev => ({ ...prev, ...newCacheEntries }));
        } catch (error) {
          console.error("Error fetching badge definitions for awards:", error);
        } finally {
          setIsLoadingBadgeDefs(false);
        }
      }

      setter(parsedAwards.sort((a, b) => b.awardedAt - a.awardedAt));
    };

    processBadges(awardedEvents, setProcessedAwardedBadges, badgeDefinitionsCache);
    processBadges(receivedEvents, setProcessedReceivedBadges, badgeDefinitionsCache);

  }, [awardedEvents, receivedEvents, ndk, badgeDefinitionsCache]);

  const handleCreateDefinition = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!ndk || !pubkey) return;

    setIsPublishingDef(true);
    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const image = formData.get('image') as string;
    const thumb = formData.get('thumb') as string;
    const uniqueId = formData.get('uniqueId') as string;

    if (!name || !uniqueId) {
      toast({ title: 'Missing required fields', description: 'Name and Unique ID are required.', variant: 'destructive' });
      setIsPublishingDef(false);
      return;
    }

    try {
      const definitionEvent = new NDKEvent(ndk);
      definitionEvent.kind = NDKKind.BadgeDefinition;
      definitionEvent.pubkey = pubkey;
      definitionEvent.created_at = Math.floor(Date.now() / 1000);
      definitionEvent.content = description || '';

      const tags: NDKTag[] = [
        ['d', uniqueId],
        ['name', name],
      ];
      if (description) tags.push(['description', description]);
      if (image) tags.push(['image', image]);
      if (thumb) tags.push(['thumb', thumb]);

      definitionEvent.tags = tags;

      await definitionEvent.sign();
      const publishedRelays = await definitionEvent.publish();

      if (publishedRelays.size > 0) {
        toast({ title: 'Badge Definition Created', description: `Published to ${publishedRelays.size} relays.` });
        setCreateDefOpen(false);
        setDefinitionEvents(prev => [...prev, definitionEvent]);
      } else {
        throw new Error('Failed to publish definition to any relay.');
      }
    } catch (error: any) {
      console.error("Failed to create badge definition:", error);
      toast({ title: 'Error Creating Definition', description: error.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setIsPublishingDef(false);
    }
  }, [ndk, pubkey, toast]);

  const openAwardDialog = (definition: BadgeDefinition) => {
    setSelectedDefinition(definition);
    setAwardRecipientNpub('');
    setAwardBadgeOpen(true);
  };

  const handleAwardBadge = useCallback(async () => {
    if (!ndk || !pubkey || !selectedDefinition || !awardRecipientNpub) return;

    let recipientPubkey: string;
    try {
      const decoded = nip19.decode(awardRecipientNpub);
      if (decoded.type !== 'npub') {
        throw new Error('Invalid npub format.');
      }
      recipientPubkey = decoded.data;
    } catch (error: any) {
      toast({ title: 'Invalid Recipient', description: `Please enter a valid npub. ${error.message}`, variant: 'destructive' });
      return;
    }

    setIsPublishingAward(true);

    try {
      const awardEvent = new NDKEvent(ndk);
      awardEvent.kind = NDKKind.BadgeAward;
      awardEvent.pubkey = pubkey;
      awardEvent.created_at = Math.floor(Date.now() / 1000);
      awardEvent.content = '';

      const definitionCoordinate = `${NDKKind.BadgeDefinition}:${selectedDefinition.pubkey}:${selectedDefinition.d}`;

      const tags: NDKTag[] = [
        ['a', definitionCoordinate, ndk.pool.urls()[0] ?? ''],
        ['p', recipientPubkey],
        ['d', selectedDefinition.d],
        ['name', selectedDefinition.name || ''],
      ];
      if (selectedDefinition.description) tags.push(['description', selectedDefinition.description]);
      if (selectedDefinition.image) tags.push(['image', selectedDefinition.image]);
      if (selectedDefinition.thumb) tags.push(['thumb', selectedDefinition.thumb]);

      awardEvent.tags = tags;

      await awardEvent.sign();
      const publishedRelays = await awardEvent.publish();

      if (publishedRelays.size > 0) {
        toast({ title: 'Badge Awarded!', description: `Published to ${publishedRelays.size} relays.` });
        setAwardBadgeOpen(false);
        setAwardedEvents(prev => [...prev, awardEvent]);
      } else {
        throw new Error('Failed to publish award to any relay.');
      }
    } catch (error: any) {
      console.error("Failed to award badge:", error);
      toast({ title: 'Error Awarding Badge', description: error.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setIsPublishingAward(false);
    }
  }, [ndk, pubkey, selectedDefinition, awardRecipientNpub, toast]);

  const handleToggleAcceptance = useCallback(async (award: BadgeAward) => {
    if (!ndk || !pubkey || !award?.id) return;

    const awardId = award.id;
    setIsTogglingAcceptance(prev => ({ ...prev, [awardId]: true }));

    try {
      const currentAcceptedIds = new Set(acceptedBadgeAwardIds);
      const isCurrentlyAccepted = currentAcceptedIds.has(awardId);

      let updatedAcceptedIds: Set<string>;

      if (isCurrentlyAccepted) {
        updatedAcceptedIds = new Set(currentAcceptedIds);
        updatedAcceptedIds.delete(awardId);
        toast({ title: 'Hiding Badge...', description: 'Updating acceptance list...' });
      } else {
        updatedAcceptedIds = new Set(currentAcceptedIds);
        updatedAcceptedIds.add(awardId);
        toast({ title: 'Accepting Badge...', description: 'Updating acceptance list...' });
      }

      const newListEvent = new NDKEvent(ndk);
      newListEvent.kind = NDKKind.BookmarkList;
      newListEvent.pubkey = pubkey;
      newListEvent.created_at = Math.floor(Date.now() / 1000);
      newListEvent.content = '';

      const tags: NDKTag[] = [['d', BADGE_ACCEPTANCE_LIST_D_TAG]];
      updatedAcceptedIds.forEach(id => tags.push(['e', id]));
      newListEvent.tags = tags;

      await newListEvent.sign();
      const publishedRelays = await newListEvent.publish();

      if (publishedRelays.size > 0) {
        toast({
          title: isCurrentlyAccepted ? 'Badge Hidden' : 'Badge Accepted',
          description: 'Your public badge list has been updated.',
        });
        setAcceptanceListEvent(newListEvent);
      } else {
        throw new Error('Failed to publish acceptance list update to any relay.');
      }
    } catch (error: any) {
      console.error("Failed to update acceptance list:", error);
      toast({
        title: 'Error Updating Acceptance',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsTogglingAcceptance(prev => ({ ...prev, [awardId]: false }));
    }
  }, [ndk, pubkey, toast, acceptedBadgeAwardIds]);

  const isLoading = loadingDefs || loadingAwarded || loadingReceived || loadingAcceptance || isLoadingBadgeDefs;

  if (!pubkey) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Please log in to manage your badges.
      </div>
    );
  }

  const renderLoading = () => (
    <div className="flex justify-center items-center p-8"><Spinner /></div>
  );

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manage Badges</h1>
        <Dialog open={createDefOpen} onOpenChange={setCreateDefOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="w-4 h-4 mr-2" /> Create Definition
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Badge Definition</DialogTitle>
              <DialogDescription>Define a new badge that you can award to others.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateDefinition} className="space-y-4">
              <div>
                <Label htmlFor="uniqueId">Unique ID (d tag) *</Label>
                <Input id="uniqueId" name="uniqueId" required placeholder="e.g., awesome-developer-award-2025" />
                <p className="text-xs text-muted-foreground mt-1">A unique identifier for this badge definition.</p>
              </div>
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input id="name" name="name" required placeholder="e.g., Awesome Developer" />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="e.g., Awarded for significant contributions..." />
              </div>
              <div>
                <Label htmlFor="image">Image URL</Label>
                <Input id="image" name="image" type="url" placeholder="https://example.com/badge.png" />
              </div>
              <div>
                <Label htmlFor="thumb">Thumbnail URL</Label>
                <Input id="thumb" name="thumb" type="url" placeholder="https://example.com/badge_thumb.png" />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isPublishingDef}>
                  {isPublishingDef && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Definition
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={awardBadgeOpen} onOpenChange={setAwardBadgeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Award Badge: {selectedDefinition?.name}</DialogTitle>
            <DialogDescription>
              Award this badge to a user by entering their npub.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="recipientNpub">Recipient npub *</Label>
              <Input
                id="recipientNpub"
                value={awardRecipientNpub}
                onChange={(e) => setAwardRecipientNpub(e.target.value)}
                placeholder="npub1..."
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAwardBadge} disabled={isPublishingAward}>
              {isPublishingAward && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Award Badge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="earned">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="earned">Earned</TabsTrigger>
          <TabsTrigger value="given">Given</TabsTrigger>
          <TabsTrigger value="definitions">My Definitions</TabsTrigger>
        </TabsList>

        <TabsContent value="earned" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Earned Badges</CardTitle>
              <CardDescription>Badges you have received. Toggle visibility for your public profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? renderLoading() : processedReceivedBadges.length > 0 ? (
                processedReceivedBadges.map((award) => {
                  const isAccepted = acceptedBadgeAwardIds.has(award.id);
                  const isToggling = isTogglingAcceptance[award.id] ?? false;
                  return (
                    <div key={award.id} className="flex items-center justify-between gap-4 p-2 border rounded">
                      <div className="flex-grow">
                        <BadgeAwardItem
                          award={award}
                          perspective="recipient"
                          definition={badgeDefinitionsCache[award.definitionEventId || '']}
                        />
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0 pl-4">
                        <Label htmlFor={`accept-toggle-${award.id}`} className="text-xs text-muted-foreground cursor-pointer">
                          {isAccepted ? 'Visible' : 'Hidden'}
                        </Label>
                        <Switch
                          id={`accept-toggle-${award.id}`}
                          checked={isAccepted}
                          onCheckedChange={() => handleToggleAcceptance(award)}
                          disabled={isToggling}
                          aria-label="Toggle badge visibility"
                        />
                        {isToggling && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-muted-foreground text-center">You haven't earned any badges yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="given" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Given Badges</CardTitle>
              <CardDescription>Badges you have awarded to others.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? renderLoading() : processedAwardedBadges.length > 0 ? (
                processedAwardedBadges.map((award) => (
                  <BadgeAwardItem
                    key={award.id}
                    award={award}
                    perspective="awarder"
                    definition={badgeDefinitionsCache[award.definitionEventId || '']}
                  />
                ))
              ) : (
                <p className="text-muted-foreground text-center">You haven't awarded any badges yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="definitions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>My Badge Definitions</CardTitle>
              <CardDescription>Badges you have created and can award.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? renderLoading() : processedDefinitions.length > 0 ? (
                processedDefinitions.map((def) => {
                  const definitionCoord = `${NDKKind.BadgeDefinition}:${def.pubkey}:${def.d}`;
                  const awardCount = definitionAwardCounts[definitionCoord] || 0;
                  return (
                    <div key={def.id} className="p-3 border rounded flex justify-between items-center gap-4">
                      <div className="flex-grow">
                        <p className="font-semibold">{def.name}</p>
                        <p className="text-sm text-muted-foreground">{def.description}</p>
                        {def.image && <img src={def.image} alt={def.name} className="w-10 h-10 mt-2 rounded object-cover" />}
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <Button size="sm" onClick={() => openAwardDialog(def)}>
                          <AwardIcon className="w-3 h-3 mr-1.5" /> Award
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          Awarded {awardCount} time{awardCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-muted-foreground text-center">You haven't created any badge definitions yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
