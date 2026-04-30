import { useState, useEffect } from 'react';
import { FileText, MagnifyingGlass, Plus, BookBookmark, Notebook, FilePdf, FileDoc, CircleNotch as Spinner, PencilSimple, Trash } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import { KnowledgeDoc } from '../types';
import { useAppStore } from '../store';
import { t } from '../i18n';
import Markdown from 'react-markdown';
import { Document, Page, pdfjs } from 'react-pdf';
import mammoth from 'mammoth';
import { ScrollReveal } from '../components/ScrollReveal';
import { AddDocumentModal } from '../components/AddDocumentModal';
import { EditDocumentModal } from '../components/EditDocumentModal';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure pdfjs worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export function Knowledge() {
  const { docs, removeDoc, language } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(docs.length > 0 ? docs[0].id : null);
  const [numPages, setNumPages] = useState<number>();
  const [docxContent, setDocxContent] = useState<string>('');
  const [isLoadingDocx, setIsLoadingDocx] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const selectedDoc = docs.find(d => d.id === selectedDocId);
  
  const filteredDocs = docs.filter(doc => {
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || doc.type === filterType;

    return matchesSearch && matchesType;
  });

  // Update selectedDocId if filteredDocs changes and selectedDocId is no longer in it
  useEffect(() => {
    if (selectedDocId && !filteredDocs.find(d => d.id === selectedDocId)) {
      setSelectedDocId(filteredDocs[0]?.id || null);
    }
  }, [filteredDocs, selectedDocId]);

  useEffect(() => {
    if (selectedDoc?.fileUrl && selectedDoc.fileUrl.endsWith('.docx')) {
      setIsLoadingDocx(true);
      fetch(selectedDoc.fileUrl)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => mammoth.convertToHtml({ arrayBuffer }))
        .then(result => {
          setDocxContent(result.value);
          setIsLoadingDocx(false);
        })
        .catch(error => {
          console.error("Error loading docx:", error);
          setDocxContent('<p>Error loading document.</p>');
          setIsLoadingDocx(false);
        });
    } else {
      setDocxContent('');
    }
  }, [selectedDoc]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
  }

  const renderContent = () => {
    if (!selectedDoc) return null;

    if (selectedDoc.fileUrl) {
      if (selectedDoc.fileUrl.endsWith('.pdf')) {
        return (
          <div className="pdf-container flex flex-col items-center bg-gray-50 p-4 rounded-lg border border-[var(--border)]">
            <Document 
              file={selectedDoc.fileUrl} 
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<div className="flex items-center gap-2 p-8 text-[var(--text-muted)]"><Spinner className="animate-spin" /> Loading PDF...</div>}
              error={<div className="p-8 text-red-500">Failed to load PDF. Please check the URL.</div>}
            >
              {Array.from(new Array(numPages), (el, index) => (
                <Page 
                  key={`page_${index + 1}`} 
                  pageNumber={index + 1} 
                  className="mb-4 shadow-md"
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  width={Math.min(window.innerWidth - 400, 800)} // Responsive width
                />
              ))}
            </Document>
          </div>
        );
      } else if (selectedDoc.fileUrl.endsWith('.docx')) {
        return (
          <div className="docx-container bg-white p-8 rounded-lg border border-[var(--border)] shadow-sm min-h-[500px]">
            {isLoadingDocx ? (
              <div className="flex items-center justify-center h-full text-[var(--text-muted)] gap-2">
                <Spinner className="animate-spin" /> Loading DOCX...
              </div>
            ) : (
              <div 
                className="prose prose-sm max-w-none" 
                dangerouslySetInnerHTML={{ __html: docxContent }} 
              />
            )}
          </div>
        );
      }
    }

    // Fallback to Markdown rendering
    return (
      <div className="text-[var(--text-main)] leading-relaxed prose prose-sm max-w-none">
        <div className="markdown-body">
          <Markdown>{selectedDoc.content}</Markdown>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full gap-8">
      {/* Left Column: Directory */}
      <div className="w-80 flex flex-col h-full border-r border-[var(--border)] pr-8">
        <ScrollReveal delay={0}>
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-main)] mb-1">{t('knowledge.title', language)}</h1>
            <p className="text-sm text-[var(--text-muted)]">{t('knowledge.description', language)}</p>
          </div>
          
          <div className="flex flex-col gap-3 mb-6">
            <div className="relative">
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('knowledge.searchPlaceholder', language)} 
                className="w-full pl-9 pr-4 py-2 text-sm border border-[var(--border)] rounded-md bg-[var(--surface)] focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md bg-[var(--surface)] focus:outline-none focus:border-gray-400 transition-colors">
              <option value="all">{t('knowledge.types.all', language)}</option>
              <option value="sop">{t('knowledge.types.sop', language)}</option>
              <option value="brief">{t('knowledge.types.brief', language)}</option>
              <option value="template">{t('knowledge.types.template', language)}</option>
            </select>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1} className="flex-1 overflow-y-auto flex flex-col gap-1 pr-2">
          {filteredDocs.map(doc => (
            <button 
              key={doc.id}
              onClick={() => setSelectedDocId(doc.id)}
              className={`flex flex-col text-left p-3 rounded-lg transition-all ${
                selectedDoc?.id === doc.id 
                  ? 'bg-gray-100 text-[var(--text-main)]' 
                  : 'text-[var(--text-muted)] hover:bg-gray-50 hover:text-[var(--text-main)]'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {doc.fileUrl?.endsWith('.pdf') ? <FilePdf size={16} className="text-red-500" /> :
                 doc.fileUrl?.endsWith('.docx') ? <FileDoc size={16} className="text-blue-500" /> :
                 doc.type === 'sop' ? <BookBookmark size={16} /> :
                 doc.type === 'brief' ? <Notebook size={16} /> :
                 <FileText size={16} />}
                <span className="text-sm font-medium line-clamp-1">{doc.title}</span>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider pl-6 opacity-70">
                {doc.type} • {new Date(doc.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </button>
          ))}
        </ScrollReveal>
        
        <div className="pt-4 border-t border-[var(--border)] mt-4">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 w-full py-2 border border-[var(--border)] border-dashed rounded-md text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-gray-400 transition-colors active:scale-[0.98]"
          >
            <Plus size={16} />
            {t('knowledge.newDocument', language)}
          </button>
        </div>
      </div>

      {/* Right Column: Document Viewer */}
      <div className="flex-1 overflow-y-auto pb-12">
        <AnimatePresence mode="wait">
          {selectedDoc ? (
            <motion.div 
              key={selectedDoc.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-3xl mx-auto"
            >
              <div className="mb-8 pb-8 border-b border-[var(--border)]">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-gray-100 text-[var(--text-muted)] text-[10px] uppercase tracking-widest font-semibold rounded-md">
                      {selectedDoc.type}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] font-mono">
                      {t('knowledge.lastUpdated', language)} {new Date(selectedDoc.lastUpdated).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsEditModalOpen(true)}
                      className="p-1.5 text-[var(--text-muted)] hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Edit Document"
                    >
                      <PencilSimple size={18} />
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this document?')) {
                          removeDoc(selectedDoc.id);
                        }
                      }}
                      className="p-1.5 text-[var(--text-muted)] hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete Document"
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                </div>
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--text-main)] leading-tight">
                  {selectedDoc.title}
                </h1>
              </div>
              
              {renderContent()}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full text-center"
            >
              <FileText size={48} className="text-[var(--text-muted)] mb-4" weight="light" />
              <h2 className="text-xl font-medium mb-2">{t('knowledge.noDocSelected', language)}</h2>
              <p className="text-[var(--text-muted)] max-w-sm">
                {t('knowledge.selectDocDesc', language)}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AddDocumentModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
      {selectedDoc && (
        <EditDocumentModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          doc={selectedDoc}
        />
      )}
    </div>
  );
}
