import { useState, FormEvent, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UploadSimple, FileVideo } from '@phosphor-icons/react';
import { useAppStore } from '../store';
import { AssetStatus } from '../types';
import { t } from '../i18n';
import { ImageUpload } from './ImageUpload';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { api } from '../lib/api';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddAssetModal({ isOpen, onClose }: AddAssetModalProps) {
  const { addAsset, language } = useAppStore();
  
  const [title, setTitle] = useState('');
  const [client, setClient] = useState('');
  const [campaign, setCampaign] = useState('');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [status, setStatus] = useState<AssetStatus>('inbox');
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setVideoFile(file);
      // Create a local object URL for preview/playback
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      
      // Auto-fill title if empty
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
      toast.success(t('addAsset.videoUploaded', language) || 'Video uploaded successfully');
    }
  }, [title, language]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv']
    },
    maxFiles: 1
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !client.trim()) return;

    // Validate video URL if no file is uploaded and a URL is provided
    if (!videoFile && videoUrl.trim()) {
      try {
        new URL(videoUrl);
      } catch (_) {
        toast.error(t('addAsset.invalidVideoUrl', language) || 'Please enter a valid video URL (e.g. https://...)');
        return;
      }
    }

    addAsset({
      title,
      description,
      tags: Array.from(new Set(tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''))),
      client,
      campaign: campaign || 'N/A',
      status,
      duration: duration || '00:00',
      thumbnailUrl,
      videoUrl,
      order: 0,
    });

    toast.success(t('addAsset.success', language) || 'Asset added successfully');

    // Reset form and close
    setTitle('');
    setDescription('');
    setTags('');
    setThumbnailUrl('');
    setVideoUrl('');
    setVideoFile(null);
    setClient('');
    setCampaign('');
    setDuration('');
    setStatus('inbox');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0">
              <h2 className="text-lg font-semibold text-[var(--text-main)]">{t('addAsset.title', language)}</h2>
              <button 
                onClick={onClose}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors p-1 rounded-md hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Video Upload Area */}
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-blue-500 bg-blue-50' : 'border-[var(--border)] hover:border-gray-400 bg-gray-50/50'
                }`}
              >
                <input {...getInputProps()} />
                {videoFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                      <FileVideo size={24} weight="fill" />
                    </div>
                    <p className="text-sm font-medium text-[var(--text-main)] truncate max-w-full px-4">{videoFile.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setVideoFile(null);
                        setVideoUrl('');
                      }}
                      className="text-xs text-red-500 hover:text-red-600 mt-2 font-medium"
                    >
                      {t('addAsset.removeVideo', language) || 'Remove video'}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-gray-100 text-[var(--text-muted)] rounded-full flex items-center justify-center mb-2">
                      <UploadSimple size={24} />
                    </div>
                    <p className="text-sm font-medium text-[var(--text-main)]">
                      {isDragActive ? 'Drop video here' : (t('addAsset.dragDropVideo', language) || 'Drag & drop a video, or click to select')}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">MP4, MOV, AVI up to 2GB</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-main)] mb-1">{t('addAsset.assetTitle', language)}</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('addAsset.titlePlaceholder', language)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--bg)] text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-main)] mb-1">{t('addAsset.client', language)}</label>
                  <input
                    type="text"
                    required
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    placeholder={t('addAsset.clientPlaceholder', language)}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--bg)] text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-main)] mb-1">{t('addAsset.campaign', language)}</label>
                  <input
                    type="text"
                    value={campaign}
                    onChange={(e) => setCampaign(e.target.value)}
                    placeholder={t('addAsset.campaignPlaceholder', language)}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--bg)] text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-main)] mb-1">{t('addAsset.description', language)}</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('addAsset.descriptionPlaceholder', language)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--bg)] text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-main)] mb-1">{t('addAsset.tags', language)}</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder={t('addAsset.tagsPlaceholder', language)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--bg)] text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <ImageUpload 
                label={t('addAsset.thumbnailUrl', language)}
                currentImage={thumbnailUrl}
                onImageUpload={setThumbnailUrl}
              />

              {!videoFile && (
                <div>
                  <label className="block text-sm font-medium text-[var(--text-main)] mb-1">{t('addAsset.videoUrl', language)}</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder={t('addAsset.videoPlaceholder', language) || "https://youtube.com/..."}
                      className="flex-1 px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--bg)] text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!videoUrl) return toast.error("Please enter a YouTube URL first");
                        try {
                          const data = await api.post<any>('/api/assets/import-youtube', { url: videoUrl });
                          if (data.success && data.project) {
                             setTitle(data.project.title);
                             if (data.project.assets[0].duration) setDuration(data.project.assets[0].duration.toString());
                             if (data.project.assets[0].thumbnailUrl) setThumbnailUrl(data.project.assets[0].thumbnailUrl);
                             toast.success("YouTube video details imported!");
                          }
                        } catch (err) {
                           // api utility handled the toast error
                           console.error("YouTube import error:", err);
                        }
                      }}
                      className="px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-md text-sm font-medium text-[var(--text-main)] hover:bg-gray-50 flex items-center justify-center shrink-0 disabled:opacity-50"
                    >
                      Fetch Details
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-main)] mb-1">{t('addAsset.duration', language)}</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder={t('addAsset.durationPlaceholder', language)}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--bg)] text-sm focus:outline-none focus:border-blue-500 transition-colors font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-main)] mb-1">{t('addAsset.initialStatus', language)}</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as AssetStatus)}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--bg)] text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="inbox">{t('workflow.inbox', language)}</option>
                    <option value="to_classify">{t('workflow.toClassify', language)}</option>
                    <option value="ready_clipping">{t('workflow.readyClipping', language)}</option>
                    <option value="processing">{t('workflow.processing', language)}</option>
                    <option value="review">{t('workflow.clipReview', language)}</option>
                    <option value="approved">{t('workflow.approved', language)}</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 mt-6 border-t border-[var(--border)] flex justify-end gap-3 shrink-0 sticky bottom-0 bg-[var(--surface)] pb-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                >
                  {t('addAsset.cancel', language)}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                >
                  {t('addAsset.add', language)}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
