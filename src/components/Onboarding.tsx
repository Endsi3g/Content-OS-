import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, X, Sparkle } from '@phosphor-icons/react';
import { useAppStore } from '../store';
import { t } from '../i18n';

export function Onboarding() {
  const { setHasCompletedOnboarding, language } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mx-3 mb-2 rounded-lg bg-gradient-to-br from-[var(--hover-bg)] to-[var(--surface)] border border-[var(--border)] overflow-hidden"
      >
        <div className="p-4">
          {/* Header with dismiss */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkle size={14} weight="fill" className="text-[var(--accent)]" />
              <span className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-muted)]">
                Getting Started
              </span>
            </div>
            <button
              onClick={() => {
                setDismissed(true);
                setHasCompletedOnboarding(true);
              }}
              className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors p-0.5"
            >
              <X size={14} />
            </button>
          </div>

          {/* Content */}
          <h3 className="font-serif text-base font-semibold text-[var(--text-main)] mb-1.5 leading-snug">
            {language === 'fr' ? 'Bienvenue sur Content OS' : 'Welcome to Content OS'}
          </h3>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-3">
            {language === 'fr'
              ? 'Organisez votre contenu video avec l\'IA.'
              : 'Organize your video content with AI.'}
          </p>

          {/* CTA */}
          <button
            onClick={() => setHasCompletedOnboarding(true)}
            className="group w-full flex items-center justify-center gap-2 bg-[var(--text-main)] text-[var(--bg)] px-3 py-2 rounded-md text-xs font-medium transition-all hover:opacity-90 active:scale-[0.98]"
          >
            {language === 'fr' ? 'Commencer' : 'Get Started'}
            <ArrowRight size={14} weight="bold" className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

