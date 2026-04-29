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
             <TestimonialsSectionV2 />
           </div>
        )}
      </div>
      <CinematicFooter />
    </div>
  );
}
