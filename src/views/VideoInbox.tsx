import { useState, useRef } from 'react';
import { UploadSimple, FileVideo, X, CaretRight, GoogleDriveLogo, CheckCircle, MagnifyingGlass, CircleNotch as Spinner } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import { Asset } from '../types';
import { Badge } from '../components/Badge';
import { useAppStore } from '../store';
import { ScrollReveal } from '../components/ScrollReveal';
import { t } from '../i18n';
import { toast } from 'sonner';

export function VideoInbox() {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSendingToOpus, setIsSendingToOpus] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { assets, updateAssetStatus, addAsset, language } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterCampaign, setFilterCampaign] = useState<string>('all');

  const inboxAssets = assets.filter(a => a.status === 'inbox' || a.status === 'to_classify');
  
  const filteredInboxAssets = inboxAssets.filter(asset => {
    const matchesSearch = 
      asset.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.campaign.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesClient = filterClient === 'all' || asset.client === filterClient;
    const matchesCampaign = filterCampaign === 'all' || asset.campaign === filterCampaign;

    return matchesSearch && matchesClient && matchesCampaign;
  });

  const clients = Array.from(new Set(inboxAssets.map(a => a.client))).filter(Boolean);
  const campaigns = Array.from(new Set(inboxAssets.map(a => a.campaign))).filter(Boolean);

  const handleSendToOpus = () => {
    if (selectedAsset) {
      setIsSendingToOpus(true);
      
      // Simulate API call to Opus Clip
      setTimeout(() => {
        updateAssetStatus(selectedAsset.id, 'processing');
        setIsSendingToOpus(false);
        setSelectedAsset(null);
        toast.success(language === 'fr' ? 'Envoyé à Opus Clip avec succès' : 'Successfully sent to Opus Clip');
      }, 2000);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const { ref, uploadBytesResumable, getDownloadURL } = await import('firebase/storage');
      const { storage } = await import('../lib/firebase');
      const { api } = await import('../lib/api');

      const storageRef = ref(storage, `videos/${Date.now()}_${file.name}`);
      const task = uploadBytesResumable(storageRef, file);

      task.on('state_changed',
        (snap) => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
        (err) => {
          setIsUploading(false);
          setUploadProgress(0);
          toast.error(language === 'fr' ? 'Échec de l\'upload: ' + err.message : 'Upload failed: ' + err.message);
        },
        async () => {
          try {
            const url = await getDownloadURL(task.snapshot.ref);
            const res = await api.post('/api/assets', {
              storagePath: url,
              type: 'video',
              title: file.name.replace(/\.[^/.]+$/, ''),
            });
            addAsset({
              title: file.name.replace(/\.[^/.]+$/, ''),
              client: '',
              campaign: '',
              status: 'inbox',
              duration: '00:00',
              order: 0,
            });
            toast.success(language === 'fr' ? 'Fichier uploadé et synchronisé' : 'File uploaded and synced');
          } catch (e) {
            toast.error(language === 'fr' ? 'Erreur lors de la création de l\'asset' : 'Failed to create asset');
          } finally {
            setIsUploading(false);
            setUploadProgress(0);
          }
        }
      );
    } catch (e) {
      setIsUploading(false);
      setUploadProgress(0);
      toast.error(language === 'fr' ? 'Erreur d\'upload' : 'Upload error');
    }
  };

  return (
    <div className="flex h-full relative">
      <div className={`flex-1 flex flex-col transition-all duration-300 ${selectedAsset ? 'pr-80' : ''}`}>
        <ScrollReveal delay={0}>
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-main)] mb-1">{t('inbox.title', language)}</h1>
            <p className="text-sm text-[var(--text-muted)]">{t('inbox.description', language)}</p>
          </div>

          {/* Search & Filters */}
          <div className="flex items-center gap-3 mb-8">
            <div className="relative flex-1">
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('database.search', language)} 
                className="pl-9 pr-4 py-2 text-sm border border-[var(--border)] rounded-md bg-[var(--surface)] focus:outline-none focus:border-gray-400 w-full transition-colors"
              />
            </div>
            <select value={filterClient} onChange={(e) => setFilterClient(e.target.value)} className="px-3 py-2 text-sm border border-[var(--border)] rounded-md bg-[var(--surface)] focus:outline-none focus:border-gray-400 transition-colors">
              <option value="all">All Clients</option>
              {clients.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filterCampaign} onChange={(e) => setFilterCampaign(e.target.value)} className="px-3 py-2 text-sm border border-[var(--border)] rounded-md bg-[var(--surface)] focus:outline-none focus:border-gray-400 transition-colors">
              <option value="all">All Campaigns</option>
              {campaigns.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </ScrollReveal>

        {/* Upload Zone */}
        <ScrollReveal delay={0.1}>
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
              handleFileUpload(e.dataTransfer.files);
            }}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="video/mp4,video/quicktime,video/webm"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
            
            {isUploading ? (
              <div className="flex flex-col items-center w-full max-w-md z-10">
                <GoogleDriveLogo size={32} className="text-blue-500 mb-4 animate-bounce" weight="duotone" />
                <h3 className="text-base font-medium text-[var(--text-main)] mb-2">{t('inbox.syncing', language)}</h3>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2 overflow-hidden">
                  <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-200" style={{ width: `${uploadProgress}%` }}></div>
                </div>
                <p className="text-xs text-[var(--text-muted)]">{uploadProgress}% {t('inbox.complete', language)}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center z-10">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <UploadSimple size={24} className="text-[var(--text-main)]" />
                </div>
                <h3 className="text-base font-medium text-[var(--text-main)] mb-1">{t('inbox.dropzone', language)}</h3>
                <p className="text-sm text-[var(--text-muted)] max-w-sm">
                  {t('inbox.dropzoneDesc', language)}
                </p>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-6 px-4 py-2 bg-[var(--text-main)] text-[var(--bg)] text-sm font-medium rounded-md hover:bg-[#333333] transition-colors active:scale-[0.98]"
                >
                  {t('inbox.selectFiles', language)}
                </button>
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* Inbox List */}
        <ScrollReveal delay={0.2}>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-4">{t('inbox.needsClass', language)} ({filteredInboxAssets.length})</h3>
            <div className="flex flex-col gap-3">
              <AnimatePresence mode="popLayout">
                {filteredInboxAssets.map((asset, index) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer ${
                      selectedAsset?.id === asset.id 
                        ? 'border-[var(--text-main)] bg-[var(--surface)] shadow-[0_2px_8px_rgba(0,0,0,0.04)]' 
                        : 'border-[var(--border)] bg-[var(--surface)] hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-[var(--text-muted)]">
                        <FileVideo size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-[var(--text-main)]">{asset.title}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-[var(--text-muted)] font-mono">{asset.duration}</span>
                          <span className="text-xs text-[var(--border)]">•</span>
                          <span className="text-xs text-[var(--text-muted)]">Added today</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge status={asset.status} />
                      <CaretRight size={16} className="text-[var(--text-muted)]" />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* Contextual Side Panel */}
      <AnimatePresence>
        {selectedAsset && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute top-0 right-0 w-80 h-full bg-[var(--surface)] border-l border-[var(--border)] shadow-[-4px_0_24px_rgba(0,0,0,0.02)] flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <h3 className="text-sm font-medium">Classify Asset</h3>
              <button 
                onClick={() => setSelectedAsset(null)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text-main)] rounded transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">Title</label>
                <input 
                  type="text" 
                  defaultValue={selectedAsset.title}
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md bg-[var(--bg)] focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">Client</label>
                <select 
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md bg-[var(--bg)] focus:outline-none focus:border-gray-400 appearance-none transition-colors"
                  defaultValue={selectedAsset.client === 'Acme Corp' ? 'acme' : selectedAsset.client === 'Globex' ? 'globex' : selectedAsset.client === 'TechFlow' ? 'techflow' : ''}
                >
                  <option value="">Select client...</option>
                  <option value="acme">Acme Corp</option>
                  <option value="globex">Globex</option>
                  <option value="techflow">TechFlow</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">Campaign</label>
                <input 
                  type="text" 
                  defaultValue={selectedAsset.campaign}
                  placeholder="e.g. Q3 Launch"
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md bg-[var(--bg)] focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>

              <div className="mt-auto pt-6 border-t border-[var(--border)]">
                <button 
                  className="w-full py-2 bg-[var(--text-main)] text-[var(--bg)] text-sm font-medium rounded-md hover:bg-[#333333] transition-colors flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleSendToOpus}
                  disabled={isSendingToOpus}
                >
                  {isSendingToOpus ? (
                    <>
                      <Spinner size={16} className="animate-spin" />
                      {language === 'fr' ? 'Envoi...' : 'Sending...'}
                    </>
                  ) : (
                    t('inbox.sendToOpus', language)
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
