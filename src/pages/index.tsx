import {
  BellIcon,
  BookmarkIcon,
  CompassIcon,
  HomeIcon,
  MailIcon,
  SearchIcon,
  RadioTowerIcon,
} from 'lucide-react';
import { useActiveUser } from 'nostr-hooks';
import { Link, Outlet, createBrowserRouter } from 'react-router-dom';

import { ActiveUserWidget } from '@/features/active-user-widget';
import { LoginWidget } from '@/features/login-widget';
import { SearchWidget } from '@/features/search-widget';
import { TrendingNotesWidget } from '@/features/trending-notes-widget';
import { AngorHub } from '@/features/angor-hub';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';

const Layout = () => {
  const { activeUser } = useActiveUser();

  return (
    <>
      <div className="h-full w-full max-w-screen-xl mx-auto overflow-hidden grid grid-cols-1 md:grid-cols-12">
        <div
          id="sidebar"
          className="hidden flex-col gap-2 overflow-hidden items-center w-full p-2 border-r md:flex md:col-span-1 xl:items-start xl:col-span-2"
        >
          <Link to="/" className="flex items-center gap-2 p-2">
            <div className="w-8 h-8">
              <img src="/icons/icon48.png" alt="Nostr Platform" className="w-8 h-8 object-contain" />
            </div>

            <span className="text-lg font-bold hidden xl:block">Nostr Platform</span>
          </Link>

          <div className="flex flex-col gap-2 items-center xl:w-full xl:items-start">
            <Link
              to="/"
              className="flex items-center gap-2 p-2 transition-colors duration-500 ease-out text-primary/60 hover:text-primary w-full rounded-lg hover:bg-secondary"
            >
              <div>
                <HomeIcon size={24} />
              </div>

              <span className="hidden xl:block">Home</span>
            </Link>

            <Link
              to="/"
              className="flex items-center gap-2 p-2 transition-colors duration-500 ease-out text-primary/60 hover:text-primary w-full rounded-lg hover:bg-secondary"
            >
              <div>
                <CompassIcon size={24} />
              </div>

              <span className="hidden xl:block">Explore</span>
            </Link>

            <Link
              to="/messages"
              className="flex items-center gap-2 p-2 transition-colors duration-500 ease-out text-primary/60 hover:text-primary w-full rounded-lg hover:bg-secondary"
            >
              <div>
                <MailIcon size={24} />
              </div>

              <span className="hidden xl:block">Messages</span>
            </Link>

            <Link
              to="/"
              className="flex items-center gap-2 p-2 transition-colors duration-500 ease-out text-primary/60 hover:text-primary w-full rounded-lg hover:bg-secondary"
            >
              <div>
                <BookmarkIcon size={24} />
              </div>

              <span className="hidden xl:block">Bookmarks</span>
            </Link>

            <Link
              to="/notifications"
              className="flex items-center gap-2 p-2 transition-colors duration-500 ease-out text-primary/60 hover:text-primary w-full rounded-lg hover:bg-secondary"
            >
              <div>
                <BellIcon size={24} />
              </div>

              <span className="hidden xl:block">Notifications</span>
            </Link>

            <Link
              to="/relays"
              className="flex items-center gap-2 p-2 transition-colors duration-500 ease-out text-primary/60 hover:text-primary w-full rounded-lg hover:bg-secondary"
            >
              <div>
                <RadioTowerIcon size={24} />
              </div>
              <span className="hidden xl:block">Relays</span>
            </Link>

            <SearchWidget>
              <div className="flex items-center gap-2 p-2 transition-colors duration-500 ease-out text-primary/60 hover:text-primary w-full rounded-lg hover:bg-secondary hover:cursor-pointer">
                <div>
                  <SearchIcon size={24} />
                </div>

                <span className="hidden xl:block">Search</span>
              </div>
            </SearchWidget>
          </div>

          <div className="mt-auto w-full">
            <div className="flex flex-col gap-4 w-full items-center">
               <div>{activeUser ? <ActiveUserWidget /> : <LoginWidget />}</div>
            </div>
          </div>
        </div>

        <div
          id="main"
          className="overflow-hidden w-full col-span-12 md:col-span-11 lg:col-span-8 xl:col-span-7"
        >
          <div
            id="navbar"
            className="flex items-center justify-between p-2 border-b w-full bg-background md:hidden"
          >
            <div className="flex items-center gap-2 ">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8">
                  <img src="/icons/icon48.png" alt="Nostr Platform" className="w-8 h-8 object-contain" />
                </div>

                <span className="text-lg font-bold">Nostr Platform</span>
              </Link>
            </div>

            <div>{activeUser ? <ActiveUserWidget /> : <LoginWidget />}</div>
          </div>

          <div className="h-[calc(100vh-6.8rem)] md:h-full w-full overflow-y-auto">
            <Outlet />
          </div>

          <div
            id="controlbar"
            className="fixed overflow-hidden w-full border-t px-4 py-2 bottom-0 left-0 right-0 z-10 bg-background md:hidden"
          >
            <div className="flex flex-row gap-2 w-full items-center justify-between">
              <Link
                to="/"
                className="flex items-center gap-2 transition-colors duration-500 ease-out text-primary/60 hover:text-primary"
              >
                <div>
                  <HomeIcon size={28} strokeWidth={1.4} />
                </div>
              </Link>

              <Link
                to="/"
                className="flex items-center gap-2 transition-colors duration-500 ease-out text-primary/60 hover:text-primary"
              >
                <div>
                  <CompassIcon size={28} strokeWidth={1.4} />
                </div>
              </Link>

              <SearchWidget>
                <div className="flex items-center gap-2 transition-colors duration-500 ease-out text-primary/60 hover:text-primary hover:cursor-pointer">
                  <div>
                    <SearchIcon size={28} strokeWidth={1.4} />
                  </div>
                </div>
              </SearchWidget>

              <Link
                to="/messages"
                className="flex items-center gap-2 transition-colors duration-500 ease-out text-primary/60 hover:text-primary"
              >
                <div>
                  <MailIcon size={28} strokeWidth={1.4} />
                </div>
              </Link>

              <Link
                to="/relays"
                className="flex items-center gap-2 transition-colors duration-500 ease-out text-primary/60 hover:text-primary"
              >
                <div>
                  <RadioTowerIcon size={28} strokeWidth={1.4} />
                </div>
              </Link>
                    
              <Link
                to="/notifications"
                className="flex items-center gap-2 transition-colors duration-500 ease-out text-primary/60 hover:text-primary"
              >
                <div>
                  <BellIcon size={28} strokeWidth={1.4} />
                </div>
              </Link>

 
            </div>
          </div>
        </div>

        <div
          id="rightbar"
          className="hidden border-l flex-col h-screen overflow-hidden items-center p-2 lg:flex lg:col-span-3"
        >
          <Tabs defaultValue="trending" className="w-full h-full flex flex-col">
            <TabsList className="w-full grid grid-cols-2 mb-4">
              <TabsTrigger 
                value="trending"
                className="py-2 text-primary/60 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary transition-colors"
              >
                Trending Notes
              </TabsTrigger>
              <TabsTrigger 
                value="angor"
                className="py-2 text-primary/60 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary transition-colors"
              >
                Angor Projects
              </TabsTrigger>
            </TabsList>
            <TabsContent value="trending" className="flex-1 overflow-auto">
              <TrendingNotesWidget />
            </TabsContent>
            <TabsContent value="angor" className="flex-1 overflow-auto">
              <AngorHub />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

const HomePage = () => import('./home');
const NotePage = () => import('./note');
const ProfilePage = () => import('./profile');
const MessagesPage = () => import('./messages');
const NotificationsPage = () => import('./notifications');
const RelaysPage = () => import('./relays');

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/',
        async lazy() {
          return { Component: (await HomePage()).HomePage };
        },
      },
      {
        path: '/note/:noteId',
        async lazy() {
          return { Component: (await NotePage()).NotePage };
        },
      },
      {
        path: '/profile/:npub',
        async lazy() {
          return { Component: (await ProfilePage()).ProfilePage };
        },
      },
      {
        path: '/messages',
        async lazy() {
          return { Component: (await MessagesPage()).MessagesPage };
        },
      },
      {
        path: '/messages/:npub',
        async lazy() {
          return { Component: (await MessagesPage()).MessagesPage };
        },
      },
      {
        path: '/notifications',
        async lazy() {
          return { Component: (await NotificationsPage()).NotificationsPage };
        },
      },
      {
        path: '/relays',
        async lazy() {
          return { Component: (await RelaysPage()).RelaysPage };
        },
      },
    ],
  },
]);
