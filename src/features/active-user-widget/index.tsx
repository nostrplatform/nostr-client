import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { PowerIcon, UserIcon, MoonIcon, SunIcon, KeySquareIcon } from 'lucide-react';
import { useActiveUser, useLogin, useRealtimeProfile } from 'nostr-hooks';
import { useNavigate } from 'react-router-dom';
import { useCallback, useRef } from 'react';
import { CredentialsDocument } from '@/features/credentials-document';
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
   const { setTheme, theme } = useTheme();
  const navigate = useNavigate();
  const triggerRef = useRef<HTMLButtonElement>(null);

  const { logout, loginData } = useLogin();


  const downloadCredentials = useCallback(
    async ({ npub, nsec }: { npub: string; nsec: string }) => {
      const fileName = 'credentials.pdf';
      const blob = await pdf(<CredentialsDocument npub={npub} nsec={nsec} />).toBlob();
      saveAs(blob, fileName);
    },
    [],
  );



  if (!activeUser) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger ref={triggerRef}>
        <button className="flex items-center gap-2 cursor-pointer bg-secondary rounded-full xl:pl-1 xl:pr-2 xl:py-1">
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
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} style={{ width: triggerRef.current?.offsetWidth }}>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{profile?.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{profile?.nip05}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate(`/profile/${activeUser.npub}`)}>
          <UserIcon className="w-4 h-4 mr-2" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        <DropdownMenuItem
            onClick={() =>
              downloadCredentials({ npub: activeUser.npub, nsec: loginData.privateKey || '' })
            }
          >
            <KeySquareIcon className="w-4 h-4 mr-2" />
            Credentials (PDF)
          </DropdownMenuItem>
          <DropdownMenuSeparator />

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
        <DropdownMenuItem 
            onClick={() =>
              downloadCredentials({
                npub: activeUser.npub,
                nsec: loginData.privateKey || '',
              }).then(() => logout())
            }

        >
          <PowerIcon className="w-4 h-4 mr-2" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
