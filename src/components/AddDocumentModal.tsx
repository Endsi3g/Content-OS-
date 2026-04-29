import { useState } from 'react';
import { X, UploadSimple } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store';
import { t } from '../i18n';
import { DocType } from '../types';

interface AddDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddDocumentModal({ isOpen, onClose }: AddDocumentModalProps) {
  const { language, addDoc } = useAppStore();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<DocType>('sop');
  const [content, setContent] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || (!content.trim() && !fileUrl.trim())) return;

    addDoc({
      title,
      type,
      content,
      fileUrl: fileUrl || undefined,
    });
    
    setTitle('');
    setType('sop');
    setContent('');
    setFileUrl('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[var(--bg)] border border-[var(--border)] rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
            <h2 className="text-lg font-semibold text-[var(--text-main)]">Add Document</h2>
            <button onClick={onClose} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-md hover:bg-[var(--hover-bg)] transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-main)] mb-1">Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--surface)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Document Title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-main)] mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as DocType)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--surface)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="sop">SOP</option>
                <option value="brief">Brief</option>
                <option value="template">Template</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-main)] mb-1">File URL (Optional)</label>
              <input
                type="url"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--surface)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/document.pdf"
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">Provide a URL for PDF or DOCX files.</p>
            </div>

            <div className="flex-1 flex flex-col">
              <label className="block text-sm font-medium text-[var(--text-main)] mb-1">Content (Markdown)</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full flex-1 min-h-[200px] px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--surface)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="# Document Heading&#10;&#10;Write your document content here using Markdown..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)] mt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-[var(--text-main)] bg-[var(--surface)] border border-[var(--border)] rounded-md hover:bg-[var(--hover-bg)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || (!content.trim() && !fileUrl.trim())}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Document
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
