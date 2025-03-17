import { useLogin, useNdk } from 'nostr-hooks';
import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';

import './index.css';

import { router } from '@/pages';

import { ThemeProvider } from '@/shared/components/theme-provider';
import { Toaster } from '@/shared/components/ui/toaster';

export const App = () => {
  const { initNdk, ndk } = useNdk();
  const { loginFromLocalStorage } = useLogin();

  useEffect(() => {
    const storedRelays = localStorage.getItem('nostr-relays');
    const relays = storedRelays ? JSON.parse(storedRelays) : ['wss://nos.lol', 'wss://relay.primal.net', 'wss://relay.nostr.band', 'wss://relay.angor.io'];
    
    initNdk({
      explicitRelayUrls: relays,
    });
  }, [initNdk]);

  useEffect(() => {
    ndk?.connect();
  }, [ndk]);

  useEffect(() => {
    loginFromLocalStorage();
  }, [loginFromLocalStorage]);

  return (
    <>
      <ThemeProvider defaultTheme="dark" storageKey="theme">
        <RouterProvider router={router} />
        <Toaster />
      </ThemeProvider>
    </>
  );
};
