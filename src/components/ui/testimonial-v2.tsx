import React, { useState, useEffect } from 'react';
import { motion } from "motion/react";
import { useAppStore } from '../../store';

// --- Types ---
interface Testimonial {
  text: string;
  image: string;
  name: string;
  role: string;
}

// --- Data ---
const testimonialsData: Record<string, Testimonial[]> = {
  en: [
    {
      text: "Content West has completely removed the 'production tax' from my workflow. I focus on the script, and the OS handles the rest of the orchestration.",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150",
      name: "Alex Rivera",
      role: "Full-time Creator",
    },
    {
      text: "The AI agent's ability to pull scripts directly from my raw footage patterns is magic. We've cut our editing turnaround time by 60%.",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150",
      name: "Marcus Chen",
      role: "Lead Editor @ MediaFlow",
    },
    {
      text: "Finally, a database that understands video as data. Reviewing clips and managing cross-platform distribution is now a single-click process.",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150",
      name: "Sarah Jenkins",
      role: "Creative Director",
    },
    {
      text: "The integration between the Script lab and the Clip review is seamless. It's the first tool that actually maps to how creators think.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
      name: "David Vane",
      role: "Tech YouTuber",
    },
    {
      text: "We used to lose files in Drive and lose track in Slack. Content West is our single source of truth for every piece of content we produce.",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150",
      name: "Elena Rodriguez",
      role: "Social Media Manager",
    },
    {
      text: "The smooth Kanban workflow for video editing is something I didn't know I needed until I used it. It's transformed our team communication.",
      image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150&h=150",
      name: "Jameson K.",
      role: "Agency Founder",
    },
    {
      text: "Metricool integration coupled with the Content Database gives us insights we never had before. We post smarter, not harder.",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150",
      name: "Farhan Sidd",
      role: "Data Lead @ ContentWest",
    },
    {
      text: "Our entire post-production pipeline is now automated. The AI doesn't just cut; it understands the editorial intent behind the footage.",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150",
      name: "Sana Sheikh",
      role: "Post-Production Supervisor",
    },
    {
      text: "From raw import to final approved social clips in minutes. This is the operating system for the next generation of media companies.",
      image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150&h=150",
      name: "Hassan Ali",
      role: "E-commerce Strategist",
    },
  ],
  fr: [
    {
      text: "Content West a complètement éliminé la 'taxe de production' de mon flux de travail. Je me concentre sur le script, et l'OS gère le reste de l'orchestration.",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150",
      name: "Alex Rivera",
      role: "Créateur à temps plein",
    },
    {
      text: "La capacité de l'agent d'IA à extraire des scripts directement à partir de mes séquences brutes est magique. Nous avons réduit notre temps de montage de 60 %.",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150",
      name: "Marcus Chen",
      role: "Monteur principal @ MediaFlow",
    },
    {
      text: "Enfin une base de données qui comprend la vidéo en tant que donnée. Examiner des extraits et gérer la distribution multiplateforme se fait désormais en un clic.",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150",
      name: "Sarah Jenkins",
      role: "Directrice créative",
    },
    {
      text: "L'intégration entre le laboratoire de scripts et la révision des extraits est transparente. C'est le premier outil qui correspond vraiment à la façon dont les créateurs pensent.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
      name: "David Vane",
      role: "YouTuber Tech",
    },
    {
      text: "Nous avions l'habitude de perdre des fichiers dans Drive et de perdre le fil sur Slack. Content West est notre unique source de vérité pour chaque élément de contenu que nous produisons.",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150",
      name: "Elena Rodriguez",
      role: "Social Media Manager",
    },
    {
      text: "Le flux Kanban fluide pour le montage vidéo est quelque chose dont je ne savais pas avoir besoin jusqu'à ce que je l'utilise. Cela a transformé la communication de notre équipe.",
      image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150&h=150",
      name: "Jameson K.",
      role: "Fondateur d'agence",
    },
    {
      text: "L'intégration de Metricool associée à la base de données de contenu nous donne des informations que nous n'avions jamais eues auparavant. Nous publions de manière plus intelligente, et pas plus dure.",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150",
      name: "Farhan Sidd",
      role: "Responsable des données @ ContentWest",
    },
    {
      text: "L'ensemble de notre pipeline de post-production est maintenant automatisé. L'IA ne se contente pas de couper ; elle comprend l'intention éditoriale derrière les séquences.",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150",
      name: "Sana Sheikh",
      role: "Superviseur de post-production",
    },
    {
      text: "De l'importation brute aux extraits sociaux finaux approuvés en quelques minutes. C'est le système d'exploitation pour la prochaine génération d'entreprises de médias.",
      image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150&h=150",
      name: "Hassan Ali",
      role: "Stratège E-commerce",
    },
  ]
};

