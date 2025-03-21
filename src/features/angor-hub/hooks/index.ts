import { useCallback, useEffect, useState } from 'react';
import { IndexedProject, ProjectStats } from '../types';
import { AngorNostrService } from '../services/nostr';

const INDEXER_URL = 'https://tbtc.indexer.angor.io/';
const INITIAL_OFFSET = 0;
const LIMIT = 10;

export const useAngorHub = () => {
  const [projects, setProjects] = useState<IndexedProject[] | null | undefined>(undefined);
  const [stats, setStats] = useState<Record<string, ProjectStats>>({});
  const [offset, setOffset] = useState(INITIAL_OFFSET);
  const [totalProjects, setTotalProjects] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isTotalFetched, setIsTotalFetched] = useState(false);
  const nostrService = AngorNostrService.getInstance();

  const filterUniqueProjects = useCallback((newProjects: IndexedProject[], existingProjects: IndexedProject[] = []) => {
    return newProjects.filter(
      newProject => !existingProjects.some(
        existing => existing.nostrEventId === newProject.nostrEventId
      )
    );
  }, []);

  const fetchProjects = useCallback(async (currentOffset: number) => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    try {
      // First fetch just to get total if needed
      if (!isTotalFetched) {
        const countRes = await fetch(`${INDEXER_URL}api/query/Angor/projects?limit=1`);
        if (countRes.ok) {
          const total = countRes.headers.get('pagination-total');
          if (total) {
            const totalCount = parseInt(total, 10);
            setTotalProjects(totalCount);
            setIsTotalFetched(true);
            // Update offset but don't trigger another fetch
            currentOffset = Math.max(totalCount - LIMIT, 0);
            setOffset(currentOffset);
          }
        }
      }

      // Main fetch with correct offset
      const res = await fetch(
        `${INDEXER_URL}api/query/Angor/projects?limit=${LIMIT}&offset=${currentOffset}&sort=desc`
      );
      if (!res.ok) throw new Error('Failed to fetch projects');

      const indexedProjects = await res.json() as IndexedProject[];
      const uniqueProjects = filterUniqueProjects(indexedProjects, projects || []);
      
      // Check if we've reached the end
      if (currentOffset === 0 || uniqueProjects.length === 0) {
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
  }, [projects, isLoading, hasMore, isTotalFetched, filterUniqueProjects, nostrService]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      const newOffset = Math.max(offset - LIMIT, 0);
      setOffset(newOffset);
      fetchProjects(newOffset);
    }
  }, [offset, isLoading, hasMore, fetchProjects]);

  useEffect(() => {
    if (!projects) {
      fetchProjects(offset);
    }
  }, [fetchProjects, offset, projects]);

  const reset = useCallback(() => {
    setProjects(undefined);
    setStats({});
    setOffset(INITIAL_OFFSET);
    setTotalProjects(0);
    setHasMore(true);
    setIsLoading(false);
    setIsTotalFetched(false);
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
