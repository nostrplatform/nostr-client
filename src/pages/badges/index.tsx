import { AwardIcon, PlusIcon, Image as ImageIcon, Loader2, User as UserIcon } from 'lucide-react';
import { NDKEvent, NDKFilter, NDKKind, NDKTag } from '@nostr-dev-kit/ndk';
import { useActiveUser, useNdk,   useProfile } from 'nostr-hooks';
import { nip19 } from 'nostr-tools';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Spinner } from '@/shared/components/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Textarea } from '@/shared/components/ui/textarea';
import { useToast } from '@/shared/components/ui/use-toast';
import { ellipsis } from '@/shared/utils';
import { Skeleton } from '@/shared/components/ui/skeleton';

interface BadgeDefinition {
  id: string;
  pubkey: string;
  d: string;
  name?: string;
  description?: string;
  image?: string;
  thumb?: string;
  event: NDKEvent;
}

interface BadgeAward {
  id: string;
  awarder: string;
  recipient: string;
  definitionEventId?: string; // a tag: <kind>:<pubkey>:<d>
  definition?: BadgeDefinition; // Populated after fetching
  awardedAt: number;
  event: NDKEvent;
}

// Helper to parse badge definition event
const parseBadgeDefinition = (event: NDKEvent): BadgeDefinition | null => {
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
const parseBadgeAward = (event: NDKEvent): BadgeAward | null => {
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

export const BadgesPage = () => {
  const { ndk } = useNdk();
  const { activeUser } = useActiveUser();
  const { toast } = useToast();
  const [isCreateDefDialogOpen, setIsCreateDefDialogOpen] = useState(false);
  const [isCreatingDef, setIsCreatingDef] = useState(false);
  const [newDefData, setNewDefData] = useState({ d: '', name: '', description: '', image: '', thumb: '' });
  const [isAwardDialogOpen, setIsAwardDialogOpen] = useState(false);
  const [isAwarding, setIsAwarding] = useState(false);
  const [awardRecipientNpub, setAwardRecipientNpub] = useState('');
  const [selectedDefinition, setSelectedDefinition] = useState<BadgeDefinition | null>(null);

  const pubkey = activeUser?.pubkey;

  // --- State for fetched events and loading status ---
  const [definitionEvents, setDefinitionEvents] = useState<NDKEvent[]>([]);
  const [loadingDefs, setLoadingDefs] = useState<boolean>(true);
  const [awardedEvents, setAwardedEvents] = useState<NDKEvent[]>([]);
  const [loadingAwarded, setLoadingAwarded] = useState<boolean>(true);
  const [receivedEvents, setReceivedEvents] = useState<NDKEvent[]>([]);
  const [loadingReceived, setLoadingReceived] = useState<boolean>(true);

  // --- Fetch Badge Definitions (Kind 30009) ---
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

  const definitions = useMemo(() => {
    return definitionEvents
      .map(parseBadgeDefinition)
      .filter((def): def is BadgeDefinition => def !== null)
      .sort((a, b) => (a.name ?? a.d).localeCompare(b.name ?? b.d));
  }, [definitionEvents]);

  // --- Fetch Awarded Badges (Kind 8) ---
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

  // --- Fetch Received Badges (Kind 8) ---
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


  // --- Process Awarded/Received Badges and Fetch Definitions ---
  const [processedAwardedBadges, setProcessedAwardedBadges] = useState<BadgeAward[]>([]);
  const [processedReceivedBadges, setProcessedReceivedBadges] = useState<BadgeAward[]>([]);
  const [badgeDefinitionsCache, setBadgeDefinitionsCache] = useState<Record<string, BadgeDefinition>>({});
  const [isLoadingBadgeDefs, setIsLoadingBadgeDefs] = useState(false);

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


  // --- Create Badge Definition Logic ---
  const handleCreateDefinition = useCallback(async () => {
    if (!ndk || !pubkey || !newDefData.d || !newDefData.name) {
      toast({ title: 'Error', description: 'Missing required fields (ID and Name).', variant: 'destructive' });
      return;
    }
    setIsCreatingDef(true);

    try {
      const event = new NDKEvent(ndk);
      event.kind = NDKKind.BadgeDefinition;
      event.pubkey = pubkey;
      event.created_at = Math.floor(Date.now() / 1000);
      event.content = ''; // Content must be empty for kind 30009

      const tags: NDKTag[] = [
        ['d', newDefData.d.trim()],
        ['name', newDefData.name.trim()],
      ];
      if (newDefData.description.trim()) tags.push(['description', newDefData.description.trim()]);
      if (newDefData.image.trim()) tags.push(['image', newDefData.image.trim()]);
      if (newDefData.thumb.trim()) tags.push(['thumb', newDefData.thumb.trim()]);
      event.tags = tags;

      await event.sign();
      const publishedRelays = await event.publish();

      if (publishedRelays.size > 0) {
        toast({ title: 'Success', description: 'Badge definition created.' });
        setIsCreateDefDialogOpen(false);
        setNewDefData({ d: '', name: '', description: '', image: '', thumb: '' }); // Reset form
        // Optionally trigger a re-fetch or wait for subscription update
      } else {
        throw new Error('Failed to publish to any relay.');
      }
    } catch (error: any) {
      console.error("Failed to create badge definition:", error);
      toast({ title: 'Error Creating Definition', description: error.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setIsCreatingDef(false);
    }
  }, [ndk, pubkey, newDefData, toast]);

  // --- Award Badge Logic ---
  const openAwardDialog = (definition: BadgeDefinition) => {
    setSelectedDefinition(definition);
    setAwardRecipientNpub('');
    setIsAwardDialogOpen(true);
  };

  const handleAwardBadge = useCallback(async () => {
    if (!ndk || !pubkey || !selectedDefinition || !awardRecipientNpub) {
      toast({ title: 'Error', description: 'Missing required information.', variant: 'destructive' });
      return;
    }

    let recipientHex = '';
    try {
      recipientHex = npubToHex(awardRecipientNpub.trim());
    } catch (e) {
      toast({ title: 'Invalid Recipient', description: 'Please enter a valid npub.', variant: 'destructive' });
      return;
    }

    setIsAwarding(true);
    try {
      const event = new NDKEvent(ndk);
      event.kind = NDKKind.BadgeAward;
      event.pubkey = pubkey;
      event.created_at = Math.floor(Date.now() / 1000);
      event.content = ''; // Content can be empty or contain a message

      const definitionCoord = `${NDKKind.BadgeDefinition}:${selectedDefinition.pubkey}:${selectedDefinition.d}`;
      const tags: NDKTag[] = [
        ['a', definitionCoord],
        ['p', recipientHex],
        // Optionally add the definition event id if known
        // ['e', selectedDefinition.id]
      ];
      event.tags = tags;

      await event.sign();
      const publishedRelays = await event.publish();

      if (publishedRelays.size > 0) {
        toast({ title: 'Success', description: `Badge awarded to ${ellipsis(awardRecipientNpub, 15)}.` });
        setIsAwardDialogOpen(false);
        // Optionally trigger a re-fetch or wait for subscription update
      } else {
        throw new Error('Failed to publish award to any relay.');
      }
    } catch (error: any) {
      console.error("Failed to award badge:", error);
      toast({ title: 'Error Awarding Badge', description: error.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setIsAwarding(false);
    }
  }, [ndk, pubkey, selectedDefinition, awardRecipientNpub, toast]);

  // --- Render Logic ---
  if (activeUser === undefined) {
    return <div className="flex justify-center items-center h-full"><Spinner /></div>;
  }

  if (activeUser === null) {
    return <div className="p-4 text-center text-muted-foreground">Please log in to manage badges.</div>;
  }

  const renderLoading = () => (
    <div className="flex justify-center items-center p-8"><Spinner /></div>
  );

  return (
    <div className="p-4 space-y-6">
      {/* Header and Create Definition Dialog */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <AwardIcon className="w-6 h-6" />
          Manage Badges (NIP-58)
        </h1>
        <Dialog open={isCreateDefDialogOpen} onOpenChange={setIsCreateDefDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="w-4 h-4 mr-2" />
              Create Badge Definition
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Badge Definition</DialogTitle>
              <DialogDescription>Define a new type of badge you can award.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="def-d" className="text-right">ID (d tag)*</Label>
                <Input id="def-d" value={newDefData.d} onChange={(e) => setNewDefData({...newDefData, d: e.target.value})} className="col-span-3" placeholder="unique-badge-identifier" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="def-name" className="text-right">Name*</Label>
                <Input id="def-name" value={newDefData.name} onChange={(e) => setNewDefData({...newDefData, name: e.target.value})} className="col-span-3" placeholder="Awesome Badge" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="def-desc" className="text-right">Description</Label>
                <Textarea id="def-desc" value={newDefData.description} onChange={(e) => setNewDefData({...newDefData, description: e.target.value})} className="col-span-3" placeholder="What this badge is for" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="def-image" className="text-right">Image URL</Label>
                <Input id="def-image" value={newDefData.image} onChange={(e) => setNewDefData({...newDefData, image: e.target.value})} className="col-span-3" placeholder="https://example.com/badge.png" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="def-thumb" className="text-right">Thumbnail URL</Label>
                <Input id="def-thumb" value={newDefData.thumb} onChange={(e) => setNewDefData({...newDefData, thumb: e.target.value})} className="col-span-3" placeholder="https://example.com/badge_thumb.png" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDefDialogOpen(false)} disabled={isCreatingDef}>Cancel</Button>
              <Button onClick={handleCreateDefinition} disabled={isCreatingDef || !newDefData.d || !newDefData.name}>
                {isCreatingDef && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Definition
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Award Badge Dialog */}
      <Dialog open={isAwardDialogOpen} onOpenChange={setIsAwardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Award Badge: {selectedDefinition?.name}</DialogTitle>
            <DialogDescription>
              Enter the npub of the user you want to award this badge to.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="recipient-npub" className="text-right">Recipient npub*</Label>
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
            <Button variant="outline" onClick={() => setIsAwardDialogOpen(false)} disabled={isAwarding}>Cancel</Button>
            <Button onClick={handleAwardBadge} disabled={isAwarding || !awardRecipientNpub}>
              {isAwarding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Award Badge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="my-badges">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-badges">My Badges</TabsTrigger>
          <TabsTrigger value="awarded">Awarded</TabsTrigger>
          <TabsTrigger value="definitions">Definitions</TabsTrigger>
        </TabsList>

        {/* My Received Badges Tab */}
        <TabsContent value="my-badges" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>My Earned Badges</CardTitle>
              <CardDescription>Badges you have received.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingReceived || isLoadingBadgeDefs ? renderLoading() : processedReceivedBadges.length > 0 ? (
                processedReceivedBadges.map((award) => (
                  <BadgeAwardItem
                    key={award.id}
                    award={award}
                    perspective="recipient"
                    definition={badgeDefinitionsCache[award.definitionEventId || '']}
                  />
                ))
              ) : (
                <p className="text-muted-foreground text-center">You haven't earned any badges yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Badges I Awarded Tab */}
        <TabsContent value="awarded" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Badges You Awarded</CardTitle>
              <CardDescription>Badges you have given to others.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingAwarded || isLoadingBadgeDefs ? renderLoading() : processedAwardedBadges.length > 0 ? (
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

        {/* My Definitions Tab */}
        <TabsContent value="definitions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>My Badge Definitions</CardTitle>
              <CardDescription>Badge types you have created.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingDefs ? renderLoading() : definitions.length > 0 ? (
                definitions.map((def) => (
                  <div key={def.id} className="flex items-center justify-between gap-4 p-3 border rounded">
                     <div className="flex items-center gap-4 overflow-hidden">
                       <Avatar className="w-10 h-10 flex-shrink-0">
                         <AvatarImage src={def.thumb || def.image} alt={def.name} />
                         <AvatarFallback><ImageIcon className="w-5 h-5 text-muted-foreground" /></AvatarFallback>
                       </Avatar>
                       <div className="overflow-hidden">
                         <p className="font-semibold truncate">{def.name} ({def.d})</p>
                         <p className="text-sm text-muted-foreground truncate">{def.description}</p>
                       </div>
                     </div>
                     <Button variant="outline" size="sm" onClick={() => openAwardDialog(def)}>Award</Button>
                  </div>
                ))
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


// --- Sub-Components ---

// Component to display a single badge award
const BadgeAwardItem = ({ award, perspective, definition }: { award: BadgeAward; perspective: 'awarder' | 'recipient'; definition?: BadgeDefinition }) => {
  const otherPartyHex = perspective === 'awarder' ? award.recipient : award.awarder;
  const { profile: otherPartyProfile, status: profileStatus } = useProfile({ pubkey: otherPartyHex });

  const otherPartyNpub = useMemo(() => {
    try {
      return nip19.npubEncode(otherPartyHex);
    } catch { return otherPartyHex; }
  }, [otherPartyHex]);

  const badgeName = definition?.name || award.definitionEventId?.split(':')[2] || 'Unknown Badge';
  const badgeThumb = definition?.thumb || definition?.image;
  const otherPartyName = otherPartyProfile?.displayName || otherPartyProfile?.name || ellipsis(otherPartyNpub, 15);

  return (
    <div className="flex items-center justify-between gap-4 p-3 border rounded">
      <div className="flex items-center gap-4 overflow-hidden">
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarImage src={badgeThumb} alt={badgeName} />
          <AvatarFallback><AwardIcon className="w-5 h-5 text-muted-foreground" /></AvatarFallback>
        </Avatar>
        <div className="overflow-hidden">
          <p className="font-semibold truncate">{badgeName}</p>
          <div className="text-sm text-muted-foreground truncate flex items-center gap-1">
            <span>{perspective === 'awarder' ? 'To: ' : 'From: '}</span>
            {profileStatus === 'loading' ? (
              <Skeleton className="h-4 w-20 inline-block" />
            ) : (
              <Link to={`/profile/${otherPartyNpub}`} className="hover:underline flex items-center gap-1">
                <Avatar className="w-4 h-4">
                  <AvatarImage src={otherPartyProfile?.image} alt={otherPartyName} />
                  <AvatarFallback className="text-xs"><UserIcon size={10} /></AvatarFallback>
                </Avatar>
                <span>{otherPartyName}</span>
              </Link>
            )}
          </div>
        </div>
      </div>
      <span className="text-xs text-muted-foreground flex-shrink-0">
        {new Date(award.awardedAt * 1000).toLocaleDateString()}
      </span>
    </div>
  );
};

function npubToHex(arg0: string): string {
    throw new Error('Function not implemented.');
}
