import React from 'react';
import { useAppStore } from '../store';
import { CaretLeft } from '@phosphor-icons/react';

export function TermsPage() {
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

        <h1 className="text-5xl md:text-7xl font-bold mb-12 tracking-tight">Terms of Service</h1>
        
        <div className="space-y-12 text-lg text-white/70 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p>
              By downloading and using Content OS, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. License</h2>
            <p>
              We grant you a non-exclusive, non-transferable license to use Content OS for your personal or commercial content creation activities. You may not reverse engineer or attempt to extract the source code of the application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Content Ownership</h2>
            <p>
              You retain full ownership of all content processed through Content OS. We claim no intellectual property rights over the files, scripts, or data you import or generate.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Limitation of Liability</h2>
            <p>
              Content OS is provided "as is" without warranty of any kind. We are not liable for any loss of data or business interruption resulting from the use of the application.
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
