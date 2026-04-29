import { useState } from 'react';
import { X, UserPlus } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store';
import { t } from '../i18n';
import { Role } from '../types';

interface AddTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddTeamMemberModal({ isOpen, onClose }: AddTeamMemberModalProps) {
  const { language, addTeamMember } = useAppStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('viewer');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    addTeamMember({
      name: name.trim(),
      email: email.trim(),
      role,
    });
    
    setName('');
    setEmail('');
    setRole('viewer');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl w-full max-w-md overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
            <h2 className="text-lg font-semibold text-[var(--text-main)] flex items-center gap-2">
              <UserPlus size={20} />
              {language === 'fr' ? 'Ajouter un membre' : 'Add Team Member'}
            </h2>
            <button 
              onClick={onClose}
              className="p-1 rounded-md text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-main)] transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-main)] mb-1">
                {language === 'fr' ? 'Nom' : 'Name'}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-main)] focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-main)] mb-1">
                {language === 'fr' ? 'Email' : 'Email'}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-main)] focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-main)] mb-1">
                {language === 'fr' ? 'Rôle' : 'Role'}
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-main)] focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)] mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
              >
                {language === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[var(--text-main)] text-[var(--surface)] rounded-lg text-sm font-medium hover:bg-[var(--text-muted)] transition-colors"
              >
                {language === 'fr' ? 'Ajouter' : 'Add'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
