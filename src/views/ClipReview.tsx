import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clip } from '../types';
import { PlayCircle, Check, X, Scissors, ChatText, UploadSimple, GoogleDriveLogo, Sparkle, FileVideo, MagnifyingGlass } from '@phosphor-icons/react';
import { useAppStore } from '../store';
import { ScrollReveal } from '../components/ScrollReveal';
import { t } from '../i18n';

type Tab = 'pending' | 'reviewed' | 'long_video';

export function ClipReview() {
  const { clips, assets, updateClipStatus, updateClip, language } = useAppStore();
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  
  const pendingClips = clips.filter(c => c.status === 'pending');
  const reviewedClips = clips.filter(c => c.status === 'approved' || c.status === 'rejected');
  
  const rawDisplayClips = activeTab === 'pending' ? pendingClips : reviewedClips;
  
  const displayClips = useMemo(() => {
    if (!searchQuery.trim()) return rawDisplayClips;
    const lowerQuery = searchQuery.toLowerCase();
    return rawDisplayClips.filter(c => 
      c.title.toLowerCase().includes(lowerQuery) || 
      c.hook.toLowerCase().includes(lowerQuery) || 
      c.status.toLowerCase().includes(lowerQuery)
    );
  }, [rawDisplayClips, searchQuery]);

  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const selectedClip = useMemo(() => clips.find(c => c.id === selectedClipId) || null, [clips, selectedClipId]);
  const [comment, setComment] = useState('');

  // Update selected clip if tab changes and no query is active, 
  // or clear selection if the current item is filtered out.
  useEffect(() => {
    if (activeTab !== 'long_video') {
       if (displayClips.length > 0 && (!selectedClipId || !displayClips.find(c => c.id === selectedClipId))) {
         setSelectedClipId(displayClips[0].id);
       } else if (displayClips.length === 0) {
         setSelectedClipId(null);
       }
    }
  }, [displayClips, activeTab, selectedClipId]);

  useEffect(() => {
    setComment(selectedClip?.comments || '');
  }, [selectedClip]);
  
  const sourceAsset = selectedClip ? assets.find(a => a.id === selectedClip.assetId) : null;

  // Long Video State
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [aiReviewResult, setAiReviewResult] = useState<{title: string, description: string, hashtags: string, transcription: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleApprove = () => {
    if (selectedClip) {
      updateClip(selectedClip.id, { status: 'approved', comments: comment });
      setSelectedClipId(null);
    }
  };

  const handleReject = () => {
    if (selectedClip) {
      updateClip(selectedClip.id, { status: 'rejected', comments: comment });
      setSelectedClipId(null);
    }
  };

  const handleSaveComment = () => {
    if (selectedClip) {
      updateClip(selectedClip.id, { comments: comment });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (activeTab === 'pending' && selectedClip) {
        if (e.key === 'a') handleApprove();
        if (e.key === 'r') handleReject();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, selectedClip, handleApprove, handleReject]);

  const handleLongVideoUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    setAiReviewResult(null);

    const file = files[0];
    try {
      const { ref, uploadBytesResumable, getDownloadURL } = await import('firebase/storage');
      const { storage } = await import('../lib/firebase');
      const { api } = await import('../lib/api');

      const storageRef = ref(storage, `long-videos/${Date.now()}_${file.name}`);
      const task = uploadBytesResumable(storageRef, file);

      task.on('state_changed',
        (snap) => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
        (err) => {
          setIsUploading(false);
          setUploadProgress(0);
        },
        async () => {
          try {
            const videoUrl = await getDownloadURL(task.snapshot.ref);
            // Call Claude analysis endpoint
            const res = await api.post('/api/clips/analyze', {
              videoUrl,
              fileName: file.name,
            });
            setAiReviewResult({
              title: res.title || 'Untitled',
              description: res.description || '',
              hashtags: res.hashtags || '',
              transcription: res.transcription || '',
            });
          } catch (e) {
            // Fallback if AI analysis fails
            setAiReviewResult({
              title: `Analysis — ${file.name}`,
              description: 'AI analysis could not be completed. Please configure ANTHROPIC_API_KEY.',
              hashtags: '#Content #Video',
              transcription: 'Transcription not available.',
            });
          } finally {
            setIsUploading(false);
          }
        }
      );
    } catch (e) {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full gap-8">
      {/* Left Column: Navigation & List */}
      <div className="w-full md:w-1/3 flex flex-col h-full border-r border-[var(--border)] pr-0 md:pr-8">
        <ScrollReveal delay={0}>
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-main)] mb-1">{t('review.title', language)}</h1>
            <p className="text-sm text-[var(--text-muted)]">{t('review.description', language)}</p>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
            <button 
              onClick={() => { setActiveTab('pending'); setSearchQuery(''); }}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'pending' ? 'bg-white shadow-sm text-[var(--text-main)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
            >
              {t('review.pending', language)}
            </button>
            <button 
              onClick={() => { setActiveTab('reviewed'); setSearchQuery(''); }}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'reviewed' ? 'bg-white shadow-sm text-[var(--text-main)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
            >
              {t('review.reviewed', language)}
            </button>
            <button 
              onClick={() => { setActiveTab('long_video'); setSearchQuery(''); setSelectedClipId(null); }}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'long_video' ? 'bg-white shadow-sm text-[var(--text-main)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
            >
              {t('review.longVideo', language)}
            </button>
          </div>

          {activeTab !== 'long_video' && (
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlass size={16} className="text-[var(--text-muted)]" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, hook or status..."
                className="w-full pl-9 pr-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-muted)] hover:text-[var(--text-main)]"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}
        </ScrollReveal>

        {activeTab !== 'long_video' && (
          <ScrollReveal delay={0.1} className="flex-1 overflow-y-auto flex flex-col gap-3 pr-2">
            <AnimatePresence mode="popLayout">
              {displayClips.map((clip, index) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0, transition: { delay: index * 0.05 } }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={clip.id}
                  onClick={() => setSelectedClipId(clip.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedClip?.id === clip.id 
                      ? 'border-[var(--text-main)] bg-[var(--surface)] shadow-[0_2px_12px_rgba(0,0,0,0.04)]' 
                      : 'border-[var(--border)] bg-[var(--surface)] hover:border-gray-300 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex gap-4">
                    <div className="w-16 h-24 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                      <Scissors size={20} className="text-[var(--text-muted)]" />
                      <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1 rounded font-mono">
                        {clip.duration}
                      </div>
                    </div>
                    <div className="flex flex-col justify-between py-1">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {clip.status === 'pending' && <span className="w-2 h-2 rounded-full bg-yellow-400"></span>}
                          {clip.status === 'approved' && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                          {clip.status === 'rejected' && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                          <h4 className="text-sm font-medium text-[var(--text-main)] line-clamp-1">{clip.title}</h4>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] line-clamp-2 mt-1 leading-relaxed">"{clip.hook}"</p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                          {assets.find(a => a.id === clip.assetId)?.client || 'Unknown'}
                        </p>
                        {clip.comments && (
                          <ChatText size={14} className="text-[var(--text-muted)]" />
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              {displayClips.length === 0 && (
                <div className="text-center py-8 text-[var(--text-muted)] text-sm">
                  {activeTab === 'pending' ? t('review.noPending', language) : t('review.noReviewed', language)}
                </div>
              )}
            </AnimatePresence>
          </ScrollReveal>
        )}
      </div>

      {/* Right Column: Review Player & Actions */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto pb-8">
        <AnimatePresence mode="wait">
          {activeTab === 'long_video' ? (
            <motion.div 
              key="long_video"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-3xl w-full mx-auto"
            >
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-[var(--text-main)]">{t('review.uploadLongVideo', language)}</h2>
                <p className="text-sm text-[var(--text-muted)] mt-1">{t('review.uploadDesc', language)}</p>
              </div>

              {!aiReviewResult ? (
                <div 
                  className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center transition-colors mb-8 relative overflow-hidden ${
                    isDragging 
                      ? 'border-[var(--text-main)] bg-gray-50' 
                      : 'border-[var(--border)] bg-[var(--surface)] hover:border-gray-300'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => { 
                    e.preventDefault(); 
                    setIsDragging(false);
                    handleLongVideoUpload(e.dataTransfer.files);
                  }}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="video/mp4,video/quicktime,video/webm"
                    onChange={(e) => handleLongVideoUpload(e.target.files)}
                  />
                  
                  {isUploading ? (
                    <div className="flex flex-col items-center w-full max-w-md z-10">
                      <div className="flex gap-4 mb-4">
                        <GoogleDriveLogo size={32} className="text-blue-500 animate-bounce" weight="duotone" />
                        <Sparkle size={32} className="text-purple-500 animate-pulse" weight="duotone" />
                      </div>
                      <h3 className="text-base font-medium text-[var(--text-main)] mb-2">{t('review.syncing', language)}</h3>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2 overflow-hidden">
                        <div className="bg-purple-600 h-2.5 rounded-full transition-all duration-200" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">{uploadProgress < 50 ? t('review.uploadingToDrive', language) : t('review.analyzingVideo', language)}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center z-10">
                      <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                        <FileVideo size={24} className="text-purple-600" />
                      </div>
                      <h3 className="text-base font-medium text-[var(--text-main)] mb-1">{t('review.dropzone', language)}</h3>
                      <p className="text-sm text-[var(--text-muted)] max-w-sm">
                        {t('review.dropzoneDesc', language)}
                      </p>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-6 px-4 py-2 bg-[var(--text-main)] text-[var(--bg)] text-sm font-medium rounded-md hover:bg-[#333333] transition-colors active:scale-[0.98]"
                      >
                        {t('review.selectFile', language)}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Check size={24} className="text-green-600" weight="bold" />
                      <div>
                        <p className="text-sm font-medium mb-1 flex items-center gap-2">
                          <Sparkle size={16} className="text-[var(--accent)]" />
                          Claude Analysis
                        </p>
                        <h3 className="text-sm font-semibold text-green-800">{t('review.complete', language)}</h3>
                        <p className="text-xs text-green-600">{t('review.syncCompleteDesc', language)}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setAiReviewResult(null)}
                      className="px-3 py-1.5 bg-white border border-green-200 text-green-700 rounded-md text-xs font-medium hover:bg-green-50 transition-colors"
                    >
                      {t('review.uploadAnother', language)}
                    </button>
                  </div>

                  <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkle size={20} className="text-purple-500" weight="duotone" />
                      <h3 className="text-sm font-semibold text-[var(--text-main)]">{t('review.aiResults', language)}</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">{t('review.seoTitle', language)}</label>
                        <div className="p-3 bg-gray-50 border border-[var(--border)] rounded-md text-sm font-medium text-[var(--text-main)]">
                          {aiReviewResult.title}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">{t('review.seoDescription', language)}</label>
                        <div className="p-3 bg-gray-50 border border-[var(--border)] rounded-md text-sm text-[var(--text-main)] whitespace-pre-wrap">
                          {aiReviewResult.description}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">{t('review.hashtags', language)}</label>
                        <div className="p-3 bg-gray-50 border border-[var(--border)] rounded-md text-sm text-blue-600 font-medium">
                          {aiReviewResult.hashtags}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-[var(--text-main)] mb-4">{t('review.transcription', language)}</h3>
                    <div className="p-4 bg-gray-50 border border-[var(--border)] rounded-md text-sm text-[var(--text-muted)] leading-relaxed max-h-60 overflow-y-auto">
                      {aiReviewResult.transcription}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ) : selectedClip ? (
            <motion.div 
              key={selectedClip.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-3xl w-full mx-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-[var(--text-main)]">{selectedClip.title}</h2>
                  <p className="text-sm text-[var(--text-muted)] mt-1">{t('review.source', language)}: {sourceAsset?.title}</p>
                </div>
                {activeTab === 'pending' && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleReject}
                      className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] bg-[var(--surface)] text-[var(--text-main)] text-sm font-medium rounded-md hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors active:scale-[0.98]"
                    >
                      <X size={16} />
                      {t('review.reject', language)}
                    </button>
                    <button 
                      onClick={handleApprove}
                      className="flex items-center gap-2 px-4 py-2 bg-[var(--text-main)] text-[var(--bg)] text-sm font-medium rounded-md hover:bg-[#333333] transition-colors active:scale-[0.98]"
                    >
                      <Check size={16} />
                      {t('review.approve', language)}
                    </button>
                  </div>
                )}
              </div>

              {/* Video Player Placeholder */}
              <div className="w-full aspect-video bg-gray-100 border border-[var(--border)] rounded-xl flex flex-col items-center justify-center mb-8 relative overflow-hidden group">
                <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors"></div>
                <PlayCircle size={64} weight="light" className="text-[var(--text-main)] opacity-50 group-hover:opacity-100 transition-opacity cursor-pointer relative z-10" />
                <p className="text-xs text-[var(--text-muted)] mt-4 font-mono relative z-10">{t('review.opusPlayer', language)}</p>
              </div>

              {/* Metadata & AI Coach Suggestions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-6">
                  <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition-shadow">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">{t('review.generatedHook', language)}</h3>
                    <p className="text-sm text-[var(--text-main)] leading-relaxed">"{selectedClip.hook}"</p>
                  </div>
                  
                  <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{t('review.reviewNotes', language)}</h3>
                      {comment !== (selectedClip.comments || '') && (
                        <button 
                          id="save-review-btn"
                          onClick={handleSaveComment}
                          className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          {language === 'fr' ? 'Enregistrer' : 'Save'}
                        </button>
                      )}
                    </div>
                    <textarea 
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={t('review.addFeedback', language)}
                      className="w-full h-24 px-3 py-2 text-sm border border-[var(--border)] rounded-md bg-[var(--bg)] focus:outline-none focus:border-gray-400 resize-none transition-colors"
                    ></textarea>
                  </div>
                </div>

                <div className="bg-[#FBFBFA] border border-[var(--border)] rounded-xl p-5 flex flex-col hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition-shadow">
                  <div className="flex items-center gap-2 mb-4">
                    <ChatText size={18} className="text-[var(--text-muted)]" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-main)]">{t('review.aiInsights', language)}</h3>
                  </div>
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="p-3 bg-white border border-[var(--border)] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                      <p className="text-xs font-medium text-[var(--text-main)] mb-1">{t('review.viralPotential', language)}</p>
                      <p className="text-xs text-[var(--text-muted)]">{t('review.viralDesc', language)}</p>
                    </div>
                    <div className="p-3 bg-white border border-[var(--border)] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                      <p className="text-xs font-medium text-[var(--text-main)] mb-1">{t('review.suggestedCaption', language)}</p>
                      <p className="text-xs text-[var(--text-muted)]">{t('review.captionDesc', language)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full text-center"
            >
              <Scissors size={48} className="text-[var(--text-muted)] mb-4" weight="light" />
              <h2 className="text-xl font-medium mb-2">Select a clip</h2>
              <p className="text-[var(--text-muted)] max-w-sm">
                Choose a clip from the list to review, approve, or request changes.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
