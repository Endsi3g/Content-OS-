import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types';

export const useRole = (): Role => {
  const { user, dbUser } = useAuth();
  
  if (dbUser && dbUser.role) {
     return dbUser.role;
  }
  
  // Fallback mock role based on email
  if (user?.email === 'quebecsaas@gmail.com' || user?.email === 'olivier@contentos.com') return 'admin';
  if (user?.email === 'alex@contentos.com') return 'editor';
  return 'viewer';
};
