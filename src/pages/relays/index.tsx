import { PlusIcon, TrashIcon } from 'lucide-react';
import { useNdk } from 'nostr-hooks';
import { useState } from 'react';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { useToast } from '@/shared/components/ui/use-toast';

export const RelaysPage = () => {
  const { toast } = useToast();
  const { ndk } = useNdk();
  const [newRelay, setNewRelay] = useState('');  const [relays, setRelays] = useState<string[]>(() => {
    const stored = localStorage.getItem('nostr-relays');
    return stored ? JSON.parse(stored) : ['wss://nos.lol', 'wss://relay.primal.net', 'wss://relay.nostr.band', 'wss://discovery-eu.nostria.app'];
  });

  const addRelay = () => {
    if (!newRelay.startsWith('wss://')) {
      toast({
        title: 'Invalid relay URL',
        description: 'Relay URL must start with wss://',
        variant: 'destructive',
      });
      return;
    }

    if (relays.includes(newRelay)) {
      toast({
        title: 'Relay already exists',
        description: 'This relay is already in the list',
        variant: 'destructive',
      });
      return;
    }

    const updatedRelays = [...relays, newRelay];
    setRelays(updatedRelays);
    localStorage.setItem('nostr-relays', JSON.stringify(updatedRelays));
    setNewRelay('');
    ndk?.connect();

    toast({
      title: 'Relay added',
      description: 'The relay has been added successfully',
    });
  };
  const removeRelay = (relay: string) => {
    // Prevent removal of discovery relay
    if (relay === 'wss://discovery-eu.nostria.app') {
      toast({
        title: 'Cannot remove this relay',
        description: 'The discovery relay is required for the application',
        variant: 'destructive',
      });
      return;
    }
    
    const updatedRelays = relays.filter((r) => r !== relay);
    setRelays(updatedRelays);
    localStorage.setItem('nostr-relays', JSON.stringify(updatedRelays));
    ndk?.connect();

    toast({
      title: 'Relay removed',
      description: 'The relay has been removed successfully',
    });
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Manage Relays</h1>
      
      <div className="flex gap-2 mb-6">
        <Input
          placeholder="wss://relay.example.com"
          value={newRelay}
          onChange={(e) => setNewRelay(e.target.value)}
        />
        <Button onClick={addRelay}>
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Relay
        </Button>
      </div>      <div className="space-y-2">
        {relays.map((relay) => (
          <div key={relay} className={`flex items-center justify-between p-3 border rounded ${relay === 'wss://discovery-eu.nostria.app' ? 'border-primary' : ''}`}>
            <div className="flex items-center gap-2">
              <span>{relay}</span>
              {relay === 'wss://discovery-eu.nostria.app' && (
                <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">Discovery Relay</span>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => removeRelay(relay)}
              className={relay === 'wss://discovery-eu.nostria.app' ? 'opacity-50' : ''}
            >
              <TrashIcon className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
