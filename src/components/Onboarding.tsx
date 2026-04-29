import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Sparkle } from '@phosphor-icons/react';
import { useAppStore } from '../store';
import { t } from '../i18n';

export function Onboarding() {
  const { setHasCompletedOnboarding, language } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[var(--bg)] flex items-center justify-center p-4 overflow-hidden selection:bg-purple-200 selection:text-purple-900">
      
      {/* Subtle Constant Background Animations */}
      <div className="absolute inset-0 z-0 overflow-hidden flex items-center justify-center pointer-events-none opacity-40 dark:opacity-20 mix-blend-multiply dark:mix-blend-screen">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute w-[600px] h-[600px] bg-purple-200/50 dark:bg-purple-800/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, -90, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute w-[800px] h-[500px] bg-orange-100/50 dark:bg-orange-900/10 rounded-full blur-[120px] translate-x-1/4 translate-y-1/4"
        />
      </div>

      <div className="relative z-10 max-w-2xl w-full flex flex-col items-center text-center">
        {/* Logo/Icon */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-16 h-16 bg-[var(--text-main)] text-[var(--bg)] rounded-2xl flex items-center justify-center mb-8 shadow-sm"
        >
          <span className="font-serif font-bold text-3xl">C</span>
        </motion.div>

        {/* Main Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="font-serif text-5xl md:text-6xl text-[var(--text-main)] font-semibold tracking-tight mb-6 leading-[1.1]">
            {language === 'fr' 
              ? 'Pensez, créez, analysez.' 
              : 'Think, create, analyze.'}
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-lg md:text-xl text-[var(--text-muted)] max-w-lg mb-12 font-sans font-light leading-relaxed">
            {language === 'fr'
              ? 'L\'espace de travail tout-en-un pour organiser votre contenu, optimisé par l\'intelligence artificielle.'
              : 'The all-in-one workspace to organize your content, powered by artificial intelligence.'}
          </p>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <button
            onClick={() => setHasCompletedOnboarding(true)}
            className="group relative flex items-center gap-3 bg-[var(--text-main)] text-[var(--bg)] px-8 py-4 rounded-xl text-base font-medium overflow-hidden transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
            <span className="relative z-10 flex items-center gap-3">
              {language === 'fr' ? 'Ouvrir mon espace' : 'Open Workspace'} 
              <ArrowRight size={18} weight="bold" className="group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </motion.div>

        {/* Small subtle text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-16 text-xs text-[var(--text-muted)] font-mono flex items-center gap-1.5 opacity-60"
        >
          <Sparkle size={12} weight="fill" />
          Content OS Pro Preview
        </motion.div>
      </div>
    </div>
  );
}
