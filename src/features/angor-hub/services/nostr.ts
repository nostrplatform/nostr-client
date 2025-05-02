import NDK, { NDKEvent, NDKKind, NDKFilter, NDKUserProfile, NDKSubscription } from '@nostr-dev-kit/ndk';
import { ProjectUpdate, NostrProjectData, ProjectStats } from '../types';
import { nip19 } from 'nostr-tools';

const INDEXER_URL = 'https://fulcrum.angor.online/';


const RELAY_URLS = [
  'wss://relay.angor.io',
  'wss://relay2.angor.io',
  'wss://nos.lol',
  'wss://relay.primal.net',
  'wss://purplepag.es'
];


const SUBSCRIPTION_TIMEOUT = 5000;

/**
 * Service for interacting with Angor projects on Nostr
 */
export class AngorNostrService {
  private static instance: AngorNostrService;
  private ndk: NDK | null = null;
  private isConnected = false;
  private activeSubscriptions: Set<NDKSubscription> = new Set();
  
  
  private projectCache: Map<string, NostrProjectData> = new Map();
  private statsCache: Map<string, ProjectStats> = new Map();
  private profileCache: Map<string, NDKUserProfile> = new Map();
  private contentCache: Map<string, {
    content?: string;
    media?: string[];
    members?: string[];
    faq?: Array<{question: string; answer: string}>;
  }> = new Map();

  private constructor() {
    
    this.ndk = new NDK({
      explicitRelayUrls: RELAY_URLS,
    });
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): AngorNostrService {
    if (!AngorNostrService.instance) {
      AngorNostrService.instance = new AngorNostrService();
    }
    return AngorNostrService.instance;
  }
  
  /**
   * Add additional relays to connect to
   */
  public addRelays(relayUrls: string[]) {
    const uniqueUrls = new Set([
      ...RELAY_URLS,
      ...relayUrls
    ]);
    
    
    this.ndk = new NDK({
      explicitRelayUrls: Array.from(uniqueUrls),
    });
    this.isConnected = false;
  }

  /**
   * Ensure NDK is connected to relays
   */
  public async ensureConnected(): Promise<NDK> {
    if (this.ndk && this.isConnected) {
      return this.ndk;
    }

    if (!this.ndk) {
      this.ndk = new NDK({
        explicitRelayUrls: RELAY_URLS,
      });
    }

    try {
      await this.ndk.connect();
      this.isConnected = true;
      return this.ndk;
    } catch (error) {
      console.error('Failed to connect to relays:', error);
      throw error;
    }
  }

