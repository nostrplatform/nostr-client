import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { ImageIcon, ExternalLinkIcon, PlayIcon } from 'lucide-react';
import { Spinner } from '@/shared/components/spinner';


interface MediaItem {
  url: string;
  type: 'image' | 'video' | string;
}

export const ProjectMediaGallery = ({ media }: { media?: MediaItem[] | string[] | null }) => {
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [validMediaItems, setValidMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  
  useEffect(() => {
    console.log("Media received:", media);
    
    const processMediaItems = () => {
      setIsLoading(true);
      
      
      if (!media || !Array.isArray(media) || media.length === 0) {
        console.log("No valid media array found");
        setValidMediaItems([]);
        setIsLoading(false);
        return;
      }
      
      
      const normalizedItems: MediaItem[] = media.map(item => {
        
        if (typeof item === 'object' && item !== null && 'url' in item && 'type' in item) {
          return item as MediaItem;
        }
        
        
        if (typeof item === 'string') {
          const url = item;
          const extension = url.split('.').pop()?.toLowerCase();
          let type = 'image'; 
          
          
          if (['mp4', 'webm', 'ogg', 'mov'].includes(extension || '')) {
            type = 'video';
          }
          
          return { url, type };
        }
        
        
        return null;
      }).filter(Boolean) as MediaItem[];
      
      
      const validItems = normalizedItems.filter(item => {
        try {
          
          new URL(item.url);
          return true;
        } catch (e) {
          console.warn("Invalid URL format:", item.url);
          return false;
        }
      });
      
      console.log("Valid media items:", validItems);
      setValidMediaItems(validItems);
      setIsLoading(false);
    };
    
    processMediaItems();
  }, [media]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Spinner />
        <p className="mt-4 text-muted-foreground">Loading media...</p>
      </div>
    );
  }

  if (!validMediaItems.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <ImageIcon className="h-12 w-12 mb-4 opacity-20" />
        <p>No media content available</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {validMediaItems.map((item, idx) => (
          <div 
            key={idx}
            className="relative aspect-video group cursor-pointer overflow-hidden rounded-lg bg-muted"
            onClick={() => setSelectedItem(item)}
          >
            {item.type === 'video' ? (
              <div className="relative w-full h-full flex items-center justify-center bg-black">
                <video 
                  src={item.url}
                  className="w-full h-full object-contain"
                  preload="metadata"
                  onError={(e) => {
                    console.warn(`Video failed to load: ${item.url}`);
                    e.currentTarget.style.display = 'none';
                    (e.currentTarget.nextSibling as HTMLElement).classList.remove('hidden');
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center hidden">
                  <PlayIcon className="h-12 w-12 text-muted-foreground/50" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <PlayIcon className="h-16 w-16 text-white/90" />
                </div>
              </div>
            ) : (
              <img
                src={item.url}
                alt={`Project media ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                onError={(e) => {
                  console.warn(`Image failed to load: ${item.url}`);
                  (e.target as HTMLImageElement).src = '/nostr.svg';
                }}
              />
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button variant="secondary" size="sm">
                {item.type === 'video' ? 'Play Video' : 'View Image'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-[70vw] max-h-[70vh] w-auto h-auto p-0">
 
          <div className="relative w-full h-full bg-black flex items-center justify-center">
            {selectedItem?.type === 'video' ? (
              <video
                src={selectedItem.url}
                className="max-w-full max-h-[calc(70vh-2rem)] object-contain"
                controls
                autoPlay
                onError={(e) => {
                  console.warn(`Video failed to load: ${selectedItem.url}`);
                  e.currentTarget.style.display = 'none';
                  const errorMsg = document.createElement('div');
                  errorMsg.className = "text-white text-center p-4";
                  errorMsg.innerHTML = "Failed to load video";
                  e.currentTarget.parentNode?.appendChild(errorMsg);
                }}
              />
            ) : (
              <img
                src={selectedItem?.url || ''}
                alt="Full size media"
                className="max-w-full max-h-[calc(70vh-2rem)] object-contain"
                onError={(e) => {
                  console.warn(`Image failed to load: ${selectedItem?.url}`);
                  (e.target as HTMLImageElement).src = '/nostr.svg';
                }}
              />
            )}
            <Button
              variant="outline"
              size="icon"
              className="absolute top-4 left-4"
              onClick={() => window.open(selectedItem?.url || '', '_blank')}
            >
              <ExternalLinkIcon className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
