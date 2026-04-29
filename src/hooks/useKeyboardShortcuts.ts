import { useEffect } from 'react';

export function useKeyboardShortcuts(onNavigate: (view: any) => void, onOpenAddModal: () => void) {
  useEffect(() => {
    let sequence = '';
    let timeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'n') {
        onOpenAddModal();
        return;
      }

      sequence += e.key;
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        sequence = '';
      }, 1000);

      if (sequence === 'go') { onNavigate('overview'); sequence = ''; }
      else if (sequence === 'gi') { onNavigate('inbox'); sequence = ''; }
      else if (sequence === 'gd') { onNavigate('database'); sequence = ''; }
      else if (sequence === 'gw') { onNavigate('workflow'); sequence = ''; }
      else if (sequence === 'gr') { onNavigate('review'); sequence = ''; }
      else if (sequence === 'ga') { onNavigate('aiCoach'); sequence = ''; }
      else if (sequence === 'gk') { onNavigate('knowledge'); sequence = ''; }
      else if (sequence === 'gs') { onNavigate('settings'); sequence = ''; }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeout);
    };
  }, [onNavigate, onOpenAddModal]);
}
