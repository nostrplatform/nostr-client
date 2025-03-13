import { NDKEvent, NDKUser } from '@nostr-dev-kit/ndk';
import { formatDistanceToNowStrict } from 'date-fns';
import {
  FileJsonIcon,
  HeartIcon,
  LinkIcon,
  SquareArrowOutUpRight,
  TagIcon,
  TextIcon,
  Activity,
  MoreVertical,
} from 'lucide-react';
import { useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Dialog } from '@/shared/components/ui/dialog';

import { NoteParentPreview } from '../note-parent-preview';
import { NoteReactionsModal } from '../note-reactions-modal';

import { useNoteHeader } from './hooks';

export const NoteHeader = ({
  event,
  enableMenu = true,
}: {
  event: NDKEvent;
  enableMenu?: boolean;
}) => {
  const { copy, navigate, profile, nevent, ref } = useNoteHeader(event);
  const [showReactionsModal, setShowReactionsModal] = useState(false);

  return (
    <>
      <div className="pt-2 flex justify-between gap-2" ref={ref}>
        <Avatar
          className="bg-foreground/10 hover:cursor-pointer"
          onClick={() => navigate(`/profile/${new NDKUser({ pubkey: event.pubkey }).npub}`)}
        >
          <AvatarImage src={profile?.image} alt={profile?.name} className="object-cover" />
          <AvatarFallback />
        </Avatar>

        <div className="grow flex flex-col justify-center">
          <p
            className="w-fit font-semibold leading-tight hover:cursor-pointer"
            onClick={() => navigate(`/profile/${new NDKUser({ pubkey: event.pubkey }).npub}`)}
          >
            {profile?.name?.toString()}
          </p>

          <p
            className="w-fit text-xs text-gray-500 leading-tight hover:cursor-pointer"
            onClick={() => navigate(`/profile/${new NDKUser({ pubkey: event.pubkey }).npub}`)}
          >
            {profile?.nip05?.toString()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <p className="text-xs text-gray-500">
            {formatDistanceToNowStrict((event.created_at || 0) * 1000)}
          </p>

          {enableMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <div className="opacity-40 hover:opacity-100 cursor-pointer p-2">
                  <MoreVertical size={18} />
                </div>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" sideOffset={8}>
                <DropdownMenuItem onClick={() => navigate(`/note/${nevent}`)}>
                  <SquareArrowOutUpRight className="w-4 h-4 mr-2" />
                  Open
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => setShowReactionsModal(true)}>
                  <Activity className="w-4 h-4 mr-2" />
                  Show reactions
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => {/* Handle repost */}}>
                  <HeartIcon className="w-4 h-4 mr-2" />
                  Repost
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => copy(`${window.location.origin}/note/${nevent}`)}>
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Copy note link
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => copy(event.content)}>
                  <TextIcon className="w-4 h-4 mr-2" />
                  Copy note text
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => copy(nevent)}>
                  <TagIcon className="w-4 h-4 mr-2" />
                  Copy note ID
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => copy(JSON.stringify(event.rawEvent()))}>
                  <FileJsonIcon className="w-4 h-4 mr-2" />
                  Copy raw data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="pt-2">
        <NoteParentPreview event={event} />
      </div>

      {showReactionsModal && (
        <Dialog modal={true} open={true} onOpenChange={setShowReactionsModal}>
          <NoteReactionsModal 
            event={event}
            onClose={() => setShowReactionsModal(false)}
          />
        </Dialog>
      )}
    </>
  );
};
