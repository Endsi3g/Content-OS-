import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  dbUser: any;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshDbUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  dbUser: null,
  loading: true,
  signInWithGoogle: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
  refreshDbUser: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refreshDbUser = async () => {
    if (user && user.email) {
       try {
         const data = await api.post<any>('/api/auth/sync', { 
           email: user.email, 
           name: user.displayName || undefined 
         });
         if (data.user) {
           setDbUser(data.user);
         }
       } catch (e) {
         console.error('Failed to sync auth with server:', e);
       }
    }
  };

  useEffect(() => {
    if (import.meta.env.VITE_MOCK_MODE === 'true') {
      const mockUser = { uid: 'mock-123', email: 'test@example.com', displayName: 'UI Tester' } as User;
      setUser(mockUser);
      setDbUser({ id: 'mock-123', email: 'test@example.com', name: 'UI Tester', workspaces: [{ id: 'ws-1', name: 'Mock Workspace', role: 'admin' }] });
      setLoading(false);
      return () => {};
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user && user.email) {
         try {
           const data = await api.post<any>('/api/auth/sync', { 
             email: user.email, 
             name: user.displayName || undefined 
           });
           if (data.user) {
             setDbUser(data.user);
           }
         } catch (e) {
           console.error('Failed to sync auth with server:', e);
         }
      } else {
         setDbUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider value={{ user, dbUser, loading, signInWithGoogle, logout, resetPassword, refreshDbUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
