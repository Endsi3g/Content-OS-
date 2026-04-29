import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from '@phosphor-icons/react';
import { useAppStore } from '../store';

interface OnboardingTooltipProps {
  id: string;
  title: string;
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export function OnboardingTooltip({ id, title, content, children, position = 'bottom', delay = 1000 }: OnboardingTooltipProps) {
  const { dismissedTooltips, dismissTooltip } = useAppStore();
  const [isVisible, setIsVisible] = useState(false);
  const isDismissed = dismissedTooltips.includes(id);

  useEffect(() => {
    if (!isDismissed) {
      const timer = setTimeout(() => setIsVisible(true), delay);
      return () => clearTimeout(timer);
    }
  }, [isDismissed, delay]);

  if (isDismissed) {
    return <>{children}</>;
  }

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-3',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-3',
    left: 'right-full top-1/2 -translate-y-1/2 mr-3',
    right: 'left-full top-1/2 -translate-y-1/2 ml-3',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-[var(--surface)] border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[var(--surface)] border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-[var(--surface)] border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-[var(--surface)] border-t-transparent border-b-transparent border-l-transparent',
  };

  return (
    <div className="relative w-full">
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: position === 'top' ? 5 : position === 'bottom' ? -5 : 0, x: position === 'left' ? 5 : position === 'right' ? -5 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`absolute z-50 w-64 p-4 bg-[var(--surface)] border border-[var(--border)] shadow-xl rounded-xl ${positionClasses[position]}`}
          >
            <div className={`absolute w-0 h-0 border-[6px] ${arrowClasses[position]}`} />
            
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-serif font-medium text-[var(--text-main)] text-sm">{title}</h4>
              <button 
                onClick={() => {
                  setIsVisible(false);
                  dismissTooltip(id);
                }}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors p-1 -mr-1 -mt-1 rounded-md hover:bg-[var(--hover-bg)]"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-3">
              {content}
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setIsVisible(false);
                  dismissTooltip(id);
                }}
                className="text-xs font-medium px-3 py-1.5 bg-[var(--accent-pastel)] hover:bg-[var(--accent-pastel-hover)] text-[var(--text-main)] rounded-md transition-colors"
              >
                Got it
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
