import { HashIcon, PlusIcon, TagIcon, X } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { cn } from '@/shared/utils';
import { BadgeTag } from '../types';

interface TagInputProps {
  tags: BadgeTag[];
  onChange: (tags: BadgeTag[]) => void;
  hashtags: string[];
  onHashtagsChange: (hashtags: string[]) => void;
}

export const TagInput = ({ 
  tags, 
  onChange, 
  hashtags = [], 
  onHashtagsChange = () => {} 
}: TagInputProps) => {
  const [tagName, setTagName] = useState('');
  const [tagValue, setTagValue] = useState('');
  const [hashtag, setHashtag] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tags' | 'hashtags'>('tags');

  const addTag = () => {
    if (!tagName.trim()) {
      setError('Tag name is required');
      return;
    }
    
    if (!tagValue.trim()) {
      setError('Tag value is required');
      return;
    }
    
    // Check if tag with same name already exists
    if (tags.some(tag => tag.name === tagName.trim())) {
      setError(`Tag with name "${tagName}" already exists`);
      return;
    }
    
    onChange([...tags, { name: tagName.trim(), value: tagValue.trim() }]);
    setTagName('');
    setTagValue('');
    setError(null);
  };

  const removeTag = (tagToRemove: BadgeTag) => {
    onChange(tags.filter(tag => tag.name !== tagToRemove.name));
  };
  
  const addHashtag = () => {
    if (!hashtag.trim()) {
      setError('Hashtag is required');
      return;
    }
    
    // Format hashtag correctly (remove # if provided)
    let formattedHashtag = hashtag.trim();
    if (formattedHashtag.startsWith('#')) {
      formattedHashtag = formattedHashtag.substring(1);
    }
    
    if (formattedHashtag === '') {
      setError('Hashtag cannot be empty');
      return;
    }
    
    // Check if hashtag already exists
    if (hashtags.includes(formattedHashtag)) {
      setError(`Hashtag "#${formattedHashtag}" already exists`);
      return;
    }
    
    onHashtagsChange([...hashtags, formattedHashtag]);
    setHashtag('');
    setError(null);
  };
  
  const removeHashtag = (hashtagToRemove: string) => {
    onHashtagsChange(hashtags.filter(h => h !== hashtagToRemove));
  };

  return (
    <div className="space-y-3">
      <Tabs 
        value={activeTab} 
        onValueChange={(v) => {
          setActiveTab(v as 'tags' | 'hashtags');
          setError(null);
        }}
        className="w-full"
      >
        <div className="flex items-center justify-between">
          <TabsList className="grid w-[200px] grid-cols-2">
            <TabsTrigger value="tags">
              <TagIcon size={14} className="mr-1.5" />
              Tags
            </TabsTrigger>
            <TabsTrigger value="hashtags">
              <HashIcon size={14} className="mr-1.5" />
              Hashtags
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="tags" className="space-y-3 mt-3">
          <div className="flex flex-wrap gap-2 min-h-[36px] p-1 border rounded-md">
            {tags.length > 0 ? (
              tags.map((tag, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs py-1.5 pl-2 pr-1 gap-1 items-center">
                  <span className="font-semibold">{tag.name}:</span> {tag.value}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 rounded-full hover:bg-destructive/20"
                    onClick={() => removeTag(tag)}
                  >
                    <X size={10} />
                  </Button>
                </Badge>
              ))
            ) : (
              <div className="text-xs text-muted-foreground flex items-center px-1.5">
                <TagIcon size={12} className="mr-1.5" />
                No tags added yet
              </div>
            )}
          </div>
          
          <div className="flex gap-2 items-start">
            <div className="flex-grow space-y-1">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    value={tagName}
                    onChange={(e) => setTagName(e.target.value)}
                    placeholder="Tag name"
                    className="text-sm"
                  />
                </div>
                <div className="flex-1">
                  <Input
                    value={tagValue}
                    onChange={(e) => setTagValue(e.target.value)}
                    placeholder="Tag value"
                    className="text-sm"
                  />
                </div>
              </div>
              {error && activeTab === 'tags' && (
                <p className="text-xs text-destructive">{error}</p>
              )}
            </div>
            <Button 
              type="button" 
              size="sm" 
              onClick={addTag} 
              variant="outline"
              className={cn("flex-shrink-0 mt-0", error && activeTab === 'tags' && "mt-0")}
            >
              <PlusIcon size={16} className="mr-1" /> Add
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Add custom tags to describe this badge (e.g., category, level, etc.)
          </p>
        </TabsContent>
        
        <TabsContent value="hashtags" className="space-y-3 mt-3">
          <div className="flex flex-wrap gap-2 min-h-[36px] p-1 border rounded-md">
            {hashtags.length > 0 ? (
              hashtags.map((tag, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs py-1.5 px-2 gap-1 items-center">
                  #{tag}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 rounded-full hover:bg-destructive/20 ml-1"
                    onClick={() => removeHashtag(tag)}
                  >
                    <X size={10} />
                  </Button>
                </Badge>
              ))
            ) : (
              <div className="text-xs text-muted-foreground flex items-center px-1.5">
                <HashIcon size={12} className="mr-1.5" />
                No hashtags added yet
              </div>
            )}
          </div>
          
          <div className="flex gap-2 items-start">
            <div className="flex-grow space-y-1">
              <Input
                value={hashtag}
                onChange={(e) => setHashtag(e.target.value)}
                placeholder="Enter hashtag (e.g., nostr, badge)"
                className="text-sm"
              />
              {error && activeTab === 'hashtags' && (
                <p className="text-xs text-destructive">{error}</p>
              )}
            </div>
            <Button 
              type="button" 
              size="sm" 
              onClick={addHashtag} 
              variant="outline"
              className="flex-shrink-0"
            >
              <PlusIcon size={16} className="mr-1" /> Add
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Add hashtags to categorize this badge for better discoverability
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
};
