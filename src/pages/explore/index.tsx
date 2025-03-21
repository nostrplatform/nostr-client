import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { TrendingNotesWidget } from '@/features/trending-notes-widget';
import { AngorHub } from '@/features/angor-hub';
import { Compass, TrendingUp, Rocket } from 'lucide-react';

export const ExplorePage = () => {
  const [currentTab, setCurrentTab] = useState<string>('angor');
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading state for better UX
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-full w-full flex flex-col">
      <div className="p-4 border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-2">
          <Compass className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Explore</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Discover trending content and projects on Nostr
        </p>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs
          defaultValue="angor"
          className="w-full h-full flex flex-col"
          value={currentTab}
          onValueChange={setCurrentTab}
        >
          <div className="border-b bg-background/95 sticky z-10">
            <TabsList className="h-12 w-full rounded-none bg-transparent p-0">
              <TabsTrigger
                value="angor"
                className="flex-1 h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none"
              >
                <div className="flex items-center justify-center gap-2">
                  <Rocket className="h-4 w-4" />
                  <span>Angor Projects</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="trending"
                className="flex-1 h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none"
              >
                <div className="flex items-center justify-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Trending Notes</span>
                </div>
              </TabsTrigger>

            </TabsList>
          </div>

          <TabsContent
            value="trending"
            className="flex-1 overflow-auto px-2 pt-4 data-[state=inactive]:hidden"
          >
            <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
              <TrendingNotesWidget />
            </div>
          </TabsContent>

          <TabsContent
            value="angor"
            className="flex-1 overflow-auto px-2 pt-4 data-[state=inactive]:hidden"
          >
            <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
              <AngorHub />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
