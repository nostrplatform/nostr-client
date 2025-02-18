import { Muted } from '@/shared/components/ui/typography/muted';

import { Spinner } from '@/shared/components/spinner';

import { TrendingNoteItem } from './components';
import { useTrendingNotesWidget } from './hooks';

export const TrendingNotesWidget = () => {
  const { trendingNotes } = useTrendingNotesWidget();

  return (
    <div className="flex flex-col gap-2 w-full h-full overflow-y-auto overflow-x-hidden">
      {trendingNotes === undefined && <Spinner />}

      {trendingNotes === null && <Muted>Failed to fetch trending notes</Muted>}

      {trendingNotes && trendingNotes.map((note) => <TrendingNoteItem key={note.id} note={note} />)}
    </div>
  );
};
