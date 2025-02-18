import NDK, { NDKKind } from '@nostr-dev-kit/ndk';
import { ProjectUpdate, NostrProjectData, ProjectStats } from '../types';

const INDEXER_URL = 'https://tbtc.indexer.angor.io/';

const RELAY_URLS = [
  'wss://relay.angor.io',
  'wss://relay2.angor.io',
  'wss://nos.lol',
];

export class AngorNostrService {
  private static instance: AngorNostrService;
  private ndk: NDK | null = null;
  private isConnected = false;
  private projectCache: Map<string, NostrProjectData> = new Map();
  private statsCache: Map<string, ProjectStats> = new Map();

  private constructor() {
    this.ndk = new NDK({
      explicitRelayUrls: RELAY_URLS,
    });
  }

  static getInstance(): AngorNostrService {
    if (!AngorNostrService.instance) {
      AngorNostrService.instance = new AngorNostrService();
    }
    return AngorNostrService.instance;
  }

  async ensureConnected(): Promise<NDK> {
    if (this.ndk && this.isConnected) {
      return this.ndk;
    }

    try {
      await this.ndk!.connect();
      this.isConnected = true;
      return this.ndk!;
    } catch (error) {
      console.error('Failed to connect to relays:', error);
      throw error;
    }
  }

  async fetchProjectStats(projectId: string): Promise<ProjectStats | null> {
    const cached = this.statsCache.get(projectId);
    if (cached) return cached;

    try {
      const res = await fetch(`${INDEXER_URL}api/query/Angor/projects/${projectId}/stats`);
      if (!res.ok) throw new Error('Failed to fetch stats');
      
      const stats = await res.json();
      this.statsCache.set(projectId, stats);
      return stats;
    } catch (error) {
      console.error('Error fetching project stats:', error);
      return null;
    }
  }

  async fetchProjectData(projectId: string): Promise<NostrProjectData> {
    const cached = this.projectCache.get(projectId);
    if (cached) return cached;

    const projectData = await this.fetchProjectDataFromRelay(projectId);
    this.projectCache.set(projectId, projectData);
    return projectData;
  }

  private async fetchProjectDataFromRelay(projectId: string): Promise<NostrProjectData> {
    const ndk = await this.ensureConnected();
    const projectData: NostrProjectData = { projectId };

    try {
      // Fetch project details
      const detailsFilter = { kinds: [30078], ids: [projectId] };
      const detailsEvents = await ndk.fetchEvents(detailsFilter);
      
      for (const event of detailsEvents) {
        try {
          projectData.details = JSON.parse(event.content) as ProjectUpdate;
          break;
        } catch (e) {
          console.error('Failed to parse project details:', e);
        }
      }

      if (projectData.details?.nostrPubKey) {
        const pubkey = projectData.details.nostrPubKey;

        // Fetch profile
        const profileFilter = { kinds: [0], authors: [pubkey], limit: 1 };
        const profileEvents = await ndk.fetchEvents(profileFilter);
        projectData.profileEvent = Array.from(profileEvents)[0];

        // Fetch project content
        const contentFilter = {
          kinds: [NDKKind.AppSpecificData],
          authors: [pubkey],
          '#d': ['angor:project', 'angor:media', 'angor:members'],
        };

        const contentEvents = await ndk.fetchEvents(contentFilter);
        for (const event of contentEvents) {
          const tags = event.tags || [];
          const dTag = tags.find(t => t[0] === 'd')?.[1];
          
          if (dTag === 'angor:project') {
            projectData.content = event.content;
          } else if (dTag === 'angor:media') {
            projectData.media = JSON.parse(event.content);
          } else if (dTag === 'angor:members') {
            projectData.members = JSON.parse(event.content);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching project data:', error);
    }

    return projectData;
  }

  async fetchProjectsDataBulk(projectIds: string[]): Promise<Record<string, NostrProjectData>> {
    const ndk = await this.ensureConnected();
    const results: Record<string, NostrProjectData> = {};

    try {
      // Fetch all project details in one query
      const detailsFilter = { kinds: [30078], ids: projectIds };
      const detailsEvents = await ndk.fetchEvents(detailsFilter);
      
      // Process each event and collect pubkeys
      const pubkeys = new Set<string>();
      for (const event of detailsEvents) {
        try {
          const details = JSON.parse(event.content) as ProjectUpdate;
          results[event.id] = {
            projectId: event.id,
            details
          };
          
          if (details.nostrPubKey) {
            pubkeys.add(details.nostrPubKey);
          }
        } catch (e) {
          console.error('Failed to parse project details:', e);
        }
      }

      // Fetch all profiles in one query
      if (pubkeys.size > 0) {
        const profileFilter = { kinds: [0], authors: Array.from(pubkeys) };
        const profileEvents = await ndk.fetchEvents(profileFilter);
        
        for (const event of profileEvents) {
          try {
            const metadata = JSON.parse(event.content);
            // Find all projects with this pubkey and update their metadata
            Object.values(results).forEach(projectData => {
              if (projectData.details?.nostrPubKey === event.pubkey) {
                projectData.metadata = metadata;
              }
            });
          } catch (e) {
            console.error('Failed to parse profile:', e);
          }
        }

        // Fetch all project content in one query
        const contentFilter = {
          kinds: [NDKKind.AppSpecificData],
          authors: Array.from(pubkeys),
          '#d': ['angor:project', 'angor:media', 'angor:members'],
        };

        const contentEvents = await ndk.fetchEvents(contentFilter);
        for (const event of contentEvents) {
          const tags = event.tags || [];
          const dTag = tags.find(t => t[0] === 'd')?.[1];
          
          // Find all projects with this pubkey and update their content
          Object.values(results).forEach(projectData => {
            if (projectData.details?.nostrPubKey === event.pubkey) {
              if (dTag === 'angor:project') {
                projectData.content = event.content;
              } else if (dTag === 'angor:media') {
                projectData.media = JSON.parse(event.content);
              } else if (dTag === 'angor:members') {
                projectData.members = JSON.parse(event.content);
              }
            }
          });
        }
      }
    } catch (error) {
      console.error('Error fetching projects data in bulk:', error);
    }

    return results;
  }
}
