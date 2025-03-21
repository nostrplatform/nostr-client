import { NDKEvent, NDKRelaySet } from '@nostr-dev-kit/ndk';
import { useNdk } from 'nostr-hooks';
import { memo, useEffect, useState } from 'react';

import { Spinner } from '@/shared/components/spinner';
import { SearchResultItem } from '../search-result-item';
import { Search } from 'lucide-react';

export const SearchResult = memo(
  ({ input }: { input: string }) => {
    const [events, setEvents] = useState<NDKEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { ndk } = useNdk();

    useEffect(() => {
      if (!ndk || !input || input.trim().length < 2) {
        setEvents([]);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        ndk.fetchEvents(
          [{ kinds: [0], limit: 100, search: input }],
          { closeOnEose: true },
          NDKRelaySet.fromRelayUrls(['wss://relay.nostr.band'], ndk),
        )
        .then((events) => {
          setEvents([...events]);
          if ([...events].length === 0) {
            setError("No results found");
          }
        })
        .catch((err) => {
          console.error("Search failed:", err);
          setError("Search failed. Please try again.");
        })
        .finally(() => {
          setLoading(false);
        });
      } catch (err) {
        console.error("Search error:", err);
        setError("Search failed. Please try again.");
        setLoading(false);
      }
    }, [ndk, input, setEvents, setLoading]);

    if (loading) {
      return (
        <div className="flex justify-center items-center h-40">
          <Spinner />
        </div>
      );
    }

    if (error && !events.length) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Search className="h-12 w-12 mb-2 opacity-20" />
          <p>{error}</p>
          <p className="text-xs mt-1">Try a different search term</p>
        </div>
      );
    }

    return (
      <>
        {events.map((event) => (
          <SearchResultItem key={event.id} event={event} />
        ))}
      </>
    );
  },
  (prev, next) => prev.input === next.input,
);
