import { useCallback, useEffect, useState } from 'react';
import { IndexedProject, ProjectStats } from '../types';
import { AngorNostrService } from '../services/nostr';

const INDEXER_URL = 'https://tbtc.indexer.angor.io/';
const INITIAL_OFFSET = 0;
const LIMIT = 20;

export const useAngorHub = () => {
  const [projects, setProjects] = useState<IndexedProject[] | null | undefined>(undefined);
  const [stats, setStats] = useState<Record<string, ProjectStats>>({});
  const [offset, setOffset] = useState(INITIAL_OFFSET);
  const [totalProjects, setTotalProjects] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isTotalFetched, setIsTotalFetched] = useState(false);
  const nostrService = AngorNostrService.getInstance();

  const reset = useCallback(() => {
    setProjects(undefined);
    setStats({});
    setOffset(INITIAL_OFFSET);
    setTotalProjects(0);
    setHasMore(true);
    setIsLoading(false);
    setIsTotalFetched(false);
  }, []);

  const filterUniqueProjects = useCallback((newProjects: IndexedProject[], existingProjects: IndexedProject[] = []) => {
    return newProjects.filter(
      newProject => !existingProjects.some(
        existing => existing.projectIdentifier === newProject.projectIdentifier
      )
    );
  }, []);

  const fetchProjects = async (currentOffset: number) => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    try {
      const res = await fetch(
        `${INDEXER_URL}api/query/Angor/projects?limit=${LIMIT}&offset=${currentOffset}&sort=desc`
      );
      if (!res.ok) throw new Error('Failed to fetch projects');

      // Get total count from headers if not fetched yet
      if (!isTotalFetched) {
        const total = res.headers.get('pagination-total');
        if (total) {
          setTotalProjects(parseInt(total, 10));
          setIsTotalFetched(true);
          // Start from the end
          const newOffset = Math.max(parseInt(total, 10) - LIMIT, 0);
          setOffset(newOffset);
          // If different from current offset, fetch again with new offset
          if (newOffset !== currentOffset) {
            setIsLoading(false);
            return fetchProjects(newOffset);
          }
        }
      }

      const indexedProjects = await res.json() as IndexedProject[];
      const uniqueProjects = filterUniqueProjects(indexedProjects, projects || []);
      
      if (uniqueProjects.length < LIMIT) {
        setHasMore(false);
      }

      if (uniqueProjects.length > 0) {
        const projectIds = uniqueProjects.map(p => p.nostrEventId);
        const nostrDetails = await nostrService.fetchProjectsDataBulk(projectIds);
        
        const enrichedProjects = await Promise.all(
          uniqueProjects.map(async (project) => {
            const nostrData = nostrDetails[project.nostrEventId];
            const projectStats = await nostrService.fetchProjectStats(project.projectIdentifier);

            if (projectStats) {
              setStats(prev => ({ ...prev, [project.projectIdentifier]: projectStats }));
            }

            return {
              ...project,
              details: nostrData?.details,
              content: nostrData?.content,
              metadata: nostrData?.metadata,
            };
          })
        );

        setProjects(prev => prev ? [...prev, ...enrichedProjects] : enrichedProjects);
      }

    } catch (error) {
      console.error('Error fetching projects:', error);
      if (!projects) setProjects(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = useCallback(() => {
    if (offset > 0) {
      const newOffset = Math.max(offset - LIMIT, 0);
      setOffset(newOffset);
      fetchProjects(newOffset);
    }
  }, [offset]);

  useEffect(() => {
    fetchProjects(offset);
  }, []);

  return { 
    projects, 
    stats, 
    loadMore, 
    hasMore, 
    isLoading,
    reset,
    total: totalProjects 
  };
};
