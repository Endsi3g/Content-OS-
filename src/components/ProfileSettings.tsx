import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { toast } from 'sonner';

export const ProfileSettings = () => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let photoURL = user.photoURL;
      if (photo) {
        const storageRef = ref(storage, `profiles/${user.uid}/avatar`);
        await uploadBytes(storageRef, photo);
        photoURL = await getDownloadURL(storageRef);
      }
      await updateProfile(user, { displayName, photoURL });
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
      <h2 className="text-xl font-bold text-[var(--text-main)] mb-6">Profile Settings</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Display Name</label>
          <input 
            type="text" 
            value={displayName} 
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text-main)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Profile Photo</label>
          <input 
            type="file" 
            onChange={(e) => setPhoto(e.target.files?.[0] || null)}
            className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text-main)]"
          />
        </div>
        <button 
          onClick={handleUpdateProfile}
          disabled={loading}
          className="px-4 py-2 bg-[var(--text-main)] text-[var(--bg)] rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </div>
    </div>
  );
};
