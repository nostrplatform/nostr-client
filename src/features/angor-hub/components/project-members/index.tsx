import { UsersIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { useRealtimeProfile } from 'nostr-hooks';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';

const MemberCard = ({ pubkey }: { pubkey: string }) => {
  // Convert npub to hex format if needed
  const hexPubkey = pubkey.startsWith('npub1') ? 
    (() => {
      try {
        const { type, data } = nip19.decode(pubkey);
        return type === 'npub' ? data as string : pubkey;
      } catch (e) {
        console.error('Invalid npub format:', pubkey);
        return pubkey;
      }
    })() : 
    pubkey;

  const { profile } = useRealtimeProfile(hexPubkey);
  const navigate = useNavigate();
  const loading = !profile;
  
  // Always encode to npub for display and navigation
  const npub = hexPubkey.length === 64 ? nip19.npubEncode(hexPubkey) : pubkey;
  const shortPubkey = `${hexPubkey.slice(0, 4)}...${hexPubkey.slice(-4)}`;

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 w-full">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className="p-4 hover:bg-muted/50 transition-colors cursor-pointer border"
      onClick={() => navigate(`/profile/${npub}`)}
    >
      <div className="flex items-center gap-4">
        <Avatar className="h-12 w-12 border-2 border-background">
          <AvatarImage src={profile?.picture} alt={profile?.name || shortPubkey} />
          <AvatarFallback>
            {(profile?.name || shortPubkey)[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">
            {profile?.name || profile?.display_name || shortPubkey}
          </p>
          {profile?.nip05 && (
            <p className="text-xs text-muted-foreground truncate">
              {profile.nip05}
            </p>
          )}
          {profile?.about && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
              {profile.about}
            </p>
          )}
        </div>
      </div>
      
 
    </Card>
  );
};

export const ProjectMembers = ({ members }: { members?: string[] }) => {
  console.log("Rendering members:", members);
  
  // Handle empty or invalid members array
  if (!members?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <UsersIcon className="h-12 w-12 mb-4 opacity-20" />
        <p>No team members listed</p>
      </div>
    );
  }

  // Filter out any invalid pubkeys, accepting both hex format and npub format
  const validMembers = members.filter(key => {
    if (typeof key !== 'string') return false;
    
    // Check for hex format pubkeys (64 chars, hex)
    if (key.length === 64 && /^[0-9a-f]+$/i.test(key)) return true;
    
    // Check for npub format
    if (key.startsWith('npub1')) {
      try {
        nip19.decode(key);
        return true;
      } catch {
        return false;
      }
    }
    
    return false;
  });

  if (validMembers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <UsersIcon className="h-12 w-12 mb-4 opacity-20" />
        <p>Invalid team member data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium">Team Members</h3>
        <Badge variant="outline">{validMembers.length} Members</Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {validMembers.map((pubkey) => (
          <MemberCard key={pubkey} pubkey={pubkey} />
        ))}
      </div>
    </div>
  );
};
