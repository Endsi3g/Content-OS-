import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { Camera, User, Mail, Shield, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../lib/api';

export const Profile = () => {
  const { dbUser, refreshDbUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: dbUser?.name || '',
    bio: dbUser?.bio || '',
    avatarUrl: dbUser?.avatarUrl || ''
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit
        toast.error('Image size too large. Please use an image smaller than 1MB.');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatarUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.patch<any>('/api/users/profile', {
        email: dbUser.email,
        ...formData
      });
      
      if (data.success) {
        await refreshDbUser();
        setIsEditing(false);
        toast.success('Profile updated successfully');
      }
    } catch (e) {
      // api utility handled the toast error
      console.error('An error occurred during update:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!dbUser) return null;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[var(--bg)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xl"
      >
        {/* Header/Cover */}
        <div className="h-32 bg-gradient-to-r from-[var(--primary)] to-blue-600 opacity-20" />
        
        <div className="px-6 pb-8 -mt-16">
          <div className="flex flex-col sm:flex-row items-end gap-6 mb-8">
            <div className="relative group">
              <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-[var(--bg)] shadow-lg bg-[var(--hover-bg)]">
                {formData.avatarUrl || dbUser.avatarUrl ? (
                  <img src={formData.avatarUrl || dbUser.avatarUrl} alt={dbUser.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                    <User size={48} />
                  </div>
                )}
              </div>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera size={24} />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            
            <div className="flex-1 pb-2">
              <h1 className="text-3xl font-bold text-[var(--text-main)] mb-1">
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-transparent border-b border-[var(--border)] focus:border-[var(--primary)] outline-none w-full"
                    placeholder="Your Name"
                  />
                ) : (
                  dbUser.name
                )}
              </h1>
              <p className="text-[var(--text-muted)] flex items-center gap-2">
                <Mail size={14} />
                {dbUser.email}
              </p>
            </div>
            
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-2 bg-[var(--primary)] text-white rounded-xl hover:opacity-90 transition-opacity font-medium mb-2"
              >
                Edit Profile
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wider">
                    Bio
                  </label>
                  {isEditing ? (
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      className="w-full h-32 bg-[var(--hover-bg)] border border-[var(--border)] rounded-xl p-3 text-[var(--text-main)] focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all resize-none"
                      placeholder="Tell us a bit about yourself..."
                    />
                  ) : (
                    <p className="text-[var(--text-main)] bg-[var(--hover-bg)]/50 p-4 rounded-xl border border-[var(--border)] min-h-[100px] whitespace-pre-wrap">
                      {dbUser.bio || "No bio yet. Click edit to add one!"}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 p-4 bg-blue-500/5 rounded-xl border border-blue-500/10">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                    <Shield size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-main)] uppercase tracking-wider">Account Role</p>
                    <p className="text-[var(--text-muted)] capitalize">{dbUser.role}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wider">
                    Workspace Status
                  </label>
                  <div className="space-y-3">
                    {dbUser.workspaces?.map((ws: any) => (
                      <div key={ws.id} className="p-4 bg-[var(--hover-bg)] rounded-xl border border-[var(--border)] flex items-center justify-between">
                        <span className="font-medium text-[var(--text-main)]">{ws.workspace.name}</span>
                        <span className="text-xs px-2 py-1 bg-[var(--bg)] border border-[var(--border)] rounded-md text-[var(--text-muted)] uppercase">
                          {ws.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      name: dbUser.name,
                      bio: dbUser.bio || '',
                      avatarUrl: dbUser.avatarUrl || ''
                    });
                  }}
                  className="px-6 py-2 text-[var(--text-muted)] hover:text-[var(--text-main)] font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-2 bg-[var(--primary)] text-white rounded-xl hover:opacity-90 transition-opacity font-medium flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Save size={20} />
                  )}
                  Save Changes
                </button>
              </div>
            )}
          </form>
        </div>
      </motion.div>
    </div>
  );
};
