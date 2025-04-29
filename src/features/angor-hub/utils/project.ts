import { ExternalIdentity } from '../types';

export const formatDate = (timestamp?: number): string => {
  if (!timestamp) return 'N/A';
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const getSocialIcon = (platform: string): string => {
  const icons: Record<string, string> = {
    github: 'code',
    twitter: 'twitter',
    facebook: 'facebook',
    telegram: 'send',
    instagram: 'instagram',
    linkedin: 'linkedin',
    youtube: 'youtube',
    mastodon: 'share',
    twitch: 'twitch',
    discord: 'message-circle',
    email: 'mail'
  };

  return icons[platform.toLowerCase()] || 'link';
};

export const getSocialLink = (identity: ExternalIdentity): string => {
  const baseUrls: Record<string, string> = {
    github: 'https://github.com/',
    twitter: 'https://x.com/',
    facebook: 'https://facebook.com/',
    telegram: 'https://t.me/',
    instagram: 'https://instagram.com/',
    linkedin: 'https://linkedin.com/in/',
    youtube: 'https://youtube.com/@',
    mastodon: '',
    twitch: 'https://twitch.tv/',
    discord: 'https://discord.com/users/',
    email: 'mailto:'
  };

  if (identity.platform === 'mastodon') {
    return `https://${identity.username}`;
  }

  const baseUrl = baseUrls[identity.platform.toLowerCase()];
  return baseUrl ? `${baseUrl}${identity.username}` : '#';
};

export const formatUsername = (username: string): string => {
  if (username.includes('@')) {
    return '@' + username.split('@')[1];
  }
  return '@' + username;
};

export const getSpentPercentage = (stats?: { amountSpentSoFarByFounder?: number; amountInvested?: number }): number => {
  const spent = stats?.amountSpentSoFarByFounder ?? 0;
  const invested = stats?.amountInvested ?? 0;
  if (invested === 0) return 0;
  return Number(((spent / invested) * 100).toFixed(1));
};

export const getPenaltiesPercentage = (stats?: { amountInPenalties?: number; amountInvested?: number }): number => {
  const penalties = stats?.amountInPenalties ?? 0;
  const invested = stats?.amountInvested ?? 0;
  if (invested === 0) return 0;
  return Number(((penalties / invested) * 100).toFixed(1));
};

// New utility functions for better project display

export const getProjectStatus = (details?: { startDate?: number; expiryDate?: number }): 'upcoming' | 'active' | 'completed' => {
  if (!details) return 'active';
  
  const now = Math.floor(Date.now() / 1000);
  
  if (details.startDate && now < details.startDate) {
    return 'upcoming';
  }
  
  if (details.expiryDate && now > details.expiryDate) {
    return 'completed';
  }
  
  return 'active';
};

export const getRemainingTime = (timestamp?: number): string => {
  if (!timestamp) return 'N/A';
  
  const now = Math.floor(Date.now() / 1000);
  if (now >= timestamp) return 'Expired';
  
  const secondsRemaining = timestamp - now;
  const days = Math.floor(secondsRemaining / 86400);
  const hours = Math.floor((secondsRemaining % 86400) / 3600);
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}`;
  }
  
  return `${hours} hour${hours > 1 ? 's' : ''}`;
};

export const getProgressColor = (percentage: number): string => {
  if (percentage >= 100) return 'bg-green-500';
  if (percentage >= 75) return 'bg-emerald-500';
  if (percentage >= 50) return 'bg-blue-500';
  if (percentage >= 25) return 'bg-amber-500';
  return 'bg-red-500';
};
