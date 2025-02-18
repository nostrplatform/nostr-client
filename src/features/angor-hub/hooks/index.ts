import { useEffect, useState } from 'react';
import { IndexedProject, ProjectStats } from '../types';
import { AngorNostrService } from '../services/nostr';

const INDEXER_URL = 'https://tbtc.indexer.angor.io/';
const LIMIT = 50;

export const useAngorHub = () => {
  const [projects, setProjects] = useState<IndexedProject[] | null | undefined>(undefined);
  const [stats, setStats] = useState<Record<string, ProjectStats>>({});
  const nostrService = AngorNostrService.getInstance();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        // Fetch last 50 projects
        const res = await fetch(`${INDEXER_URL}api/query/Angor/projects?limit=${LIMIT}`);
        if (!res.ok) throw new Error('Failed to fetch projects');

        const indexedProjects = await res.json() as IndexedProject[];
        
        // First fetch all project details from nostr relays in bulk
        const projectIds = indexedProjects.map(p => p.nostrEventId);
        const nostrDetails = await nostrService.fetchProjectsDataBulk(projectIds);
        
        // Then enrich projects with nostr data and stats
        const enrichedProjects = await Promise.all(
          indexedProjects.map(async (project) => {
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

        setProjects(enrichedProjects);

      } catch (error) {
        console.error('Error fetching projects:', error);
        setProjects(null);
      }
    };

    fetchProjects();
  }, []);

  return { projects, stats };
};
