import React from "react";
import { PrismaHero } from "../components/ui/prisma-hero";
import { TestimonialsSectionV2 } from "../components/ui/testimonial-v2";
import { Features } from "../components/ui/features-10";
import { CinematicFooter } from "../components/ui/motion-footer";
import { ArrowLeft, LogIn } from "lucide-react";
import { useAppStore } from "../store";

interface LandingPageProps {
  onLoginClick?: () => void;
  isPublic?: boolean;
}

export function LandingPage({ onLoginClick, isPublic }: LandingPageProps) {
  const { setCurrentView, activeLandingSection } = useAppStore();

  return (
    <div className="min-h-screen bg-[#111] text-white w-full overflow-x-hidden m-0 p-0 font-sans selection:bg-white/20 flex flex-col">
      <div className="flex-1">
        <PrismaHero onLoginClick={onLoginClick} />
        {activeLandingSection === 'home' && (
           <div style={{ background: 'linear-gradient(to bottom, #000 0%, #111 250px)' }}>
             <div className="pt-24 pb-12">
               <Features />
             </div>
             
             {/* Step-by-step product demo section */}
             <section className="py-24 border-y border-white/5 bg-black/20">
               <div className="max-w-5xl mx-auto px-6">
                 <h2 className="text-3xl md:text-5xl font-bold text-center mb-16 text-[#E1E0CC]">
                   How it works
                 </h2>
                 <div className="grid md:grid-cols-3 gap-12">
                   <div className="flex flex-col items-center text-center">
                     <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                       <span className="text-2xl font-bold">01</span>
                     </div>
                     <h3 className="text-xl font-semibold mb-4">Ingest</h3>
                     <p className="text-white/50">Auto-sync your raw footage from YouTube, Drive or Fathom. No more manual uploads.</p>
                   </div>
                   <div className="flex flex-col items-center text-center">
                     <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                       <span className="text-2xl font-bold">02</span>
                     </div>
                     <h3 className="text-xl font-semibold mb-4">Clip</h3>
                     <p className="text-white/50">Our AI identifies viral segments and hooks, generating scripts and ready-to-use clips.</p>
                   </div>
                   <div className="flex flex-col items-center text-center">
                     <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                       <span className="text-2xl font-bold">03</span>
                     </div>
                     <h3 className="text-xl font-semibold mb-4">Analyze</h3>
                     <p className="text-white/50">Claude analyzes performance data to tell you what works and what to post next.</p>
                   </div>
                 </div>
               </div>
             </section>

             <TestimonialsSectionV2 />
           </div>
        )}
      </div>
      <CinematicFooter />
    </div>
  );
}
