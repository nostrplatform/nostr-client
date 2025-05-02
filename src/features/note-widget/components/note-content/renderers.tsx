import hljs from 'highlight.js';
import { Components } from 'react-markdown';
import { AnchorHTMLAttributes, HTMLAttributes } from 'react';

export const MarkdownRenderers: Partial<Components> = {
  h1: ({ children, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
    <h1 {...props} className="text-2xl font-bold mt-6 mb-4">{children}</h1>
  ),
  
  h2: ({ children, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
    <h2 {...props} className="text-xl font-bold mt-5 mb-3">{children}</h2>
  ),
  
  h3: ({ children, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
    <h3 {...props} className="text-lg font-bold mt-4 mb-2">{children}</h3>
  ),

  a: ({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a 
      {...props}
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-blue-600 dark:text-blue-400 hover:underline"
    >
      {children}
    </a>
  ),

  code: ({ inline, className, children, ...props }: HTMLAttributes<HTMLElement> & { inline?: boolean, className?: string }) => {
    if (inline) {
      return (
        <code {...props} className="bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5 text-sm">
          {children}
        </code>
      );
    }

    const language = className?.replace('language-', '');
    const code = children?.toString() || '';
    
    const highlighted = language ? 
      hljs.highlight(code, { language }).value :
      code;

    return (
      <pre className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 my-4 overflow-x-auto">
        <code 
          {...props}
          className={`${language} text-sm`}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </pre>
    );
  },

  
  blockquote: ({ children, ...props }: HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote {...props} className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-4 italic">
      {children}
    </blockquote>
  ),

  
  ul: ({ children, ...props }: HTMLAttributes<HTMLUListElement>) => (
    <ul {...props} className="list-disc list-inside my-4 space-y-2">
      {children}
    </ul>
  ),
  
  ol: ({ children, ...props }: HTMLAttributes<HTMLOListElement>) => (
    <ol {...props} className="list-decimal list-inside my-4 space-y-2">
      {children}
    </ol>
  ),

  
  table: ({ children, ...props }: HTMLAttributes<HTMLTableElement>) => (
    <div className="my-4 overflow-x-auto">
      <table {...props} className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
        {children}
      </table>
    </div>
  ),
  
  th: ({ children, ...props }: HTMLAttributes<HTMLTableCellElement>) => (
    <th {...props} className="px-4 py-2 bg-gray-100 dark:bg-gray-800 font-bold">
      {children}
    </th>
  ),
  
  td: ({ children, ...props }: HTMLAttributes<HTMLTableCellElement>) => (
    <td {...props} className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
      {children}
    </td>
  ),
};
