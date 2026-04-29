import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash } from '@phosphor-icons/react';
import { useAppStore } from '../store';
import { CustomRole } from '../types';

export function ManageRolesModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { customRoles, addCustomRole, updateCustomRole, removeCustomRole } = useAppStore();
  const [newRoleName, setNewRoleName] = useState('');

  const views = ['overview', 'analytics', 'inbox', 'database', 'workflow', 'review', 'aiCoach', 'knowledge', 'scripts', 'team', 'changelog', 'settings'];

  const handleAdd = () => {
    if (!newRoleName.trim()) return;
    addCustomRole({
      name: newRoleName.trim(),
      allowedViews: ['overview']
    });
    setNewRoleName('');
  };

  const handleToggleView = (role: CustomRole, view: string) => {
    const updatedViews = role.allowedViews.includes(view)
      ? role.allowedViews.filter(v => v !== view)
      : [...role.allowedViews, view];
    updateCustomRole(role.id, { allowedViews: updatedViews });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl flex flex-col max-h-[80vh]"
        >
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--text-main)]">Manage Roles</h2>
            <button onClick={onClose} className="p-1 hover:bg-[var(--hover-bg)] rounded-md text-[var(--text-muted)]">
              <X size={20} />
            </button>
          </div>

          <div className="p-4 border-b border-[var(--border)] flex gap-2">
            <input
              type="text"
              className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--text-main)] text-[var(--text-main)]"
              placeholder="New Role Name"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <button onClick={handleAdd} className="px-4 py-2 bg-[var(--text-main)] text-[var(--bg)] rounded-lg text-sm font-medium hover:opacity-90 flex items-center gap-2">
              <Plus size={16} /> Add Role
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {customRoles.map(role => (
              <div key={role.id} className="border border-[var(--border)] rounded-lg p-4 bg-[var(--bg)]">
                <div className="flex items-center justify-between mb-3 border-b border-[var(--border)] pb-2">
                  <h3 className="font-medium text-[var(--text-main)] capitalize">{role.name}</h3>
                  {['admin', 'editor', 'viewer'].includes(role.id) ? (
                     <span className="text-xs bg-[var(--hover-bg)] px-2 py-1 rounded text-[var(--text-muted)]">System Role</span>
                  ) : (
                    <button onClick={() => removeCustomRole(role.id)} className="text-red-500 p-1 hover:bg-red-50 rounded">
                      <Trash size={16} />
                    </button>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wide">Allowed Access</p>
                  <div className="flex flex-wrap gap-2">
                    {views.map(view => (
                      <label key={view} className={`cursor-pointer border px-3 py-1.5 rounded-md text-sm transition-colors text-capitalize flex items-center gap-2 ${
                        role.allowedViews.includes(view) 
                          ? 'bg-[var(--text-main)] text-[var(--bg)] border-[var(--text-main)]' 
                          : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--text-main)]'
                      }`}>
                        <input 
                          type="checkbox" 
                          className="hidden" 
                          checked={role.allowedViews.includes(view)}
                          onChange={() => handleToggleView(role, view)}
                          disabled={['admin'].includes(role.id)}
                        />
                        <span className="capitalize">{view}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
