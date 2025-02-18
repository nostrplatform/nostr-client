import { PowerIcon, UserIcon, MoonIcon, SunIcon } from 'lucide-react';
import { useActiveUser, useLogin, useRealtimeProfile } from 'nostr-hooks';
import { useNavigate } from 'react-router-dom';

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/shared/components/ui/dropdown-menu';

import { ellipsis } from '@/shared/utils';
import { useTheme } from '@/shared/components/theme-provider';
import { Button } from '@/shared/components/ui/button';

export const ActiveUserWidget = () => {
  const { activeUser } = useActiveUser();
  const { profile } = useRealtimeProfile(activeUser?.pubkey);
  const { logout } = useLogin();
  const { setTheme, theme } = useTheme();

  const navigate = useNavigate();

  if (!activeUser) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div className="flex items-center gap-2 cursor-pointer bg-secondary rounded-full xl:pl-1 xl:pr-2 xl:py-1">
          <Avatar>
            <AvatarImage src={profile?.image} alt={profile?.name} className="object-cover" />
            <AvatarFallback className="bg-background/50" />
          </Avatar>

          <div className="text-start pr-2 hidden xl:block">
            {profile?.name && <div className="text-sm">{profile.name}</div>}
            <div className="text-xs text-primary/70">
              {profile?.nip05?.toString() || ellipsis(activeUser.npub, 10)}
            </div>
          </div>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8}>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{profile?.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{profile?.nip05}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate(`/profile/${activeUser.npub}`)}>
          <UserIcon className="w-4 h-4 mr-2" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem>
          {theme === 'dark' ? (
            <Button
              variant="ghost"
              className="flex w-full gap-2 justify-start p-0"
              onClick={() => setTheme('light')}
            >
              <SunIcon size={18} />
              <span>Light mode</span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              className="flex w-full gap-2 justify-start p-0"
              onClick={() => setTheme('dark')}
            >
              <MoonIcon size={18} />
              <span>Dark mode</span>
            </Button>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <PowerIcon className="w-4 h-4 mr-2" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
