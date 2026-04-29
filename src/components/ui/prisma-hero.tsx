import { motion, useInView } from "motion/react";
import { ArrowRight, Globe } from "lucide-react";
import { useRef, useState } from "react";
import { useAppStore } from "../../store";
import { Changelog1 } from "./changelog-1";

/* ---------------- WordsPullUp ---------------- */
interface WordsPullUpProps {
  text: string;
  className?: string;
  showAsterisk?: boolean;
  style?: React.CSSProperties;
}

export const WordsPullUp = ({ text, className = "", showAsterisk = false, style }: WordsPullUpProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const words = text.split(" ");

  return (
    <div ref={ref} className={`inline-flex flex-wrap ${className}`} style={style}>
      {words.map((word, i) => {
        const isLast = i === words.length - 1;
        return (
          <motion.span
            key={i}
            initial={{ y: 20, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block relative"
            style={{ marginRight: isLast ? 0 : "0.25em" }}
          >
            {word}
            {showAsterisk && isLast && (
              <span className="absolute top-[0.65em] -right-[0.3em] text-[0.31em]">*</span>
            )}
          </motion.span>
        );
      })}
    </div>
  );
};

/* ---------------- WordsPullUpMultiStyle ---------------- */
interface Segment {
  text: string;
  className?: string;
}

interface WordsPullUpMultiStyleProps {
  segments: Segment[];
  className?: string;
  style?: React.CSSProperties;
}

export const WordsPullUpMultiStyle = ({ segments, className = "", style }: WordsPullUpMultiStyleProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  const words: { word: string; className?: string }[] = [];
  segments.forEach((seg) => {
    seg.text.split(" ").forEach((w) => {
      if (w) words.push({ word: w, className: seg.className });
    });
  });

  return (
    <div ref={ref} className={`inline-flex flex-wrap justify-center ${className}`} style={style}>
      {words.map((w, i) => (
        <motion.span
          key={i}
          initial={{ y: 20, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          className={`inline-block ${w.className ?? ""}`}
          style={{ marginRight: "0.25em" }}
        >
          {w.word}
        </motion.span>
      ))}
    </div>
  );
};

/* ---------------- Hero ---------------- */
const navItems = [
  { label: { en: "Manifesto", fr: "Manifeste" }, id: "manifesto" },
  { label: { en: "Guide", fr: "Comment utiliser" }, id: "guide" },
  { label: { en: "Updates", fr: "Mises à jour" }, id: "updates" },
];

interface PrismaHeroProps {
  onLoginClick?: () => void;
}

const PrismaHero = ({ onLoginClick }: PrismaHeroProps) => {
    const { setCurrentView, language, setLanguage, changelogEntries, activeLandingSection, setActiveLandingSection } = useAppStore();

    const formattedEntries = changelogEntries.map(entry => ({
      version: entry.category,
      date: new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
      title: entry.title,
      description: entry.description,
      items: [],
    }));

    const toggleLanguage = () => {
      setLanguage(language === 'en' ? 'fr' : 'en');
    };

    const strings = {
      heroTitle: "Content OS",
      heroDesc: language === 'en' 
        ? "The ultimate central nervous system for your content strategy. Automated ingestion from YouTube and Drive, intelligent clipping, and Claude-powered analytics designed specifically for you."
        : "Le système nerveux central ultime pour votre stratégie de contenu. Ingestion automatisée depuis YouTube et Drive, découpage intelligent et analyses propulsées par Claude conçues spécialement pour vous.",
      enterWorkspace: language === 'en' ? "Enter Workspace" : "Entrer dans l'espace de travail",
      login: language === 'en' ? "Log In" : "Connexion",
      signup: language === 'en' ? "Sign Up" : "S'inscrire",
      getStarted: language === 'en' ? "Get Started" : "Commencer",
      sections: {
        manifesto: {
          title: language === 'en' ? "Manifesto" : "Manifeste",
          desc: language === 'en' 
            ? "Content West is the operating system for the next generation of creators and high-performance teams." 
            : "Content West est le système d'exploitation pour la prochaine génération de créateurs et d'équipes performantes."
        },
        guide: {
          title: language === 'en' ? "How to use" : "Comment utiliser",
          desc: language === 'en' 
            ? "1. Connect your accounts securely. 2. Add your scripts to the database. 3. Our AI automatically creates clips and outlines over time. 4. Review, refine, and publish your content easily." 
            : "1. Connectez vos comptes Youtube & Drive. 2. Définissez vos scripts de contenu. 3. L'IA découpe et classe vos vidéos en continu. 4. Révisez et publiez facilement."
        },
        updates: {
          title: language === 'en' ? "Updates" : "Mises à jour",
          desc: language === 'en' 
            ? "Stay up-to-date with our latest feature releases, new integrations, and infrastructure improvements." 
            : "Restez informé de nos derniers lancements de fonctionnalités, nouvelles intégrations et améliorations de l'infrastructure."
        }
      }
    };

  return (
    <section className="h-screen w-full">
      <div className="relative h-full w-full overflow-hidden bg-black">
        
        {/* Background video (only visible on home) */}
        {activeLandingSection === 'home' && (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4"
          />
        )}

        {/* Noise overlay */}
        <div className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.7] mix-blend-overlay" />

        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/80" />

        {/* Navbar */}
        <nav className="absolute left-1/2 top-6 z-20 -translate-x-1/2 w-full max-w-fit">
          <div className="flex items-center justify-between gap-6 sm:gap-12 rounded-full bg-black/60 backdrop-blur-md border border-white/10 px-2 py-2">
            <div 
              className="flex items-center pl-2 cursor-pointer"
              onClick={() => setActiveLandingSection('home')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white opacity-90 transition-transform hover:scale-110">
                <circle cx="12" cy="6" r="2" fill="currentColor"/>
                <circle cx="12" cy="18" r="2" fill="currentColor"/>
                <circle cx="6" cy="12" r="2" fill="currentColor"/>
                <circle cx="18" cy="12" r="2" fill="currentColor"/>
              </svg>
            </div>
            
            <div className="hidden sm:flex items-center gap-6">
              {navItems.map(item => (
                <button 
                  key={item.id}
                  onClick={(e) => { e.preventDefault(); setActiveLandingSection(item.id); }}
                  className={`text-sm font-medium transition-colors ${activeLandingSection === item.id ? 'text-white' : 'text-[#E1E0CC]/80 hover:text-[#E1E0CC]'}`}
                >
                  {language === 'en' ? item.label.en : item.label.fr}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pr-1">
              <button 
                onClick={toggleLanguage}
                className="text-white/80 hover:text-white px-2 py-2 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center mr-1"
                title={language === 'en' ? "Passer en Français" : "Switch to English"}
              >
                <Globe size={18} />
              </button>
              {onLoginClick && (
                <button 
                  onClick={(e) => {
                     e.preventDefault(); 
                     onLoginClick(); 
                  }}
                  className="text-white/80 hover:text-white text-sm font-medium transition-colors px-4 py-2 border border-transparent rounded-full hover:bg-white/5"
                >
                  {strings.login}
                </button>
              )}
              <button 
                onClick={(e) => {
                   e.preventDefault(); 
                   if (onLoginClick) onLoginClick(); 
                   else setCurrentView('overview');
                }}
                className="bg-white/90 text-black text-sm font-semibold rounded-full px-5 py-2 hover:bg-white transition-colors shadow-[0_0_0_4px_rgba(255,255,255,0.15)] ml-1"
              >
                {!onLoginClick ? strings.enterWorkspace : strings.signup}
              </button>
            </div>
          </div>
        </nav>

        {/* Dynamic Content */}
        {activeLandingSection === 'home' ? (
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-2 sm:px-6 md:px-10">
            <div className="grid grid-cols-12 items-end gap-4">
              
              <div className="col-span-12 lg:col-span-8">
                <h1
                  className="font-medium leading-[0.85] tracking-[-0.07em] text-[20vw] sm:text-[18vw] md:text-[16vw] lg:text-[14vw] xl:text-[12vw] 2xl:text-[14vw]"
                  style={{ color: "#E1E0CC" }}
                >
                  <WordsPullUp text={strings.heroTitle} showAsterisk />
                </h1>
              </div>

              <div className="col-span-12 flex flex-col gap-5 pb-6 lg:col-span-4 lg:pb-10">
                
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="text-xs text-white/70 sm:text-sm md:text-base"
                  style={{ lineHeight: 1.2 }}
                >
                  {strings.heroDesc}
                </motion.p>

                <motion.button
                  onClick={() => {
                     if (onLoginClick) onLoginClick(); 
                     else setCurrentView('overview');
                  }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="group inline-flex items-center gap-2 self-start rounded-full bg-white py-1 pl-5 pr-1 text-sm font-medium text-black transition-all hover:gap-3 sm:text-base border border-transparent"
              >
                {strings.enterWorkspace}
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black transition-transform group-hover:scale-110 sm:h-10 sm:w-10">
                  <ArrowRight className="h-4 w-4" style={{ color: "#E1E0CC" }} />
                </span>
              </motion.button>

            </div>
          </div>
        </div>
        ) : activeLandingSection === 'updates' ? (
          <div className="absolute inset-0 pt-24 pb-8 overflow-y-auto z-10 w-full dark">
             <div className="max-w-4xl mx-auto px-4">
                 <Changelog1 
                    title={strings.sections.updates.title} 
                    description={strings.sections.updates.desc}
                    entries={formattedEntries.length > 0 ? formattedEntries : undefined}
                 />
             </div>
          </div>
        ) : activeLandingSection === 'manifesto' ? (
          <div className="absolute inset-0 pt-24 pb-8 overflow-y-auto z-10 w-full dark flex flex-col items-center">
            <div className="max-w-4xl px-6 w-full flex flex-col items-center pb-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-12"
              >
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight mb-6" style={{ color: "#E1E0CC" }}>
                  {strings.sections.manifesto.title}
                </h2>
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl mb-12 border border-white/10">
                   <div className="absolute inset-0 bg-black/20 z-10"></div>
                   <video 
                     className="w-full h-full object-cover" 
                     autoPlay 
                     loop 
                     muted 
                     playsInline
                     src="https://videos.pexels.com/video-files/3129595/3129595-uhd_2560_1440_30fps.mp4"
                   ></video>
                </div>
                <div className="text-left space-y-6 text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
                  <p>
                    {language === 'en' ? "Content creation is broken. Creators spend 80% of their time managing files, coordinating with editors, and figuring out what to post next, instead of actually creating. Content West was built at the intersection of these pain points." : "La création de contenu est brisée. Les créateurs passent 80% de leur temps à gérer des fichiers, à coordonner avec des monteurs et à déterminer quoi publier ensuite, au lieu de créer réellement. Content West est né à l'intersection de ces points de douleur."}
                  </p>
                  <p>
                    {language === 'en' ? "We believe in a world where ideas flow freely from conception to publication. Where our Content Operating System doesn't replace the creator, but empowers them by removing the heavy lifting of post-production." : "Nous croyons en un monde où les idées circulent librement de la conception à la publication. Où notre système d'exploitation de contenu ne remplace pas le créateur, mais le responsabilise en supprimant les tâches lourdes de la post-production."}
                  </p>
                  <p className="text-white font-medium text-xl mt-8">
                    {language === 'en' ? "Welcome to Content West. The ultimate Content Operating System." : "Bienvenue chez Content West. Le système d'exploitation de contenu ultime."}
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        ) : activeLandingSection === 'guide' ? (
          <div className="absolute inset-0 pt-24 pb-8 overflow-y-auto z-10 w-full dark flex flex-col items-center">
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.5 }}
               className="max-w-2xl px-6 w-full"
             >
               <h2 className="text-3xl sm:text-5xl font-medium tracking-tight mb-8 text-center text-[#E1E0CC]">
                 {strings.sections.guide.title}
               </h2>
               <div className="space-y-8 text-left">
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-white font-bold">1</div>
                    <div>
                      <h3 className="text-xl text-white font-medium mb-1">{language === 'en' ? 'Connect Integrations' : 'Connecter les intégrations'}</h3>
                      <p className="text-white/70">{language === 'en' ? 'Navigate to the Settings tab to authenticate with Google Drive or YouTube to start importing footage automatically.' : 'Allez dans les Paramètres pour authentifier Google Drive, Metricool ou YouTube afin d\'importer vos vidéos et données.'}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-white font-bold">2</div>
                    <div>
                      <h3 className="text-xl text-white font-medium mb-1">{language === 'en' ? 'Define Scripts' : 'Définir des scripts'}</h3>
                      <p className="text-white/70">{language === 'en' ? 'Use the Scripts tab to create custom editorial patterns so our AI knows exactly what segments you want.' : 'Utilisez l\'onglet Scripts pour créer des modèles d\'édition afin que l\'agent d\'IA sache exactement quelles parties vous souhaitez découper.'}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-white font-bold">3</div>
                    <div>
                      <h3 className="text-xl text-white font-medium mb-1">{language === 'en' ? 'Centralize Workflow' : 'Centraliser le flux de travail'}</h3>
                      <p className="text-white/70">{language === 'en' ? 'Keep track of all your ongoing videos in the Workflow Kanban view. Move cards as editing progresses.' : 'Suivez l\'avancement de vos vidéos dans la vue Kanban du Flux de travail. Déplacez vos cartes au fil du montage.'}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-white font-bold">4</div>
                    <div>
                      <h3 className="text-xl text-white font-medium mb-1">{language === 'en' ? 'Review & Publish' : 'Vérifier & Publier'}</h3>
                      <p className="text-white/70">{language === 'en' ? 'Check the Clip Review section to approve short-form clips automatically generated by the AI agent and store them in the Database.' : 'Vérifiez la Révision pour approuver les extraits courts générés par l\'IA puis validez-les pour la base de données de publication.'}</p>
                    </div>
                  </div>
               </div>
               <div className="mt-12 flex justify-center">
                 <button 
                   onClick={() => {
                      if (onLoginClick) onLoginClick(); 
                      else setCurrentView('overview');
                   }}
                   className="bg-white text-black text-sm font-bold rounded-full px-8 py-3 hover:bg-white/90 transition-colors shadow-lg shadow-white/10"
                 >
                   {strings.getStarted}
                 </button>
               </div>
             </motion.div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center pt-24 px-4 overflow-y-auto z-10 text-center">
            <motion.div
              key={activeLandingSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl text-center"
            >
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight mb-6" style={{ color: "#E1E0CC" }}>
                {activeLandingSection === 'manifesto' ? strings.sections.manifesto.title : 
                 activeLandingSection === 'guide' ? strings.sections.guide.title : 
                 activeLandingSection === 'updates' ? strings.sections.updates.title : ''}
              </h2>
              <p className="text-white/70 text-lg sm:text-xl max-w-xl mx-auto mb-10">
                {activeLandingSection === 'manifesto' && strings.sections.manifesto.desc}
                {activeLandingSection === 'guide' && strings.sections.guide.desc}
                {activeLandingSection === 'updates' && strings.sections.updates.desc}
              </p>
              <button 
                onClick={() => {
                   if (onLoginClick) onLoginClick(); 
                   else setCurrentView('overview');
                }}
                className="bg-white text-black text-sm font-bold rounded-full px-8 py-3 hover:bg-white/90 transition-colors shadow-lg shadow-white/10"
              >
                {strings.getStarted}
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </section>
  );
};

export { PrismaHero }
