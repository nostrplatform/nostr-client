import { NDKUser } from '@nostr-dev-kit/ndk';
import { Check, UserCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';

export const renderContactCard = (user: NDKUser, onSelect: (user: NDKUser) => void) => {
  const profile = user.profile || {};
  const displayName = profile.displayName || profile.name || user.npub?.slice(0, 8) + '...';
  const nip05 = profile.nip05;
  const verified = profile.nip05Verified;
  
  const imageUrl = profile.image || profile.picture || '';

  return (
    <div
      key={user.npub}
      className="flex items-center p-2 rounded-md hover:bg-accent cursor-pointer"
      onClick={() => onSelect(user)}
    >
      <Avatar className="h-10 w-10 mr-3 flex-shrink-0">
        <AvatarImage src={imageUrl} alt={displayName} />
        <AvatarFallback>{displayName[0]?.toUpperCase() || '?'}</AvatarFallback>
      </Avatar>
      <div className="flex-grow min-w-0">
        <div className="flex items-center">
          <p className="font-medium text-sm truncate max-w-[180px]">{displayName}</p>
          {verified && (
            <Check className="h-4 w-4 ml-1 text-green-500 flex-shrink-0" />
          )}
        </div>
        {nip05 && (
          <p className="text-xs text-muted-foreground truncate max-w-[220px]">{nip05}</p>
        )}
      </div>
      <UserCheck className="h-4 w-4 ml-2 text-muted-foreground opacity-60 flex-shrink-0" />
    </div>
  );
};
