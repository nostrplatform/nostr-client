import { useEffect, useRef, ReactNode } from 'react';
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';
import { useTheme } from '../theme-provider';

interface FloatingEmojiPickerProps {
  onEmojiClick: (emoji: EmojiClickData) => void;
  isOpen: boolean;
  onClose: () => void;
  variant?: 'compact' | 'full';
  position?: 'top' | 'bottom';
  children: ReactNode;
}

export function FloatingEmojiPicker({ 
  onEmojiClick, 
  isOpen, 
  onClose,
  variant = 'compact',
  children 
}: FloatingEmojiPickerProps) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <div ref={containerRef} className="relative">
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="fixed inset-0 bg-black/40" onClick={onClose} />
          <div 
            className="relative z-50 w-full sm:w-[350px] bg-background rounded-t-xl sm:rounded-xl shadow-lg overflow-hidden"
          >
            <EmojiPicker 
              onEmojiClick={onEmojiClick}
              theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
              width="100%"
              height={300}
              lazyLoadEmojis
              searchDisabled={variant === 'compact'}
              previewConfig={{ showPreview: false }}
              skinTonesDisabled
            />
          </div>
        </div>
      )}
    </div>
  );
}
