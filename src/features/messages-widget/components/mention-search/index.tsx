import { NDKUser, NDKEvent } from '@nostr-dev-kit/ndk';
import { useNdk } from 'nostr-hooks';
import { memo, useEffect, useState } from 'react';
import { Search } from 'lucide-react';

import { Spinner } from '@/shared/components/spinner';
import { MentionSearchItem } from './mention-search-item';
import { ScrollArea } from '@/shared/components/ui/scroll-area';

interface MentionSearchProps {
  query: string;
  onSelect: (user: NDKUser) => void;
}

export const MentionSearch = memo(
  ({ query, onSelect }: MentionSearchProps) => {
    const [events, setEvents] = useState<NDKEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const { ndk } = useNdk();
    
    useEffect(() => {
      if (!ndk || !query || query.trim().length < 2) {
        setEvents([]);
        return;
      }

      setLoading(true);
      
      const searchRelay = 'wss://relay.nostr.band';
      const filter = { kinds: [0], limit: 20, search: query };
      
      ndk.fetchEvents(
        [filter],
        { closeOnEose: true },
        undefined,
        [searchRelay],
      ).then((results) => {
        setEvents(Array.from(results));
      }).catch((error) => {
        console.error("Failed to search for profiles:", error);
      }).finally(() => {
        setLoading(false);
      });
    }, [ndk, query]);

    const handleSelectUser = (event: NDKEvent) => {
      const user = new NDKUser({ pubkey: event.pubkey });
      if (event.content) {
        try {
          user.profile = JSON.parse(event.content);
        } catch (e) {
          console.error("Failed to parse profile:", e);
        }
      }
      onSelect(user);
    };

    if (loading) {
      return (
        <div className="flex justify-center items-center h-40">
          <Spinner />
        </div>
      );
    }

    if (!query || query.trim().length < 2) {
      return (
        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
          <Search className="h-12 w-12 mb-2 opacity-20" />
          <p>Type at least 2 characters to search</p>
        </div>
      );
    }

    if (events.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
          <p>No users found</p>
          <p className="text-xs mt-2">Try a different search term</p>
        </div>
      );
    }

    return (
      <ScrollArea className="h-[250px]">
        {events.map((event) => (
          <MentionSearchItem
            key={event.id}
            event={event}
            onClick={() => handleSelectUser(event)}
          />
        ))}
      </ScrollArea>
    );
  }
);