// --- Sub-Components ---
const TestimonialsColumn = (props: {
  className?: string;
  testimonials: Testimonial[];
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.ul
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6 bg-transparent transition-colors duration-300 list-none m-0 p-0"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(({ text, image, name, role }, i) => (
                <motion.li 
                  key={`${index}-${i}`}
                  aria-hidden={index === 1 ? "true" : "false"}
                  tabIndex={index === 1 ? -1 : 0}
                  whileHover={{ 
                    scale: 1.03,
                    y: -8,
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.12), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.05)",
                    transition: { type: "spring", stiffness: 400, damping: 17 }
                  }}
                  whileFocus={{ 
                    scale: 1.03,
                    y: -8,
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.12), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.05)",
                    transition: { type: "spring", stiffness: 400, damping: 17 }
                  }}
                  className="p-10 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-lg shadow-black/5 max-w-xs w-full bg-[#111] dark:bg-neutral-900 transition-all duration-300 cursor-default select-none group focus:outline-none focus:ring-2 focus:ring-primary/30" 
                >
                  <blockquote className="m-0 p-0">
                    <p className="text-neutral-300 dark:text-neutral-400 leading-relaxed font-normal m-0 transition-colors duration-300 text-sm">
                      {text}
                    </p>
                    <footer className="flex items-center gap-3 mt-6">
                      <img
                        width={40}
                        height={40}
                        src={image}
                        alt={`Avatar of ${name}`}
                        className="h-10 w-10 rounded-full object-cover ring-2 ring-neutral-800 dark:ring-neutral-800 group-hover:ring-primary/30 transition-all duration-300 ease-in-out"
                      />
                      <div className="flex flex-col">
                        <cite className="font-semibold text-sm not-italic tracking-tight leading-5 text-white dark:text-white transition-colors duration-300">
                          {name}
                        </cite>
                        <span className="text-xs leading-5 tracking-tight text-neutral-400 dark:text-neutral-500 mt-0.5 transition-colors duration-300">
                          {role}
                        </span>
                      </div>
                    </footer>
                  </blockquote>
                </motion.li>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.ul>
    </div>
  );
};

export const TestimonialsSectionV2 = () => {
  const { language } = useAppStore();
  const currentTestimonials = testimonialsData[language] || testimonialsData.en;
  
  const firstColumn = currentTestimonials.slice(0, 3);
  const secondColumn = currentTestimonials.slice(3, 6);
  const thirdColumn = currentTestimonials.slice(6, 9);

  return (
    <section 
      aria-labelledby="testimonials-heading"
      className="bg-transparent py-24 relative overflow-hidden"
    >
      <motion.div 
        initial={{ opacity: 0, y: 50, rotate: -2 }}
        whileInView={{ opacity: 1, y: 0, rotate: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ 
          duration: 1.2, 
          ease: [0.16, 1, 0.3, 1],
          opacity: { duration: 0.8 }
        }}
        className="container px-4 z-10 mx-auto"
      >
        <div className="flex flex-col items-center justify-center max-w-[540px] mx-auto mb-16">
          <div className="flex justify-center">
            <div className="border border-white/10 py-1 px-4 rounded-full text-xs font-semibold tracking-wide uppercase text-[#E1E0CC]/70 bg-white/5 transition-colors">
              {language === 'en' ? 'Testimonials' : 'Témoignages'}
            </div>
          </div>

          <h2 id="testimonials-heading" className="text-4xl md:text-5xl font-extrabold tracking-tight mt-6 text-center text-[#E1E0CC] transition-colors">
            {language === 'en' ? 'What our users say' : 'Ce que disent nos créateurs'}
          </h2>
          <p className="text-center mt-5 text-white/50 text-lg leading-relaxed max-w-sm transition-colors">
            {language === 'en' ? 'Discover how thousands of creators streamline their operations with Content West.' : 'Découvrez comment des milliers de créateurs optimisent leurs opérations avec Content West.'}
          </p>
        </div>

        <div 
          className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)] max-h-[740px] overflow-hidden"
          role="region"
          aria-label="Scrolling Testimonials"
        >
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
        </div>
      </motion.div>
    </section>
  );
};
