import { NDKUser } from '@nostr-dev-kit/ndk';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { UserProfileWidget } from '@/features/user-profile-widget';

/**
 * Profile page component that displays user profile information via UserProfileWidget.
 *
 * This component takes a `npub` parameter from the URL and renders
 * a user profile widget for the corresponding user. If no valid npub
 * is provided or the user cannot be found, it displays an error message.
 *
 * @returns A React component that renders either:
 * - UserProfileWidget for valid user
 * - "Invalid profile" message for invalid/missing npub
 */
export const ProfilePage = () => {
  const { npub } = useParams();

  const user = useMemo(() => (npub ? new NDKUser({ npub }) : undefined), [npub]);

  if (!npub || !user) {
    return <p>Invalid profile</p>;
  }

  return (
    <>
      <div className="h-full w-full overflow-y-auto space-y-4 p-2 md:p-4">
        <UserProfileWidget user={user} />
      </div>
    </>
  );
};
