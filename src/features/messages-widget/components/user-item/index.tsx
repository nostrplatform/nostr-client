import { NDKUser } from '@nostr-dev-kit/ndk';
import { useRealtimeProfile } from 'nostr-hooks';
import { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { Avatar, AvatarImage } from '@/shared/components/ui/avatar';

import { ellipsis } from '@/shared/utils';

const calculateSearchScore = (query: string, text?: string): number => {
  if (!text || !query) return 0;
  
  const normalizedQuery = query.toLowerCase().trim();
  const normalizedText = text.toLowerCase().trim();
  
  
  if (normalizedText === normalizedQuery) return 100;
  
  
  const words = normalizedText.split(/\s+/);
  if (words.includes(normalizedQuery)) return 90;
  
  
  if (normalizedText.startsWith(normalizedQuery)) return 80;
  
  
  if (normalizedText.includes(normalizedQuery)) return 70;
  
  
  if (words.some(word => word.startsWith(normalizedQuery))) return 60;
  
  
  let pos = 0;
  let allCharsInOrder = true;
  for (const char of normalizedQuery) {
    const nextPos = normalizedText.indexOf(char, pos);
    if (nextPos === -1) {
      allCharsInOrder = false;
      break;
    }
    pos = nextPos + 1;
  }
  if (allCharsInOrder) return 40;
  
  return 0;
};

export const UserItem = memo(
  ({ pubkey, searchQuery }: { pubkey: string; searchQuery?: string }) => {
    const { profile } = useRealtimeProfile(pubkey);
    const navigate = useNavigate();
    const npub = useMemo(() => new NDKUser({ pubkey }).npub, [pubkey]);

    const shouldShow = useMemo(() => {
      if (!searchQuery?.trim()) return true;
      
      const searchableItems = [
        { text: profile?.name?.toString(), weight: 2.0 },    
        { text: profile?.displayName?.toString(), weight: 2.0 },
        { text: profile?.nip05?.toString(), weight: 1.5 },   
        { text: npub, weight: 1.0 },                         
        { text: pubkey, weight: 0.8 },                       
        { text: profile?.about?.toString(), weight: 0.5 }    
      ];
      
      
      const scores = searchableItems.map(item => ({
        score: calculateSearchScore(searchQuery, item.text) * item.weight,
        text: item.text
      }));
      
      
      const maxScore = Math.max(...scores.map(s => s.score));
      
      
      return maxScore >= 40;
    }, [profile, npub, pubkey, searchQuery]);

    if (!shouldShow) return null;

    return (
      <>
        <div
          className="px-4 py-2 flex items-center gap-2 hover:cursor-pointer hover:bg-secondary"
          onClick={() => navigate(`/messages/${npub}`)}
        >
          <Avatar className="bg-secondary">
            <AvatarImage
              src={profile?.image?.toString()}
              alt="profile-image"
              className="object-cover"
            />
          </Avatar>

          <div className="hidden md:block">
            {profile?.name && <div>{ellipsis(profile.name.toString(), 20)}</div>}
            <div className="text-gray-500 text-sm">
              {ellipsis(profile?.nip05?.toString() || npub, 25)}
            </div>
          </div>
        </div>
      </>
    );
  },
  (prev, next) => 
    prev.pubkey === next.pubkey && 
    prev.searchQuery === next.searchQuery
);
