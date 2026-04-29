import { useState, useEffect } from 'react';
import { List, Kanban, Funnel, MagnifyingGlass, Plus, Trash, CheckSquareOffset, X, ArrowUUpLeft, ArrowUUpRight } from '@phosphor-icons/react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'motion/react';
import { Badge } from '../components/Badge';
import { useAppStore } from '../store';
import { Asset, AssetStatus } from '../types';
import { AddAssetModal } from '../components/AddAssetModal';
import { AssetDetailsModal } from '../components/AssetDetailsModal';
import { ScrollReveal } from '../components/ScrollReveal';
import { OnboardingTooltip } from '../components/OnboardingTooltip';
import { t } from '../i18n';

type ViewMode = 'table' | 'board';

export function ContentDatabase() {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterCampaign, setFilterCampaign] = useState<string>('all');
  const [filterTag, setFilterTag] = useState<string>('all');
  const { assets, language, isAddModalOpen, setIsAddModalOpen, removeAssets, updateAssetsStatus, updateAssets, undo, redo, canUndo, canRedo } = useAppStore();

  const selectedAsset = assets.find(a => a.id === selectedAssetId) || null;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          if (canRedo) redo();
        } else {
          if (canUndo) undo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        if (canRedo) redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  const clients = Array.from(new Set(assets.map(a => a.client))).filter(Boolean);
  const campaigns = Array.from(new Set(assets.map(a => a.campaign))).filter(Boolean);
  const tags = Array.from(new Set(assets.flatMap(a => a.tags || []))).filter(Boolean);

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = 
      asset.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.campaign.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesClient = filterClient === 'all' || asset.client === filterClient;
    const matchesCampaign = filterCampaign === 'all' || asset.campaign === filterCampaign;
    const matchesTag = filterTag === 'all' || asset.tags?.includes(filterTag);

    return matchesSearch && matchesClient && matchesCampaign && matchesTag;
  });

  const toggleAssetSelection = (id: string) => {
    setSelectedAssets(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const toggleAllSelection = () => {
    if (selectedAssets.length === filteredAssets.length) {
      setSelectedAssets([]);
    } else {
      setSelectedAssets(filteredAssets.map(a => a.id));
    }
  };

  const handleBulkDelete = () => {
    if (confirm(language === 'fr' ? 'Êtes-vous sûr de vouloir supprimer les éléments sélectionnés ?' : 'Are you sure you want to delete the selected assets?')) {
      removeAssets(selectedAssets);
      setSelectedAssets([]);
    }
  };

  const handleBulkStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as AssetStatus;
    if (newStatus) {
      updateAssetsStatus(selectedAssets, newStatus);
      setSelectedAssets([]);
    }
  };

  const handleBulkClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newClient = e.target.value;
    if (newClient) {
      updateAssets(selectedAssets, { client: newClient });
      setSelectedAssets([]);
    }
  };

  const handleBulkCampaignChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCampaign = e.target.value;
    if (newCampaign) {
      updateAssets(selectedAssets, { campaign: newCampaign });
      setSelectedAssets([]);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Header & Controls */}
      <ScrollReveal delay={0}>
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-main)] mb-1">{t('database.title', language)}</h1>
              <p className="text-sm text-[var(--text-muted)]">{t('database.description', language)}</p>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center bg-[var(--surface)] border border-[var(--border)] rounded-md p-1">
                <button 
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded transition-colors ${viewMode === 'table' ? 'bg-gray-100 text-[var(--text-main)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                >
                  <List weight={viewMode === 'table' ? 'fill' : 'regular'} size={18} />
                </button>
                <button 
                  onClick={() => setViewMode('board')}
                  className={`p-1.5 rounded transition-colors ${viewMode === 'board' ? 'bg-gray-100 text-[var(--text-main)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                >
                  <Kanban weight={viewMode === 'board' ? 'fill' : 'regular'} size={18} />
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={undo}
                  disabled={!canUndo}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${canUndo ? 'text-[var(--text-main)] hover:bg-gray-100' : 'text-gray-400 cursor-not-allowed'}`}
                >
                  <ArrowUUpLeft size={16} />
                  {language === 'fr' ? 'Annuler' : 'Undo'}
                </button>
                <button 
                  onClick={redo}
                  disabled={!canRedo}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${canRedo ? 'text-[var(--text-main)] hover:bg-gray-100' : 'text-gray-400 cursor-not-allowed'}`}
                >
                  <ArrowUUpRight size={16} />
                  {language === 'fr' ? 'Refaire' : 'Redo'}
                </button>
              </div>

              <OnboardingTooltip
                id="add-asset"
                title="Create New Assets"
                content="Click here to add new content assets to your database. You can upload files and assign them to clients."
                position="bottom"
                delay={1000}
              >
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[var(--text-main)] text-[var(--bg)] rounded-md hover:opacity-90 transition-opacity shadow-sm ml-2"
                >
                  <Plus size={16} weight="bold" />
                  {t('database.newAsset', language)}
                </button>
              </OnboardingTooltip>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
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
            <div className="flex gap-3">
              <select value={filterClient} onChange={(e) => setFilterClient(e.target.value)} className="px-3 py-2 text-sm border border-[var(--border)] rounded-md bg-[var(--surface)] focus:outline-none focus:border-gray-400 transition-colors flex-1 sm:flex-none">
                <option value="all">All Clients</option>
                {clients.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={filterCampaign} onChange={(e) => setFilterCampaign(e.target.value)} className="px-3 py-2 text-sm border border-[var(--border)] rounded-md bg-[var(--surface)] focus:outline-none focus:border-gray-400 transition-colors flex-1 sm:flex-none">
                <option value="all">All Campaigns</option>
                {campaigns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)} className="px-3 py-2 text-sm border border-[var(--border)] rounded-md bg-[var(--surface)] focus:outline-none focus:border-gray-400 transition-colors flex-1 sm:flex-none">
                <option value="all">All Tags</option>
                {tags.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Content Area */}
      <ScrollReveal delay={0.1} className="flex-1 overflow-hidden flex flex-col relative">
        {viewMode === 'table' ? (
          <TableView 
            assets={filteredAssets} 
            onAssetClick={(asset) => setSelectedAssetId(asset.id)} 
            language={language}
            selectedAssets={selectedAssets}
            toggleAssetSelection={toggleAssetSelection}
            toggleAllSelection={toggleAllSelection}
          />
        ) : (
          <BoardView 
            assets={filteredAssets} 
            onAssetClick={(asset) => setSelectedAssetId(asset.id)} 
            language={language}
            selectedAssets={selectedAssets}
            toggleAssetSelection={toggleAssetSelection}
          />
        )}

        {/* Bulk Actions Bar */}
        <AnimatePresence>
          {selectedAssets.length > 0 && (
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[var(--surface)] border border-[var(--border)] shadow-xl rounded-full px-6 py-3 flex items-center gap-6 z-50"
            >
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                  {selectedAssets.length}
                </span>
                <span className="text-sm font-medium text-[var(--text-main)]">
                  {language === 'fr' ? 'sélectionnés' : 'selected'}
                </span>
              </div>
              
              <div className="w-px h-6 bg-[var(--border)]"></div>
              
              <div className="flex items-center gap-3">
                <div className="relative flex items-center">
                  <select 
                    onChange={handleBulkStatusChange}
                    value=""
                    className="appearance-none bg-transparent border border-[var(--border)] rounded-md pl-3 pr-8 py-1.5 text-sm font-medium text-[var(--text-main)] hover:bg-gray-50 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="" disabled>{language === 'fr' ? 'Changer le statut...' : 'Change status...'}</option>
                    <option value="inbox">{t('database.board.inbox', language)}</option>
                    <option value="to_classify">{t('database.board.toClassify', language)}</option>
                    <option value="ready_clipping">{t('database.board.readyClipping', language)}</option>
                    <option value="processing">{t('database.board.processing', language)}</option>
                    <option value="review">{t('database.board.inReview', language)}</option>
                    <option value="approved">{t('database.board.approved', language)}</option>
                  </select>
                  <div className="absolute right-2 pointer-events-none text-[var(--text-muted)]">
                    <CheckSquareOffset size={16} />
                  </div>
                </div>

                <div className="relative flex items-center">
                  <select 
                    onChange={handleBulkClientChange}
                    value=""
                    className="appearance-none bg-transparent border border-[var(--border)] rounded-md pl-3 pr-8 py-1.5 text-sm font-medium text-[var(--text-main)] hover:bg-gray-50 focus:outline-none focus:border-blue-500 cursor-pointer max-w-[150px] truncate"
                  >
                    <option value="" disabled>{language === 'fr' ? 'Changer le client...' : 'Change client...'}</option>
                    {clients.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="absolute right-2 pointer-events-none text-[var(--text-muted)]">
                    <CheckSquareOffset size={16} />
                  </div>
                </div>

                <div className="relative flex items-center">
                  <select 
                    onChange={handleBulkCampaignChange}
                    value=""
                    className="appearance-none bg-transparent border border-[var(--border)] rounded-md pl-3 pr-8 py-1.5 text-sm font-medium text-[var(--text-main)] hover:bg-gray-50 focus:outline-none focus:border-blue-500 cursor-pointer max-w-[150px] truncate"
                  >
                    <option value="" disabled>{language === 'fr' ? 'Changer la campagne...' : 'Change campaign...'}</option>
                    {campaigns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="absolute right-2 pointer-events-none text-[var(--text-muted)]">
                    <CheckSquareOffset size={16} />
                  </div>
                </div>
                
                <button 
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <Trash size={16} />
                  {language === 'fr' ? 'Supprimer' : 'Delete'}
                </button>
              </div>
              
              <div className="w-px h-6 bg-[var(--border)]"></div>
              
              <button 
                onClick={() => setSelectedAssets([])}
                className="p-1.5 text-[var(--text-muted)] hover:bg-gray-100 rounded-full transition-colors"
                title={language === 'fr' ? 'Annuler la sélection' : 'Clear selection'}
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </ScrollReveal>

      <AddAssetModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
      <AssetDetailsModal
        asset={selectedAsset}
        isOpen={!!selectedAsset}
        onClose={() => setSelectedAssetId(null)}
      />
    </div>
  );
}

function TableView({ 
  assets, 
  onAssetClick, 
  language,
  selectedAssets,
  toggleAssetSelection,
  toggleAllSelection
}: { 
  assets: Asset[]; 
  onAssetClick: (asset: Asset) => void; 
  language: any;
  selectedAssets: string[];
  toggleAssetSelection: (id: string) => void;
  toggleAllSelection: () => void;
}) {
  const allSelected = assets.length > 0 && selectedAssets.length === assets.length;
  const someSelected = selectedAssets.length > 0 && selectedAssets.length < assets.length;

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg overflow-hidden flex-1 flex flex-col">
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-[var(--surface)] z-10">
            <tr>
              <th className="border-b border-[var(--border)] py-3 px-4 w-12">
                <input 
                  type="checkbox" 
                  checked={allSelected}
                  ref={input => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={toggleAllSelection}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>
              <th className="border-b border-[var(--border)] text-[var(--text-muted)] font-medium text-xs uppercase tracking-wider py-3 px-4">{t('database.table.title', language)}</th>
              <th className="border-b border-[var(--border)] text-[var(--text-muted)] font-medium text-xs uppercase tracking-wider py-3 px-4">{t('database.table.client', language)}</th>
              <th className="border-b border-[var(--border)] text-[var(--text-muted)] font-medium text-xs uppercase tracking-wider py-3 px-4">{t('database.table.campaign', language)}</th>
              <th className="border-b border-[var(--border)] text-[var(--text-muted)] font-medium text-xs uppercase tracking-wider py-3 px-4">{t('database.table.status', language)}</th>
              <th className="border-b border-[var(--border)] text-[var(--text-muted)] font-medium text-xs uppercase tracking-wider py-3 px-4">{t('database.table.duration', language)}</th>
              <th className="border-b border-[var(--border)] text-[var(--text-muted)] font-medium text-xs uppercase tracking-wider py-3 px-4">{t('database.table.added', language)}</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {assets.map((asset, index) => {
                const isSelected = selectedAssets.includes(asset.id);
                return (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { delay: index * 0.02 } }}
                    exit={{ opacity: 0 }}
                    key={asset.id} 
                    className={`transition-colors group ${isSelected ? 'bg-blue-50/50' : 'hover:bg-gray-50/50'}`}
                  >
                    <td className="border-b border-[var(--border)] py-3 px-4">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleAssetSelection(asset.id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="border-b border-[var(--border)] py-3 px-4 text-sm font-medium text-[var(--text-main)] cursor-pointer" onClick={() => onAssetClick(asset)}>{asset.title}</td>
                    <td className="border-b border-[var(--border)] py-3 px-4 text-sm text-[var(--text-muted)] cursor-pointer" onClick={() => onAssetClick(asset)}>{asset.client}</td>
                    <td className="border-b border-[var(--border)] py-3 px-4 text-sm text-[var(--text-muted)] cursor-pointer" onClick={() => onAssetClick(asset)}>{asset.campaign}</td>
                    <td className="border-b border-[var(--border)] py-3 px-4 cursor-pointer" onClick={() => onAssetClick(asset)}><Badge status={asset.status} /></td>
                    <td className="border-b border-[var(--border)] py-3 px-4 text-sm text-[var(--text-muted)] font-mono cursor-pointer" onClick={() => onAssetClick(asset)}>{asset.duration}</td>
                    <td className="border-b border-[var(--border)] py-3 px-4 text-sm text-[var(--text-muted)] cursor-pointer" onClick={() => onAssetClick(asset)}>
                      {new Date(asset.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BoardView({ 
  assets, 
  onAssetClick, 
  language,
  selectedAssets,
  toggleAssetSelection
}: { 
  assets: Asset[]; 
  onAssetClick: (asset: Asset) => void; 
  language: any;
  selectedAssets: string[];
  toggleAssetSelection: (id: string) => void;
}) {
  const { updateAsset, updateAssetOrder } = useAppStore();
  const columns = [
    { id: 'inbox', label: t('database.board.inbox', language) },
    { id: 'to_classify', label: t('database.board.toClassify', language) },
    { id: 'ready_clipping', label: t('database.board.readyClipping', language) },
    { id: 'processing', label: t('database.board.processing', language) },
    { id: 'review', label: t('database.board.inReview', language) },
    { id: 'approved', label: t('database.board.approved', language) },
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

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-6 overflow-x-auto pb-4 flex-1 h-full">
        {columns.map(col => {
          const columnAssets = assets
            .filter(a => a.status === col.id)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
          
          return (
            <Droppable droppableId={col.id} key={col.id}>
              {(provided) => (
                <div 
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="w-80 flex-shrink-0 flex flex-col h-full"
                >
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{col.label}</h3>
                    <span className="text-xs text-[var(--text-muted)] bg-gray-100 px-2 py-0.5 rounded-full">{columnAssets.length}</span>
                  </div>
                  <div className="flex flex-col gap-3 overflow-y-auto flex-1 pb-4">
                    {columnAssets.map((asset, index) => {
                      const isSelected = selectedAssets.includes(asset.id);
                      return (
                      <div key={asset.id} className="relative group">
                        <div className="absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => toggleAssetSelection(asset.id)}
                            className={`w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer ${isSelected ? 'opacity-100' : ''}`}
                          />
                        </div>
                        <Draggable draggableId={asset.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={(e) => {
                                // Don't trigger click if clicking checkbox
                                if ((e.target as HTMLElement).tagName.toLowerCase() !== 'input') {
                                  onAssetClick(asset);
                                }
                              }}
                              className={`bg-[var(--surface)] border ${isSelected ? 'border-blue-400 ring-1 ring-blue-400' : 'border-[var(--border)]'} rounded-lg p-4 pl-9 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] transition-all cursor-pointer`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <Badge status={asset.status} />
                                <span className="text-xs text-[var(--text-muted)] font-mono">{asset.duration}</span>
                              </div>
                              <h4 className="text-sm font-medium text-[var(--text-main)] mb-1 leading-snug">{asset.title}</h4>
                              <p className="text-xs text-[var(--text-muted)]">{asset.client}</p>
                            </div>
                          )}
                        </Draggable>
                      </div>
                    )})}
                    {provided.placeholder}
                    {columnAssets.length === 0 && (
                      <div className="border border-dashed border-[var(--border)] rounded-lg p-4 flex items-center justify-center h-24">
                        <span className="text-xs text-[var(--text-muted)]">{t('database.board.noAssets', language)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Droppable>
          );
        })}
      </div>
    </DragDropContext>
  );
}
