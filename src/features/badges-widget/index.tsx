import { AwardIcon, PlusIcon, Loader2, InfoIcon } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Spinner } from '@/shared/components/spinner';
import { Switch } from '@/shared/components/ui/switch';
import { BadgeAward, BadgeDefinition, BadgeTag } from './types';
import { parseBadgeAward, parseBadgeDefinition } from './utils';
import { BadgeAwardItem } from './components/badge-award-item';
import { Textarea } from '@/shared/components/ui/textarea';
import { TagInput } from './components/tag-input';
import { BadgeDetailModal } from './components/badge-detail-modal';

const PROFILE_BADGES_KIND = 30008;
const PROFILE_BADGES_D_TAG = 'profile_badges';

export const BadgesWidget = () => {
  const { ndk } = useNdk();
  const { activeUser } = useActiveUser();
  const { toast } = useToast();
  const [createDefOpen, setCreateDefOpen] = useState(false);
  const [selectedDefinition, setSelectedDefinition] = useState<BadgeDefinition | null>(null);
  const [selectedDefinitionForDetails, setSelectedDefinitionForDetails] = useState<BadgeDefinition | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [awardRecipientNpub, setAwardRecipientNpub] = useState('');
  const [isPublishingDef, setIsPublishingDef] = useState(false);
  const [isPublishingAward, setIsPublishingAward] = useState(false);
  const [isTogglingVisibility, setIsTogglingVisibility] = useState<Record<string, boolean>>({});
  const [badgeTags, setBadgeTags] = useState<BadgeTag[]>([]);
  const [badgeHashtags, setBadgeHashtags] = useState<string[]>([]);

  const pubkey = activeUser?.pubkey;

  const [definitionEvents, setDefinitionEvents] = useState<NDKEvent[]>([]);
  const [loadingDefs, setLoadingDefs] = useState<boolean>(true);
  const [awardedEvents, setAwardedEvents] = useState<NDKEvent[]>([]);
  const [loadingAwarded, setLoadingAwarded] = useState<boolean>(true);
  const [receivedEvents, setReceivedEvents] = useState<NDKEvent[]>([]);
  const [loadingReceived, setLoadingReceived] = useState<boolean>(true);
  const [profileBadgesEvent, setProfileBadgesEvent] = useState<NDKEvent | null>(null);
  const [loadingProfileBadges, setLoadingProfileBadges] = useState<boolean>(true);

  const [processedDefinitions, setProcessedDefinitions] = useState<BadgeDefinition[]>([]);
  const [processedAwardedBadges, setProcessedAwardedBadges] = useState<BadgeAward[]>([]);
  const [processedReceivedBadges, setProcessedReceivedBadges] = useState<BadgeAward[]>([]);
  const [badgeDefinitionsCache, setBadgeDefinitionsCache] = useState<Record<string, BadgeDefinition>>({});
  const [isLoadingBadgeDefs, setIsLoadingBadgeDefs] = useState(false);

  const visibleBadgeAwardsMap = useMemo(() => {
    const map = new Map<string, string>();
    if (!profileBadgesEvent) return map;

    const tags = profileBadgesEvent.tags;
    for (let i = 0; i < tags.length - 1; i++) {
      if (tags[i][0] === 'a' && tags[i + 1][0] === 'e' && tags[i][1] && tags[i + 1][1]) {
        const definitionCoord = tags[i][1];
        const awardId = tags[i + 1][1];
        map.set(awardId, definitionCoord);
        i++;
      }
    }
    return map;
  }, [profileBadgesEvent]);

  const badgeTypeAwardCounts = useMemo(() => {
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
      setLoadingProfileBadges(false);
      setProfileBadgesEvent(null);
      return;
    }
    setLoadingProfileBadges(true);
    const filter: NDKFilter = {
      kinds: [PROFILE_BADGES_KIND],
      authors: [pubkey],
      '#d': [PROFILE_BADGES_D_TAG],
      limit: 1
    };
    let latestEvent: NDKEvent | null = null;

    const sub = ndk.subscribe(filter, { closeOnEose: false });

    sub.on('event', (event: NDKEvent) => {
      if (!latestEvent || event.created_at! > latestEvent.created_at!) {
        latestEvent = event;
        setProfileBadgesEvent(latestEvent);
      }
    });
    sub.on('eose', () => {
      if (!latestEvent) {
        setProfileBadgesEvent(null);
      }
      setLoadingProfileBadges(false);
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
      toast({ title: 'Missing Required Fields', description: 'Name and Unique ID are required for a badge type.', variant: 'destructive' });
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
      
      badgeTags.forEach(tag => {
        tags.push(['t', tag.name, tag.value]);
      });
      
      badgeHashtags.forEach(hashtag => {
        tags.push(['t', 'hashtag', hashtag]);
      });

      definitionEvent.tags = tags;

      await definitionEvent.sign();
      const publishedRelays = await definitionEvent.publish();

      if (publishedRelays.size > 0) {
        toast({ title: 'Badge Created', description: `Published to ${publishedRelays.size} relays.` });
        setCreateDefOpen(false);
        setDefinitionEvents(prev => [...prev, definitionEvent]);
        setBadgeTags([]);
        setBadgeHashtags([]);
      } else {
        throw new Error('Failed to publish badge type definition to any relay.');
      }
    } catch (error: any) {
      console.error("Failed to create badge type definition:", error);
      toast({ title: 'Error Creating Badge', description: error.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setIsPublishingDef(false);
    }
  }, [ndk, pubkey, toast, badgeTags, badgeHashtags]);

  const [awardBadgeOpen, setAwardBadgeOpen] = useState(false);

  const openAwardDialog = (definition: BadgeDefinition) => {
    setSelectedDefinition(definition);
    setAwardRecipientNpub('');
    setAwardBadgeOpen(true);
  };
  
  const openDetailsDialog = (definition: BadgeDefinition) => {
    setSelectedDefinitionForDetails(definition);
    setDetailsModalOpen(true);
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

      if (selectedDefinition?.tags) {
        selectedDefinition.tags.forEach(tag => {
          tags.push(['t', tag.name, tag.value]);
        });
      }

      awardEvent.tags = tags;

      await awardEvent.sign();
      const publishedRelays = await awardEvent.publish();

      if (publishedRelays.size > 0) {
        toast({ title: 'Badge Given!', description: `Published to ${publishedRelays.size} relays.` });
        setAwardBadgeOpen(false);
        setAwardedEvents(prev => [...prev, awardEvent]);
      } else {
        throw new Error('Failed to publish badge award to any relay.');
      }
    } catch (error: any) {
      console.error("Failed to give badge:", error);
      toast({ title: 'Error Giving Badge', description: error.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setIsPublishingAward(false);
    }
  }, [ndk, pubkey, selectedDefinition, awardRecipientNpub, toast]);

  const handleToggleVisibility = useCallback(async (award: BadgeAward) => {
    if (!ndk || !pubkey || !award?.id || !award.definitionEventId) return;

    const awardId = award.id;
    const definitionCoord = award.definitionEventId;

    setIsTogglingVisibility(prev => ({ ...prev, [awardId]: true }));

    try {
      const currentVisibleMap = new Map(visibleBadgeAwardsMap);
      const isCurrentlyVisible = currentVisibleMap.has(awardId);

      let updatedVisibleMap: Map<string, string>;

      if (isCurrentlyVisible) {
        updatedVisibleMap = new Map(currentVisibleMap);
        updatedVisibleMap.delete(awardId);
        toast({ title: 'Hiding Badge...', description: 'Updating profile badges list...' });
      } else {
        updatedVisibleMap = new Map(currentVisibleMap);
        updatedVisibleMap.set(awardId, definitionCoord);
        toast({ title: 'Making Badge Visible...', description: 'Updating profile badges list...' });
      }

      const newListEvent = new NDKEvent(ndk);
      newListEvent.kind = PROFILE_BADGES_KIND;
      newListEvent.pubkey = pubkey;
      newListEvent.created_at = Math.floor(Date.now() / 1000);
      newListEvent.content = '';

      const tags: NDKTag[] = [['d', PROFILE_BADGES_D_TAG]];
      updatedVisibleMap.forEach((defCoord, awardId) => {
        tags.push(['a', defCoord]);
        tags.push(['e', awardId]);
      });
      newListEvent.tags = tags;

      await newListEvent.sign();
      const publishedRelays = await newListEvent.publish();

      if (publishedRelays.size > 0) {
        toast({
          title: isCurrentlyVisible ? 'Badge Hidden' : 'Badge Visible',
          description: 'Your profile badges list has been updated.',
        });
        setProfileBadgesEvent(newListEvent);
      } else {
        throw new Error('Failed to publish profile badges list update to any relay.');
      }
    } catch (error: any) {
      console.error("Failed to update badge visibility:", error);
      toast({
        title: 'Error Updating Visibility',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsTogglingVisibility(prev => ({ ...prev, [awardId]: false }));
    }
  }, [ndk, pubkey, toast, visibleBadgeAwardsMap]);

  const isLoading = loadingDefs || loadingAwarded || loadingReceived || loadingProfileBadges || isLoadingBadgeDefs;

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
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Manage Badges</h1>
        <Dialog open={createDefOpen} onOpenChange={setCreateDefOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="w-4 h-4 mr-2" /> Create Badge
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Badge</DialogTitle>
              <DialogDescription>Define a new type of badge that you can give to others.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateDefinition} className="space-y-4 py-4">
              <div>
                <Label htmlFor="uniqueId">Unique ID (d tag) *</Label>
                <Input id="uniqueId" name="uniqueId" required placeholder="e.g., awesome-developer-award-2025" className="mt-1" />
                <p className="text-xs text-muted-foreground mt-1">A unique identifier for this badge type (required).</p>
              </div>
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input id="name" name="name" required placeholder="e.g., Awesome Developer" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="e.g., Awarded for significant contributions..." className="mt-1" />
              </div>
              <div>
                <Label htmlFor="image">Image URL</Label>
                <Input id="image" name="image" type="url" placeholder="https://example.com/badge.png" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="thumb">Thumbnail URL</Label>
                <Input id="thumb" name="thumb" type="url" placeholder="https://example.com/badge_thumb.png" className="mt-1" />
              </div>
              
              <TagInput 
                tags={badgeTags} 
                onChange={setBadgeTags} 
                hashtags={badgeHashtags} 
                onHashtagsChange={setBadgeHashtags} 
              />
              
              <DialogFooter>
                <Button type="submit" disabled={isPublishingDef}>
                  {isPublishingDef && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Badge
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <BadgeDetailModal 
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        definition={selectedDefinitionForDetails || undefined}
        perspective="none"
      />

      <Tabs defaultValue="received" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="received">Received</TabsTrigger>
          <TabsTrigger value="given">Given</TabsTrigger>
          <TabsTrigger value="definitions">My Badges</TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Received Badges</CardTitle>
              <CardDescription>Badges you have received. Toggle visibility for your public profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? renderLoading() : processedReceivedBadges.length > 0 ? (
                processedReceivedBadges.map((award) => {
                  const isVisible = visibleBadgeAwardsMap.has(award.id);
                  const isToggling = isTogglingVisibility[award.id] ?? false;
                  return (
                    <div key={award.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 border border-border rounded-lg bg-card">
                      <div className="flex-grow w-full sm:w-auto">
                        <BadgeAwardItem
                          award={award}
                          perspective="recipient"
                          definition={badgeDefinitionsCache[award.definitionEventId || '']}
                        />
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0 pl-0 sm:pl-4 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-border w-full sm:w-auto justify-end sm:justify-start">
                        <Label htmlFor={`visibility-toggle-${award.id}`} className="text-xs text-muted-foreground cursor-pointer select-none">
                          {isVisible ? 'Visible' : 'Hidden'}
                        </Label>
                        <Switch
                          id={`visibility-toggle-${award.id}`}
                          checked={isVisible}
                          onCheckedChange={() => handleToggleVisibility(award)}
                          disabled={isToggling || !award.definitionEventId}
                          aria-label="Toggle badge visibility"
                        />
                        {isToggling && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-muted-foreground text-center py-4">You haven't received any badges yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="given" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Given Badges</CardTitle>
              <CardDescription>Badges you have given to others.</CardDescription>
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
                <p className="text-muted-foreground text-center py-4">You haven't given any badges yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="definitions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>My Badges</CardTitle>
              <CardDescription>Badge types you have created and can give.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? renderLoading() : processedDefinitions.length > 0 ? (
                processedDefinitions.map((def) => {
                  const definitionCoord = `${NDKKind.BadgeDefinition}:${def.pubkey}:${def.d}`;
                  const awardCount = badgeTypeAwardCounts[definitionCoord] || 0;
                  return (
                    <div key={def.id} className="p-4 border border-border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card">
                      <div className="flex items-center gap-4 flex-grow cursor-pointer" onClick={() => openDetailsDialog(def)}>
                        {(def.thumb || def.image) && (
                          <Avatar className="w-12 h-12 hidden sm:flex flex-shrink-0">
                            <AvatarImage src={def.thumb || def.image} alt={def.name} />
                            <AvatarFallback><AwardIcon className="w-6 h-6 text-muted-foreground" /></AvatarFallback>
                          </Avatar>
                        )}
                        <div className="overflow-hidden">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-base">{def.name}</p>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 rounded-full hover:bg-muted"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDetailsDialog(def);
                              }}
                            >
                              <InfoIcon size={14} />
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{def.description}</p>
                          
                          {def.tags && def.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {def.tags.slice(0, 3).map((tag, idx) => (
                                <span key={idx} className="text-xs px-1.5 py-0.5 bg-muted rounded-md text-muted-foreground">
                                  {tag.name}: {tag.value}
                                </span>
                              ))}
                              {def.tags.length > 3 && (
                                <span className="text-xs px-1.5 py-0.5 bg-muted rounded-md text-muted-foreground">
                                  +{def.tags.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-start sm:items-end gap-2 flex-shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l-0 border-border">
                        <Button size="sm" onClick={(e) => {
                          e.stopPropagation();
                          openAwardDialog(def);
                        }}>
                          <AwardIcon className="w-3 h-3 mr-1.5" /> Give Badge
                        </Button>
                        <span className="text-xs text-muted-foreground pt-1 sm:pt-0">
                          Given {awardCount} time{awardCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-muted-foreground text-center py-4">You haven't created any badge types yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={awardBadgeOpen} onOpenChange={setAwardBadgeOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Give Badge: {selectedDefinition?.name}</DialogTitle>
            <DialogDescription>
              Enter the npub of the user you want to give this badge to.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="recipient-npub" className="text-right">
                Recipient npub
              </Label>
              <Input
                id="recipient-npub"
                value={awardRecipientNpub}
                onChange={(e) => setAwardRecipientNpub(e.target.value)}
                className="col-span-3"
                placeholder="npub1..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAwardBadge} disabled={isPublishingAward}>
              {isPublishingAward && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Give Badge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

