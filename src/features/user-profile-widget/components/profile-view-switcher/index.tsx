import { Button } from '@/shared/components/ui/button';
import { Award, MessageSquare, RadioTower, StickyNote } from 'lucide-react';

import { cn } from '@/shared/utils';

import { ProfileView } from '../../types';

export const ProfileViewSwitcher = ({
  view,
  setView,
}: {
  view: ProfileView;
  setView: React.Dispatch<React.SetStateAction<ProfileView>>;
}) => {
  return (
    <>
      <div className="border-b bg-background/95 sticky z-10">
        <div className="h-12 w-full grid grid-cols-4 rounded-none bg-transparent p-0">
          <Button
            onClick={() => setView('notes')}
            variant="ghost"
            className={cn(
              'flex-1 h-12 rounded-none border-b border-transparent pb-2 data-[state=active]:shadow-none data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground',
              view === 'notes' && 'border-primary text-primary',
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <StickyNote className="h-4 w-4" />
              <span>Notes</span>
            </div>
          </Button>
          <Button
            onClick={() => setView('replies')}
            variant="ghost"
            className={cn(
              'flex-1 h-12 rounded-none border-b border-transparent pb-2 data-[state=active]:shadow-none data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground',
              view === 'replies' && 'border-primary text-primary',
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span>Replies</span>
            </div>
          </Button>
          <Button
            onClick={() => setView('relays')}
            variant="ghost"
            className={cn(
              'flex-1 h-12 rounded-none border-b border-transparent pb-2 data-[state=active]:shadow-none data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground',
              view === 'relays' && 'border-primary text-primary',
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <RadioTower className="h-4 w-4" />
              <span>Relays</span>
            </div>
          </Button>
          <Button
            onClick={() => setView('badges')}
            variant="ghost"
            className={cn(
              'flex-1 h-12 rounded-none border-b border-transparent pb-2 data-[state=active]:shadow-none data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground',
              view === 'badges' && 'border-primary text-primary',
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <Award className="h-4 w-4" />
              <span>Badges</span>
            </div>
          </Button>
        </div>
      </div>
    </>
  );
};
