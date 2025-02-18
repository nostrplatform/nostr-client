import { NDKUser } from '@nostr-dev-kit/ndk';
import { useNavigate } from 'react-router-dom';
import { useProfile } from 'nostr-hooks';

export const ProfileHeader = ({ user }: { user: NDKUser }) => {
  const navigate = useNavigate();
  const { profile } = useProfile({ pubkey: user.pubkey });

  return (
    <div 
      className="p-4 border-b cursor-pointer flex items-center gap-3"
      onClick={() => navigate(`/profile/${user.npub}`)}
    >
      <img 
        src={profile?.image || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'} 
        alt="Profile"
        className="w-12 h-12 rounded-full object-cover"
        onError={(e) => {
          e.currentTarget.src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
        }}
      />
      <div className="min-w-0 flex-1">
        <div className="font-medium">
          {profile?.displayName || profile?.name || user.npub.slice(0, 8) + '...'}
        </div>
        {profile?.about && (
          <div className="text-sm text-gray-500 truncate max-w-full">
            {profile.about}
          </div>
        )}
      </div>
    </div>
  );
};
