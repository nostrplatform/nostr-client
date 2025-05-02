import { NDKEvent, NDKUserProfile } from '@nostr-dev-kit/ndk';

export interface ProjectUpdate {
  founderKey: string;
  founderRecoveryKey: string;
  projectIdentifier: string;
  nostrPubKey: string;
  startDate: number;
  penaltyDays: number;
  expiryDate: number;
  targetAmount: number;
  stages: [{ amountToRelease: number; releaseDate: number }];
  projectSeeders: { threshold: number; secretHashes: string[] }[];
}

export interface ExternalIdentity {
  platform: string;
  username: string;
}

export interface IndexedProject {
  founderKey: string;
  nostrEventId: string;
  projectIdentifier: string;
  createdOnBlock: number;
  trxId: string;
  profile?: {
    name?: string;
    banner?: string;
    picture?: string;
    about?: string;
  };
  details?: ProjectUpdate;
  details_created_at: number | undefined;
  metadata?: {
    name?: string;
    banner?: string;
    picture?: string;
    about?: string;
    nip05?: string;
    website?: string;
    lud16?: string;
  };
  metadata_created_at: number | undefined;
  stats?: ProjectStats;
  content?: string;
  content_created_at: number | undefined;
  externalIdentities?: ExternalIdentity[];
  externalIdentities_created_at?: number;
  media?: string[];
  media_created_at?: number;
  members?: string[];
  members_created_at?: number;
}

export interface ProjectStats {
  investorCount: number;
  amountInvested: number;
  amountSpentSoFarByFounder: number;
  amountInPenalties: number;
  countInPenalties: number;
}

export interface MediaItem {
  url: string;
  type: string; 
}

export interface NostrProjectData {
  projectId: string;
  content?: string;
  media?: (string | MediaItem)[];
  members?: string[];
  faq?: Array<{question: string; answer: string}>;
  metadata?: NDKUserProfile;
  details?: ProjectUpdate;
  profileEvent?: NDKEvent;
  
  name?: string;
  picture?: string;
  about?: string;
  website?: string;
  createdAt?: number;
}

export type AngorProjectsResponse = IndexedProject[];
