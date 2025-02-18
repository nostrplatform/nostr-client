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

export interface IndexedProject {
  founderKey: string;
  nostrEventId: string;
  projectIdentifier: string;
  createdOnBlock: number;
  trxId: string;
  profile?: {
    name?: string;
    picture?: string;
    about?: string;
  };
  details?: ProjectUpdate;
  details_created_at: number | undefined;
  metadata?: {
    name?: string;
    picture?: string;
    about?: string;
  };
  metadata_created_at: number | undefined;
  stats?: ProjectStats;
  content?: string;
  content_created_at: number | undefined;
}

export interface ProjectStats {
  investorCount: number;
  amountInvested: number;
  amountSpentSoFarByFounder: number;
  amountInPenalties: number;
  countInPenalties: number;
}

export interface NostrProjectData {
  projectId: string;
  content?: string;
  media?: string[];
  members?: string[];
  metadata?: NDKUserProfile;
  details?: ProjectUpdate;
  profileEvent?: NDKEvent;
}

export type AngorProjectsResponse = IndexedProject[];
