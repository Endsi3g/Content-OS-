import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Badge } from '../components/Badge';
import { AssetStatus } from '../types';
import { DotsThree, Clock, VideoCamera, Plus } from '@phosphor-icons/react';
import { useAppStore } from '../store';
import { t } from '../i18n';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { ScrollReveal } from '../components/ScrollReveal';
import { AssetDetailsModal } from '../components/AssetDetailsModal';

export function Workflow() {
  const { assets, language, updateAsset, updateAssetOrder, setIsAddModalOpen } = useAppStore();
  const [editingColumn, setEditingColumn] = useState<AssetStatus | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  
  const selectedAsset = assets.find(a => a.id === selectedAssetId) || null;

  const [columnNames, setColumnNames] = useState<Record<AssetStatus, string>>({
    inbox: t('workflow.inbox', language),
    to_classify: t('workflow.toClassify', language),
    ready_clipping: t('workflow.readyClipping', language),
    processing: t('workflow.processing', language),
    received: t('workflow.received', language) || 'Received',
    review: t('workflow.clipReview', language),
    approved: t('workflow.approved', language),
    published: t('workflow.published', language),
  });

  const COLUMNS: { id: AssetStatus }[] = [
    { id: 'inbox' },
    { id: 'to_classify' },
    { id: 'ready_clipping' },
    { id: 'processing' },
    { id: 'received' },
    { id: 'review' },
    { id: 'approved' },
    { id: 'published' },
  ];

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) {
      // Reordering within the same column
      const columnAssets = assets
        .filter(a => a.status === source.droppableId)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      
      const newColumnAssets = [...columnAssets];
      const [removed] = newColumnAssets.splice(source.index, 1);
      newColumnAssets.splice(destination.index, 0, removed);
      
      updateAssetOrder(newColumnAssets.map(a => a.id));
    } else {
      // Moving between columns
      updateAsset(draggableId, { status: destination.droppableId as AssetStatus });
    }
  };

  const handleColumnNameChange = (id: AssetStatus, newName: string) => {
    setColumnNames(prev => ({ ...prev, [id]: newName }));
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollReveal delay={0}>
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-main)] mb-1">{t('workflow.title', language)}</h1>
            <p className="text-sm text-[var(--text-muted)]">{t('workflow.description', language)}</p>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={16} weight="bold" />
            {t('database.newAsset', language)}
          </button>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.1} className="flex-1 overflow-hidden flex flex-col">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
            <div className="flex gap-4 h-full min-w-max">
            {COLUMNS.map(col => {
              const columnAssets = assets
                .filter(a => a.status === col.id)
                .sort((a, b) => (a.order || 0) - (b.order || 0));
                
              return (
                <Droppable droppableId={col.id} key={col.id}>
                  {(provided) => (
                    <div 
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="w-[320px] flex flex-col h-full bg-gray-50/50 rounded-xl border border-[var(--border)] p-3"
                    >
                      <div className="flex items-center justify-between mb-4 px-1 group">
                        <div className="flex items-center gap-2 flex-1">
                          {editingColumn === col.id ? (
                            <input
                              type="text"
                              value={columnNames[col.id]}
                              onChange={(e) => handleColumnNameChange(col.id, e.target.value)}
                              onBlur={() => setEditingColumn(null)}
                              onKeyDown={(e) => e.key === 'Enter' && setEditingColumn(null)}
                              autoFocus
                              className="text-xs font-semibold uppercase tracking-wider text-[var(--text-main)] bg-white border border-blue-300 rounded px-1 py-0.5 w-full outline-none"
                            />
                          ) : (
                            <h3 
                              onClick={() => setEditingColumn(col.id)}
                              className="text-xs font-semibold uppercase tracking-wider text-[var(--text-main)] cursor-text hover:bg-gray-200 px-1 py-0.5 rounded -ml-1 transition-colors"
                              title="Click to rename"
                            >
                              {columnNames[col.id]}
                            </h3>
                          )}
                          <span className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--surface)] border border-[var(--border)] px-1.5 py-0.5 rounded-md">
                            {columnAssets.length}
                          </span>
                        </div>
                        <button 
                          onClick={() => setIsAddModalOpen(true)}
                          className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors opacity-0 group-hover:opacity-100 mr-1"
                          title="Add asset to this column"
                        >
                          <Plus size={16} weight="bold" />
                        </button>
                        <button className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                          <DotsThree size={20} weight="bold" />
                        </button>
                      </div>

                      <div className="flex flex-col gap-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                        {columnAssets.map((asset, index) => (
                          <Draggable key={asset.id} draggableId={asset.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => setSelectedAssetId(asset.id)}
                                className={`bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4 hover:border-gray-300 transition-colors group cursor-pointer ${snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-500/20' : ''}`}
                                style={{
                                  ...provided.draggableProps.style,
                                }}
                              >
                                <div className="flex justify-between items-start mb-3">
                                  <Badge status={asset.status} />
                                  <span className="text-xs text-[var(--text-muted)] font-mono flex items-center gap-1">
                                    <Clock size={12} />
                                    {asset.duration}
                                  </span>
                                </div>
                                <h4 className="text-sm font-medium text-[var(--text-main)] mb-2 leading-snug group-hover:text-black transition-colors">
                                  {asset.title}
                                </h4>
                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border)]">
                                  <p className="text-xs text-[var(--text-muted)] font-medium">{asset.client}</p>
                                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[var(--text-muted)]">
                                    <VideoCamera size={12} />
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {columnAssets.length === 0 && (
                          <div className="border border-dashed border-[var(--border)] rounded-lg p-4 flex items-center justify-center h-24 bg-transparent">
                            <span className="text-xs text-[var(--text-muted)]">{t('workflow.dropAssets', language)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Droppable>
              );
            })}
          </div>
        </div>
      </DragDropContext>
      </ScrollReveal>
      <AssetDetailsModal
        asset={selectedAsset}
        isOpen={!!selectedAssetId}
        onClose={() => setSelectedAssetId(null)}
      />
    </div>
  );
}
