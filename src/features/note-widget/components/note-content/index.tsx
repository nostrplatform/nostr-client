import { EventPointer, NDKEvent, NDKUser } from '@nostr-dev-kit/ndk';
import { useRealtimeProfile } from 'nostr-hooks';
import { neventEncode } from 'nostr-tools/nip19';
import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkBreaks from 'remark-breaks';
import 'github-markdown-css/github-markdown.css';
import 'highlight.js/styles/github-dark.css';
import './index.css';

import { ellipsis } from '@/shared/utils';

import { NoteByNoteId } from '@/features/note-widget';

import { useNoteContent } from './hooks';
import { MarkdownRenderers } from './renderers';

interface NoteContentProps {
  content?: string | null;
  event?: NDKEvent;
}

export const NoteContent: React.FC<NoteContentProps> = ({ content }) => {
  if (!content) return null;

  // Split the content by newlines and map to appropriate elements
  const paragraphs = content.split('\n').filter(Boolean);

  return (
    <div className="whitespace-pre-wrap break-words">
      {paragraphs.length > 0 ? (
        paragraphs.map((paragraph, index) => (
          <div key={`paragraph-${index}`} className="mb-2">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkBreaks]}
              rehypePlugins={[rehypeRaw, rehypeSanitize]}
              components={{
                // Define custom components for markdown rendering if needed
                a: ({ node, ...props }) => (
                  <a 
                    {...props} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-500 hover:underline"
                  />
                ),
                // Add more custom components as needed
              }}
            >
              {paragraph}
            </ReactMarkdown>
          </div>
        ))
      ) : (
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          rehypePlugins={[rehypeRaw, rehypeSanitize]}
        >
          {content}
        </ReactMarkdown>
      )}
    </div>
  );
};

const ProfileMention = memo(
  ({ pubkey }: { pubkey: string }) => {
    const npub = useMemo(() => {
      return new NDKUser({ pubkey }).npub;
    }, [pubkey]);

    const { profile } = useRealtimeProfile(pubkey);

    return (
      <>
        <Link to={`/profile/${npub}`} className="text-purple-700 hover:underline">
          @{profile?.name || ellipsis(npub || '', 10)}
        </Link>
      </>
    );
  },
  (prev, next) => prev.pubkey === next.pubkey,
);
