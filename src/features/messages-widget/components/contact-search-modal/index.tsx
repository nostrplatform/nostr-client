import { NDKUser } from '@nostr-dev-kit/ndk';
import { useState, useEffect } from 'react';
import { Loader2, User, UserPlus, Search, X } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Input } from '@/shared/components/ui/input';

import { useContacts } from './hooks';
import { renderContactCard } from './render-contact-card';

export interface ContactSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (user: NDKUser) => void;
  searchQuery?: string;
}

export const ContactSearchModal = ({ 
  isOpen, 
  onClose, 
  onSelect, 
  searchQuery = '' 
}: ContactSearchModalProps) => {
  const [query, setQuery] = useState(searchQuery);
  const [activeTab, setActiveTab] = useState<string>(searchQuery ? "search" : "contacts");
  const { contacts, isLoading, filterContacts, searchContacts } = useContacts();
  const [filteredContacts, setFilteredContacts] = useState<NDKUser[]>([]);
  const [searchResults, setSearchResults] = useState<NDKUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  
  useEffect(() => {
    if (searchQuery) {
      setQuery(searchQuery);
      setActiveTab("search");
    }
  }, [searchQuery]);

  
  useEffect(() => {
    if (activeTab === "contacts") {
      setFilteredContacts(filterContacts(query));
    }
  }, [query, contacts, activeTab, filterContacts]);

  
  useEffect(() => {
    const performSearch = async () => {
      if (activeTab === "search" && query.trim().length > 1) {
        setIsSearching(true);
        try {
          const results = await searchContacts(query);
          setSearchResults(results);
        } catch (error) {
          console.error("Search failed:", error);
        } finally {
          setIsSearching(false);
        }
      }
    };

    const timer = setTimeout(() => {
      performSearch();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [query, activeTab, searchContacts]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    if (value === "search") {
      setSearchResults([]);
    }
  };
  
  const handleSelectUser = (user: NDKUser) => {
    console.log('User selected in modal:', user);
    
    
    if (user && user.npub) {
      
      onSelect(user);
      onClose();
    } else {
      console.error("Invalid user selected:", user);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mention a User</DialogTitle>
        </DialogHeader>
        
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts or users..."
            className="pl-8 pr-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button 
              className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
              onClick={() => setQuery('')}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground mb-4">
          <p>Enter a name, NIP-05 address, or npub to search for users.</p>
          <p>Search results will display verified status and user metadata.</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="contacts">My Contacts</TabsTrigger>
            <TabsTrigger value="search">Search Users</TabsTrigger>
          </TabsList>
          
          <TabsContent value="contacts" className="min-h-[300px]">
            <ScrollArea className="h-[300px]">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredContacts.length > 0 ? (
                <div className="space-y-1">
                  {filteredContacts.map(contact => renderContactCard(contact, handleSelectUser))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                  <User className="h-12 w-12 mb-2 opacity-20" />
                  {query ? (
                    <>
                      <p>No matching contacts found</p>
                      <p className="text-xs mt-2">
                        Try a different search term or check the Search tab
                      </p>
                    </>
                  ) : contacts.length === 0 ? (
                    <>
                      <p>No contacts found</p>
                      <p className="text-xs mt-2">
                        Follow users to add them to your contacts
                      </p>
                    </>
                  ) : (
                    <p>No contacts found</p>
                  )}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="search" className="min-h-[300px]">
            <ScrollArea className="h-[300px]">
              {isSearching ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map(user => renderContactCard(user, handleSelectUser))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                  {query && query.length > 1 ? (
                    <>
                      <UserPlus className="h-12 w-12 mb-2 opacity-20" />
                      <p>No users found</p>
                      <p className="text-xs mt-2">
                        Try a different search term or complete Nostr address (npub1...)
                      </p>
                    </>
                  ) : (
                    <>
                      <Search className="h-12 w-12 mb-2 opacity-20" />
                      <p>Type to search for users</p>
                      <p className="text-xs mt-2">
                        Search by name, NIP-05 identity, or npub address
                      </p>
                    </>
                  )}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
