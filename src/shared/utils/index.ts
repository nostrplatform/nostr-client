import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { nip19 } from 'nostr-tools';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function ellipsis(text: string, length: number) {
  if (text.length <= length) {
    return text;
  }

  return text.slice(0, length) + '...';
}

/**
 * Converts an npub string (NIP-19) to its hexadecimal representation.
 * @param npub The npub string to convert.
 * @returns The hexadecimal representation of the public key.
 * @throws Error if the input is not a valid npub string.
 */
export function npubToHex(npub: string): string {
  try {
    const decoded = nip19.decode(npub);
    if (decoded.type === 'npub') {
      return decoded.data;
    } else {
      throw new Error('Provided string is not a valid npub.');
    }
  } catch (error: any) {
    throw new Error(`Failed to decode npub: ${error.message}`);
  }
}
