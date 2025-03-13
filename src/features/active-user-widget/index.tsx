import { pdf, Document, Page, View, Text, Image } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { PowerIcon, UserIcon, MoonIcon, SunIcon, KeySquareIcon } from 'lucide-react';
import { useActiveUser, useLogin, useRealtimeProfile } from 'nostr-hooks';
import { useNavigate } from 'react-router-dom';
import { useCallback, useRef } from 'react';
import QRCode from 'qrcode';
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
      try {
        // Generate QR codes first
        const npubQR = await QRCode.toDataURL(npub, { 
          errorCorrectionLevel: 'H',
          margin: 1,
          width: 300
        });
        
        let nsecQR = '';
        if (nsec && nsec.trim() !== '') {
          nsecQR = await QRCode.toDataURL(nsec, { 
            errorCorrectionLevel: 'H',
            margin: 1,
            width: 300
          });
        }
        
        // Dynamic message based on available credentials
        const getSecurityMessage = () => {
          const hasBoth = npub && nsec && npub.trim() !== '' && nsec.trim() !== '';
          const hasAny = (npub && npub.trim() !== '') || (nsec && nsec.trim() !== '');
          
          if (hasBoth) {
            return "Please keep these credentials somewhere safe. We recommend keeping one print-out stored in a secure place.";
          } else if (hasAny) {
            return "Please keep this credential somewhere safe. We recommend keeping one print-out stored in a secure place.";
          }
          
          return "";
        };
        
        // Create temporary component with pre-generated QR codes
        const CredentialsWithQR = () => (
          <Document>
            <Page size="A4" style={{
              justifyContent: 'center',
              textAlign: 'center',
            }}>
              <View style={{ margin: 10, padding: 10, flexGrow: 1 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Nostr Platform Credentials</Text>
              </View>
              
              {nsec && (
                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Secret Key:</Text>
                  <Text style={{ fontSize: 12 }}>{nsec}</Text>
                  {nsecQR && (
                    <View style={{ alignItems: 'center', marginTop: 10, marginBottom: 20 }}>
                      <Image style={{ width: 180, height: 180 }} src={nsecQR} />
                    </View>
                  )}
                </View>
              )}
              
              {npub && (
                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Public Key:</Text>
                  <Text style={{ fontSize: 12 }}>{npub}</Text>
                  {npubQR && (
                    <View style={{ alignItems: 'center', marginTop: 10, marginBottom: 20 }}>
                      <Image style={{ width: 180, height: 180 }} src={npubQR} />
                    </View>
                  )}
                </View>
              )}
              
              <View style={{ margin: 10, padding: 10, flexGrow: 1 }}>
                <Text style={{ fontSize: 10, color: 'gray' }}>
                  {getSecurityMessage()}
                </Text>
              </View>
            </Page>
          </Document>
        );
        
        const fileName = 'credentials.pdf';
        const blob = await pdf(<CredentialsWithQR />).toBlob();
        saveAs(blob, fileName);
      } catch (error) {
        console.error("Failed to generate credentials PDF:", error);
        alert("Failed to generate credentials. Please try again.");
      }
    },
    [],
  );

  if (!activeUser) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
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

        <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? (
            <div className="flex w-full gap-2 items-center">
              <SunIcon size={18} className="w-4 h-4 mr-2" />
              <span>Light mode</span>
            </div>
          ) : (
            <div className="flex w-full gap-2 items-center">
              <MoonIcon size={18} className="w-4 h-4 mr-2" />
              <span>Dark mode</span>
            </div>
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