  /**
   * Fetch project stats from indexer
   */
  public async fetchProjectStats(projectId: string): Promise<ProjectStats | null> {
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

  /**
   * Fetch all data for a project by ID
   */
  public async fetchProjectData(projectId: string): Promise<NostrProjectData> {
    const cached = this.projectCache.get(projectId);
    if (cached) return cached;

    try {
      const ndk = await this.ensureConnected();
      const projectData: NostrProjectData = { projectId };
      
      
      const event = await ndk.fetchEvent({ ids: [projectId] });
      if (event) {
        try {
          projectData.content = event.content;
          
          
          const details: ProjectUpdate = JSON.parse(event.content);
          projectData.details = details;
          
          
          if (details.nostrPubKey) {
            
            const profile = await this.fetchProfileData(details.nostrPubKey);
            if (profile) {
              projectData.metadata = profile;
              projectData.name = profile.name;
              projectData.picture = profile.picture;
              projectData.about = profile.about;
              projectData.website = profile.website;
            }
            
            
            const contentData = await this.fetchProjectContent(details.nostrPubKey);
            projectData.content = contentData.content;
            projectData.media = contentData.media;
            projectData.members = contentData.members;
            projectData.faq = contentData.faq;
          }
        } catch (error) {
          console.error('Error parsing project data:', error);
        }
      }
      
      this.projectCache.set(projectId, projectData);
      return projectData;
    } catch (error) {
      console.error('Error fetching project data:', error);
      return { projectId };
    }
  }
  
  /**
   * Fetch profile data for a pubkey
   */
  private async fetchProfileData(pubkey: string): Promise<NDKUserProfile | null> {
    const cached = this.profileCache.get(pubkey);
    if (cached) return cached;
    
    try {
      const ndk = await this.ensureConnected();
      
      const filter: NDKFilter = {
        kinds: [0],
        authors: [pubkey],
        limit: 1,
      };
      
      return new Promise((resolve) => {
        let profile: NDKUserProfile | null = null;
        const sub = ndk.subscribe(filter);
        this.activeSubscriptions.add(sub);
        
        const timeout = setTimeout(() => {
          sub.stop(); 
          this.activeSubscriptions.delete(sub);
          resolve(profile);
        }, SUBSCRIPTION_TIMEOUT);
        
        sub.on('event', (event: NDKEvent) => {
          try {
            profile = JSON.parse(event.content);
            if (profile) {
              this.profileCache.set(pubkey, profile);
            }
          } catch (error) {
            console.error('Failed to parse profile:', error);
          }
        });
        
        sub.on('eose', () => {
          clearTimeout(timeout);
          sub.stop(); 
          this.activeSubscriptions.delete(sub);
          resolve(profile);
        });
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }
  
  /**
   * Fetch project content data (description, media, team members)
   */
  public async fetchProjectContent(pubkey: string): Promise<{
    content?: string;
    media?: string[];
    members?: string[];
    faq?: Array<{question: string; answer: string}>;
  }> {
    const cached = this.contentCache.get(pubkey);
    if (cached) return cached;
    
    const result: {
      content?: string;
      media?: string[];
      members?: string[];
      faq?: Array<{question: string; answer: string}>;
    } = {};
    
    try {
      const ndk = await this.ensureConnected();
      
      const filters = [
        {
          kinds: [NDKKind.AppSpecificData],
          authors: [pubkey],
          '#d': ['angor:project'],
        },
        {
          kinds: [NDKKind.AppSpecificData], 
          authors: [pubkey],
          '#d': ['angor:media'],
        },
        {
          kinds: [NDKKind.AppSpecificData],
          authors: [pubkey], 
          '#d': ['angor:members'],
        },
        {
          kinds: [NDKKind.AppSpecificData],
          authors: [pubkey],
          '#d': ['angor:faq'],
        }
      ];
      
      return new Promise((resolve) => {
        const sub = ndk.subscribe(filters);
        this.activeSubscriptions.add(sub);
        
        const timeout = setTimeout(() => {
          sub.stop(); 
          this.activeSubscriptions.delete(sub);
          this.contentCache.set(pubkey, result);
          resolve(result);
        }, SUBSCRIPTION_TIMEOUT);
        
        sub.on('event', (event: NDKEvent) => {
          try {
            const dTag = event.tags.find(t => t[0] === 'd')?.[1];
            
            switch(dTag) {
              case 'angor:project':
                result.content = event.content;
                break;
                
              case 'angor:media':
                try {
                  const mediaContent = event.content;
                  console.log("Raw media content:", mediaContent);
                  
                  if (!mediaContent || mediaContent.trim() === '') {
                    console.log("Empty media content");
                    result.media = [];
                  } else {
                    try {
                      
                      const parsedMedia = JSON.parse(mediaContent);
                      
                      if (Array.isArray(parsedMedia)) {
                        
                        result.media = parsedMedia;
                      } else if (typeof parsedMedia === 'object' && parsedMedia !== null) {
                        
                        result.media = [parsedMedia];
                      } else {
                        
                        result.media = [parsedMedia.toString()];
                      }
                      
                      console.log("Successfully parsed media:", result.media);
                    } catch (parseError) {
                      
                      console.log("Failed to parse media JSON, trying alternative formats");
                      
                      if (mediaContent.includes(',')) {
                        result.media = mediaContent.split(',').map(url => url.trim());
                      } else {
                        result.media = [mediaContent.trim()];
                      }
                    }
                  }
                } catch (e) {
                  console.error('Failed to process media content:', e);
                  result.media = [];
                }
                break;
                
              case 'angor:members':
                try {
                  console.log("Raw members content:", event.content);
                  
                  if (!event.content || event.content.trim() === '') {
                    console.log("Empty members content");
                    result.members = [];
                  } else {
                    try {
                      
                      const parsedMembers = JSON.parse(event.content);
                      
                      if (Array.isArray(parsedMembers)) {
                        result.members = parsedMembers;
                      } else if (typeof parsedMembers === 'object' && parsedMembers !== null) {
                        
                        if ('pubkeys' in parsedMembers && Array.isArray(parsedMembers.pubkeys)) {
                          console.log("Found pubkeys array:", parsedMembers.pubkeys);
                          
                          
                          interface MembersObject {
                            pubkeys: string[];
                          }

 
                          result.members = (parsedMembers as MembersObject).pubkeys.map<string | null>((key: string) => {
                            
                            if (typeof key === 'string' && key.length === 64 && /^[0-9a-f]+$/i.test(key)) {
                              return key;
                            }
                            
                            
                            if (typeof key === 'string' && key.startsWith('npub1')) {
                              try {
                                const { data } = nip19.decode(key);
                                return data as string;
                              } catch (e) {
                                console.warn("Invalid npub format:", key);
                                return null;
                              }
                            }
                            
                            return null;
                          }).filter((key: string | null): key is string => Boolean(key)); 
                        } else if ('members' in parsedMembers && Array.isArray(parsedMembers.members)) {
                          result.members = parsedMembers.members;
                        } else {
                          
                          const possibleMembers = Object.values(parsedMembers).filter(
                            (val): val is string => typeof val === 'string' && 
                            ((val.length === 64 && /^[0-9a-f]+$/i.test(val)) || 
                             val.startsWith('npub1'))
                          );
                          
                          result.members = possibleMembers.length > 0 ? possibleMembers.map(key => {
                            if (typeof key === 'string' && key.startsWith('npub1')) {
                              try {
                                const { data } = nip19.decode(key);
                                return data as string;
                              } catch (e) {
                                return null;
                              }
                            }
                            return key;
                          }).filter((key): key is string => key !== null) : [];
                        }
                      } else if (typeof parsedMembers === 'string') {
                        
                        if (parsedMembers.includes(',')) {
                          result.members = parsedMembers.split(',').map(key => key.trim());
                        } else {
                          result.members = [parsedMembers];
                        }
                      }
                    } catch (parseError) {
                      
                      console.log("Failed to parse members JSON, trying alternative formats");
                      
                      if (event.content.includes(',')) {
                        result.members = event.content.split(',').map(key => key.trim());
                      } else {
                        result.members = [event.content.trim()];
                      }
                    }
                    console.log("Processed members:", result.members);
                  }
                } catch (e) {
                  console.error('Failed to parse members content:', e);
                  result.members = [];
                }
                break;
                
              case 'angor:faq':
                try {
                  result.faq = JSON.parse(event.content);
                } catch (e) {
                  console.error('Failed to parse FAQ content:', e);
                }
                break;
            }
          } catch (error) {
            console.error('Failed to process content event:', error);
          }
        });
        
        sub.on('eose', () => {
          clearTimeout(timeout);
          sub.stop(); 
          this.activeSubscriptions.delete(sub);
          this.contentCache.set(pubkey, result);
          resolve(result);
        });
      });
    } catch (error) {
      console.error('Error fetching project content:', error);
      return result;
    }
  }

  /**
   * Fetch data for multiple projects at once
   */
  public async fetchProjectsDataBulk(projectIds: string[]): Promise<Record<string, NostrProjectData>> {
    const ndk = await this.ensureConnected();
    const results: Record<string, NostrProjectData> = {};
    const uncachedIds = projectIds.filter(id => !this.projectCache.has(id));
    
    
    projectIds.forEach(id => {
      if (this.projectCache.has(id)) {
        results[id] = this.projectCache.get(id)!;
      }
    });
    
    if (uncachedIds.length === 0) {
      return results;
    }

    try {
      
      const filter: NDKFilter = { 
        ids: uncachedIds 
      };
      
      const events = await ndk.fetchEvents(filter);
      
      
      const pubkeysToFetch = new Set<string>();
      
      for (const event of events) {
        try {
          const projectData: NostrProjectData = {
            projectId: event.id,
            content: event.content,
            createdAt: event.created_at,
          };
          
          try {
            
            const details = JSON.parse(event.content) as ProjectUpdate;
            projectData.details = details;
            
            
            if (details.nostrPubKey) {
              pubkeysToFetch.add(details.nostrPubKey);
            }
          } catch (e) {
            console.error('Failed to parse project details:', e);
          }
          
          results[event.id] = projectData;
          this.projectCache.set(event.id, projectData);
        } catch (e) {
          console.error('Error processing project event:', e);
        }
      }
      
      
      if (pubkeysToFetch.size > 0) {
        const pubkeyArray = Array.from(pubkeysToFetch);
        
        
        const profileFilter: NDKFilter = {
          kinds: [0],
          authors: pubkeyArray,
        };
        
        const profileEvents = await ndk.fetchEvents(profileFilter);
        const profileMap = new Map<string, NDKUserProfile>();
        
        for (const event of profileEvents) {
          try {
            const profile = JSON.parse(event.content);
            profileMap.set(event.pubkey, profile);
            this.profileCache.set(event.pubkey, profile);
          } catch (e) {
            console.error('Failed to parse profile:', e);
          }
        }
        
        
        const contentFilters: NDKFilter[] = [
          {
            kinds: [NDKKind.AppSpecificData],
            authors: pubkeyArray,
            '#d': ['angor:project'],
          },
          {
            kinds: [NDKKind.AppSpecificData],
            authors: pubkeyArray,
            '#d': ['angor:media'],
          },
          {
            kinds: [NDKKind.AppSpecificData],
            authors: pubkeyArray,
            '#d': ['angor:members'],
          }
        ];
        
        const contentEvents = await ndk.fetchEvents(contentFilters);
        const contentMap = new Map<string, {
          content?: string;
          media?: string[];
          members?: string[];
        }>();
        
        for (const event of contentEvents) {
          try {
            const dTag = event.tags.find(t => t[0] === 'd')?.[1];
            if (!contentMap.has(event.pubkey)) {
              contentMap.set(event.pubkey, {});
            }
            
            const pubkeyContent = contentMap.get(event.pubkey)!;
            
            if (dTag === 'angor:project') {
              pubkeyContent.content = event.content;
            } else if (dTag === 'angor:media') {
              try {
                pubkeyContent.media = JSON.parse(event.content);
              } catch (e) {
                console.error('Failed to parse media content:', e);
              }
            } else if (dTag === 'angor:members') {
              try {
                pubkeyContent.members = JSON.parse(event.content);
              } catch (e) {
                console.error('Failed to parse members content:', e);
              }
            }
          } catch (e) {
            console.error('Error processing content event:', e);
          }
        }
        
        
        for (const projectId in results) {
          const projectData = results[projectId];
          
          if (projectData.details?.nostrPubKey) {
            const pubkey = projectData.details.nostrPubKey;
            
            
            if (profileMap.has(pubkey)) {
              const profile = profileMap.get(pubkey)!;
              projectData.metadata = profile;
              projectData.name = profile.name;
              projectData.picture = profile.picture;
              projectData.about = profile.about;
              projectData.website = profile.website;
            }
            
            
            if (contentMap.has(pubkey)) {
              const content = contentMap.get(pubkey)!;
              projectData.content = content.content || projectData.content;
              projectData.media = content.media;
              projectData.members = content.members;
            }
            
            
            this.projectCache.set(projectId, projectData);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching projects data in bulk:', error);
    }

    return results;
  }
  
  /**
   * Subscribe to real-time project updates
   */
  public subscribeToProjectUpdates(projectIds: string[], callback: (data: NostrProjectData) => void): () => void {
    if (projectIds.length === 0) {
      return () => {};
    }
    
    let sub: NDKSubscription | null = null;
    
    this.ensureConnected()
      .then(ndk => {
        const filter: NDKFilter = {
          kinds: [30078],
          ids: projectIds,
        };
        
        sub = ndk.subscribe(filter);
        this.activeSubscriptions.add(sub);
        
        sub.on('event', async (event) => {
          try {
            
            const projectData: NostrProjectData = {
              projectId: event.id,
              content: event.content,
              createdAt: event.created_at,
            };
            
            try {
              
              const details: ProjectUpdate = JSON.parse(event.content);
              projectData.details = details;
              
              
              if (details.nostrPubKey) {
                const profile = await this.fetchProfileData(details.nostrPubKey);
                if (profile) {
                  projectData.metadata = profile;
                  projectData.name = profile.name;
                  projectData.picture = profile.picture;
                  projectData.about = profile.about;
                  projectData.website = profile.website;
                }
                
                
                const content = await this.fetchProjectContent(details.nostrPubKey);
                projectData.content = content.content || projectData.content;
                projectData.media = content.media;
                projectData.members = content.members;
              }
            } catch (e) {
              console.error('Failed to parse project details:', e);
            }
            
            
            this.projectCache.set(event.id, projectData);
            callback(projectData);
          } catch (error) {
            console.error('Error processing project update:', error);
          }
        });
      })
      .catch(error => {
        console.error('Failed to connect to relays:', error);
      });
    
    
    return () => {
      if (sub) {
        sub.stop(); 
        if (this.activeSubscriptions.has(sub)) {
          this.activeSubscriptions.delete(sub);
        }
      }
    };
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    
    for (const sub of this.activeSubscriptions) {
      sub.stop(); 
    }
    this.activeSubscriptions.clear();
    
    
    this.projectCache.clear();
    this.statsCache.clear();
    this.profileCache.clear();
    this.contentCache.clear();
    
    
    this.isConnected = false;
    this.ndk = null;
  }
}
