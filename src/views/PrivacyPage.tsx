import React from 'react';
import { useAppStore } from '../store';
import { CaretLeft } from '@phosphor-icons/react';

export function PrivacyPage() {
  const { setCurrentView } = useAppStore();

  return (
    <div className="min-h-screen bg-[#000] text-[#E1E0CC] p-8 md:p-16 font-sans">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => setCurrentView('landing')}
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-12 group"
        >
          <CaretLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </button>

        <h1 className="text-5xl md:text-7xl font-bold mb-12 tracking-tight">Privacy Policy</h1>
        
        <div className="space-y-12 text-lg text-white/70 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Data Collection</h2>
            <p>
              Content OS is designed to be a private-first operating system for creators. We collect minimal telemetry to ensure application stability and performance. Your raw video footage and edited clips remain your property.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Local Processing</h2>
            <p>
              Wherever possible, processing (including video rendering via FFmpeg) happens locally on your device. We do not upload your raw footage to our servers unless explicitly required by a cloud-based AI feature you've enabled.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. AI Service Providers</h2>
            <p>
              When using AI-powered features like automated clipping or analytics, data may be processed by third-party providers such as Anthropic (Claude). This data is anonymized wherever possible and is subject to the respective provider's privacy policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Your Rights</h2>
            <p>
              You have the right to access, export, and delete your data at any time. Content OS provides tools within the workspace settings to manage your data footprint.
            </p>
          </section>

          <div className="pt-12 border-t border-white/10 text-sm text-white/30">
            Last updated: April 30, 2026
          </div>
        </div>
      </div>
    </div>
  );
}
