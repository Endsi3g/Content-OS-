import { useState, useEffect } from 'react';
import { X, Trash, Clock, CalendarBlank, Tag, BuildingOffice } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import { Asset } from '../types';
import { Badge } from './Badge';
import { useAppStore } from '../store';
import { t } from '../i18n';
import { ConfirmationDialog } from './ConfirmationDialog';
import { ImageUpload, MediaUpload } from './ImageUpload';
import { VideoPlayer } from './ui/VideoPlayer';

interface AssetDetailsModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
}

export function AssetDetailsModal({ asset, isOpen, onClose, isLoading = false }: AssetDetailsModalProps) {
  const { removeAsset, updateAsset, language } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [title, setTitle] = useState(asset?.title || '');
  const [client, setClient] = useState(asset?.client || '');
  const [campaign, setCampaign] = useState(asset?.campaign || '');
  const [description, setDescription] = useState(asset?.description || '');
  const [tags, setTags] = useState(asset?.tags?.join(', ') || '');
  const [thumbnailUrl, setThumbnailUrl] = useState(asset?.thumbnailUrl || '');
  const [videoUrl, setVideoUrl] = useState(asset?.videoUrl || '');
  const [dbAsset, setDbAsset] = useState<{ id: string, storagePath: string } | null>(null);

  useEffect(() => {
    if (asset) {
      setTitle(asset.title || '');
      setClient(asset.client || '');
      setCampaign(asset.campaign || '');
      setDescription(asset.description || '');
      setTags(asset.tags?.join(', ') || '');
      setThumbnailUrl(asset.thumbnailUrl || '');
      setVideoUrl(asset.videoUrl || '');
      
      // Fetch the actual linked video from Prisma PostgreSQL
      fetch(`/api/assets/${asset.id}`)
        .then(res => res.json())
        .then(data => {
            if (data.success && data.asset) {
                setDbAsset(data.asset);
                if (data.asset.storagePath && !asset.videoUrl) {
                    setVideoUrl(data.asset.storagePath);
                }
            }
        })
        .catch(console.error);
    }
  }, [asset]);

  const handleSave = () => {
    if (!asset) return;
    updateAsset(asset.id, {
      title,
      client,
      campaign,
      description,
      tags: Array.from(new Set(tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''))),
      thumbnailUrl,
      videoUrl,
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (!asset) return;
    removeAsset(asset.id);
    onClose();
  };

  const SkeletonItem = ({ height = "h-4" }: { height?: string }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${height} w-full`} />
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="absolute inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={onClose}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-4xl max-h-full bg-white overflow-hidden flex flex-col rounded-xl shadow-2xl"
            >
          <div className="flex items-center justify-between p-6 border-b border-[var(--border)] bg-gray-50/50">
            <h2 className="text-2xl font-semibold text-[var(--text-main)]">{t('assetDetails.title', language)}</h2>
            <div className="flex items-center gap-3">
              {!isEditing && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 border border-[var(--border)] rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    {language === 'fr' ? 'Modifier' : 'Edit'}
                  </button>
                  <button
                    onClick={() => setIsConfirmOpen(true)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title={t('assetDetails.delete', language)}
                  >
                    <Trash size={20} />
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-gray-100 rounded-md transition-colors ml-4"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="p-8 overflow-y-auto flex-1 max-w-5xl mx-auto w-full">
            {isLoading ? (
              <div className="space-y-6">
                 <SkeletonItem height="h-8" />
                 <div className="flex gap-2"><SkeletonItem height="h-6" /><SkeletonItem height="h-6" /></div>
                 <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                     <SkeletonItem height="h-16" />
                     <SkeletonItem height="h-16" />
                   </div>
                   <SkeletonItem height="h-16" />
                   <SkeletonItem height="h-16" />
                 </div>
              </div>
            ) : !asset ? (
               <div className="text-center p-8 text-[var(--text-muted)]">No asset data available.</div>
            ) : isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-main)] mb-1">Title</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border border-[var(--border)] rounded-md" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-main)] mb-1">{t('assetDetails.client', language)}</label>
                      <input type="text" value={client} onChange={(e) => setClient(e.target.value)} className="w-full px-3 py-2 border border-[var(--border)] rounded-md" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-main)] mb-1">{t('assetDetails.campaign', language)}</label>
                      <input type="text" value={campaign} onChange={(e) => setCampaign(e.target.value)} className="w-full px-3 py-2 border border-[var(--border)] rounded-md" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-main)] mb-1">{t('assetDetails.description', language)}</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border border-[var(--border)] rounded-md" rows={3} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-main)] mb-1">{t('assetDetails.tags', language)}</label>
                    <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} className="w-full px-3 py-2 border border-[var(--border)] rounded-md" />
                  </div>
                  <ImageUpload 
                    label={t('assetDetails.thumbnailUrl', language)}
                    currentImage={thumbnailUrl}
                    onImageUpload={setThumbnailUrl}
                  />
                  <MediaUpload 
                    label={t('assetDetails.videoUrl', language)}
                    currentMedia={videoUrl}
                    onMediaUpload={setVideoUrl}
                    type="video"
                  />
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-[var(--text-muted)] italic">Or enter video URL directly:</label>
                    <input type="text" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm" placeholder="https://..." />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-[var(--text-main)] mb-2">{asset.title}</h3>
                    <div className="flex items-center gap-2">
                      <Badge status={asset.status} />
                      <span className="text-xs text-[var(--text-muted)] font-mono bg-gray-100 px-2 py-1 rounded-md flex items-center gap-1">
                        <Clock size={14} />
                        {asset.duration}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg border border-[var(--border)]">
                        <div className="flex items-center gap-2 text-[var(--text-muted)] mb-1">
                          <BuildingOffice size={16} />
                          <span className="text-xs font-medium uppercase tracking-wider">{t('assetDetails.client', language)}</span>
                        </div>
                        <p className="text-sm font-medium text-[var(--text-main)]">{asset.client || t('assetDetails.unassigned', language)}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg border border-[var(--border)]">
                        <div className="flex items-center gap-2 text-[var(--text-muted)] mb-1">
                          <Tag size={16} />
                          <span className="text-xs font-medium uppercase tracking-wider">{t('assetDetails.campaign', language)}</span>
                        </div>
                        <p className="text-sm font-medium text-[var(--text-main)]">{asset.campaign || t('assetDetails.unassigned', language)}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg border border-[var(--border)]">
                      <div className="flex items-center gap-2 text-[var(--text-muted)] mb-1">
                        <CalendarBlank size={16} />
                        <span className="text-xs font-medium uppercase tracking-wider">{t('assetDetails.addedOn', language)}</span>
                      </div>
                      <p className="text-sm font-medium text-[var(--text-main)]">
                        {new Date(asset.createdAt).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US', { 
                          dateStyle: 'medium', 
                          timeStyle: 'short' 
                        })}
                      </p>
                    </div>
                    
                    {asset.description && (
                      <div className="p-3 bg-gray-50 rounded-lg border border-[var(--border)]">
                        <div className="flex items-center gap-2 text-[var(--text-muted)] mb-1">
                          <span className="text-xs font-medium uppercase tracking-wider">{t('assetDetails.description', language)}</span>
                        </div>
                        <p className="text-sm text-[var(--text-main)]">{asset.description}</p>
                      </div>
                    )}

                    {asset.tags && asset.tags.length > 0 && (
                      <div className="p-3 bg-gray-50 rounded-lg border border-[var(--border)]">
                        <div className="flex items-center gap-2 text-[var(--text-muted)] mb-1">
                          <Tag size={16} />
                          <span className="text-xs font-medium uppercase tracking-wider">{t('assetDetails.tags', language)}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {asset.tags.map(tag => (
                            <span key={tag} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-md">{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {asset.thumbnailUrl && (
                      <div className="p-3 bg-gray-50 rounded-lg border border-[var(--border)]">
                        <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-2">{t('assetDetails.thumbnailUrl', language)}</p>
                        <div className="rounded-lg overflow-hidden border border-[var(--border)] bg-gray-100 max-w-sm">
                          <img 
                            src={asset.thumbnailUrl} 
                            alt={asset.title} 
                            className="w-full h-auto object-contain max-h-64"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>
                    )}
                    
                    {asset.videoUrl && (
                      <div className="p-3 bg-gray-50 rounded-lg border border-[var(--border)]">
                        <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-2">{t('assetDetails.videoUrl', language)}</p>
                        <div className="rounded-lg overflow-hidden border border-[var(--border)] bg-black max-w-2xl aspect-video relative">
                          <VideoPlayer 
                            src={asset.videoUrl}
                            poster={asset.thumbnailUrl}
                            className="absolute inset-0 w-full h-full"
                          />
                        </div>
                      </div>
                    )}

                    <div className="p-3 bg-gray-50 rounded-lg border border-[var(--border)]">
                      <div className="flex items-center gap-2 text-[var(--text-muted)] mb-1">
                        <span className="text-xs font-medium uppercase tracking-wider">ID</span>
                      </div>
                      <p className="text-xs font-mono text-[var(--text-muted)]">{asset.id}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {(!isLoading && asset && isEditing) && (
              <div className="p-4 border-t border-[var(--border)] bg-gray-50 flex justify-end gap-3 shrink-0">
                <button onClick={() => setIsEditing(false)} className="px-5 py-2 text-sm font-medium border border-[var(--border)] rounded-md hover:bg-gray-100 transition-colors">
                  {language === 'fr' ? 'Annuler' : 'Cancel'}
                </button>
                <button onClick={handleSave} className="px-5 py-2 text-sm font-medium bg-[var(--text-main)] text-[var(--surface)] rounded-md hover:bg-[#333333] transition-colors">
                  {language === 'fr' ? 'Enregistrer' : 'Save'}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title={t('assetDetails.deleteTitle', language)}
        message={t('assetDetails.deleteConfirm', language)}
      />
      </>
      )}
    </AnimatePresence>
  );
}
