import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';

export const InviteFlow = ({ token, onComplete }: { token: string; onComplete: () => void }) => {
  const { user, refreshDbUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const res = await fetch(`/api/invites/${token}`);
        const data = await res.json();
        if (data.invite) {
          setInvite(data.invite);
        } else {
          setError(data.error || 'Invalid invite');
        }
      } catch (e) {
        setError('Failed to load invite');
      } finally {
        setLoading(false);
      }
    };
    fetchInvite();
  }, [token]);

  const acceptInvite = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/invites/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Welcome to ${data.workspace.name}!`);
        await refreshDbUser();
        // Clear the URL
        window.history.replaceState({}, document.title, window.location.pathname);
        onComplete();
      } else {
        setError(data.error || 'Failed to accept invite. Make sure you logged in with the invited email.');
        setLoading(false);
      }
    } catch (e) {
      setError('Network error while accepting invite');
      setLoading(false);
    }
  };

  const decline = () => {
     window.history.replaceState({}, document.title, window.location.pathname);
     onComplete();
  };

  if (loading && !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#111]">
        <Loader2 className="animate-spin text-white w-8 h-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#111]">
        <div className="bg-white/10 p-8 rounded-2xl max-w-md w-full text-center border border-white/20">
          <p className="text-red-400 mb-6 font-medium">{error}</p>
          <button onClick={decline} className="px-6 py-2 bg-white text-black rounded-full font-medium">
            Continue to App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#111] text-white">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/10 p-8 rounded-2xl max-w-md w-full border border-white/20 text-center"
      >
        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Users size={32} className="text-white/80" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">You've been invited!</h2>
        <p className="text-white/70 mb-8">
          {invite.invitedBy?.name || invite.invitedBy?.email} has invited you to join the workspace <strong className="text-white">"{invite.workspace.name}"</strong> as an <strong className="text-white capitalize">{invite.role}</strong>.
        </p>
        
        {user?.email !== invite.email && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
            Warning: You are logged in as {user?.email}, but this invite is for {invite.email}. Acceptance might fail.
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button 
            onClick={acceptInvite}
            disabled={loading}
            className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-white/90 transition-colors flex items-center justify-center"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Accept Invitation'}
          </button>
          <button 
            onClick={decline}
            disabled={loading}
            className="w-full bg-transparent border border-white/20 text-white font-medium py-3 rounded-xl hover:bg-white/10 transition-colors"
          >
            Decline
          </button>
        </div>
      </motion.div>
    </div>
  );
};
