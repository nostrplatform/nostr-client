import { useState, useEffect, useRef } from 'react';
import { useNdk } from 'nostr-hooks';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { AngorNostrService } from '../services/nostr';
import { IndexedProject } from '../types';

export const useProject = (projectId: string) => {
  const { ndk } = useNdk();
  const [project, setProject] = useState<IndexedProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('description');
  const [updates, setUpdates] = useState<NDKEvent[]>([]);
  const [comments, setComments] = useState<NDKEvent[]>([]);
  const subscriptionsRef = useRef<(() => void)[]>([]);
  const nostrService = AngorNostrService.getInstance();

  
  useEffect(() => {
    const loadProject = async () => {
      try {
        const projectData = await nostrService.fetchProjectData(projectId);
        if (projectData) {
          
          const stats = await nostrService.fetchProjectStats(projectId);
          if (projectData && 'founderKey' in projectData && 'nostrEventId' in projectData) {
            setProject({
              ...projectData,
              stats,
              projectIdentifier: '',
              createdOnBlock: 0,
              trxId: '',
              details_created_at: 0,
              metadata_created_at: 0,
              content_created_at: 0,
            } as IndexedProject);
          } else {
            setProject(null);
          }
        }
      } catch (error) {
        console.error('Error loading project:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProject();

    
    if (ndk) {
      const unsubscribe = nostrService.subscribeToProjectUpdates([projectId], (data) => {
        setProject(prev => ({ ...prev, ...data } as IndexedProject));
      });
      subscriptionsRef.current.push(unsubscribe);
    }

    return () => {
      subscriptionsRef.current.forEach(unsub => unsub());
      subscriptionsRef.current = [];
    };
  }, [projectId, ndk]);

  
  const handleTabChange = async (tab: string) => {
    setCurrentTab(tab);
    
    if (tab === 'updates' && updates.length === 0) {
      await fetchUpdates();
    }
    if (tab === 'comments' && comments.length === 0) {
      await fetchComments();
    }
  };

  
  const fetchUpdates = async () => {
    if (!project?.details?.nostrPubKey || !ndk) return;
    
    try {
      const filter = {
        kinds: [1],
        authors: [project.details.nostrPubKey],
        limit: 50,
      };
      const events = await ndk.fetchEvents(filter);
      setUpdates(Array.from(events));
    } catch (error) {
      console.error('Error fetching updates:', error);
    }
  };

  
  const fetchComments = async () => {
    if (!project?.details?.nostrPubKey || !ndk) return;
    
    try {
      const filter = {
        kinds: [1],
        '#p': [project.details.nostrPubKey],
        limit: 50,
      };
      const events = await ndk.fetchEvents(filter);
      setComments(Array.from(events));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  
  const isFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('angor-hub-favorites') || '[]');
    return favorites.includes(projectId);
  };

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('angor-hub-favorites') || '[]');
    const index = favorites.indexOf(projectId);

    if (index === -1) {
      favorites.push(projectId);
    } else {
      favorites.splice(index, 1);
    }

    localStorage.setItem('angor-hub-favorites', JSON.stringify(favorites));
  };

  return {
    project,
    loading,
    currentTab,
    updates,
    comments,
    handleTabChange,
    isFavorite,
    toggleFavorite
  };
};
