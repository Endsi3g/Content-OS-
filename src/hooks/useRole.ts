import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types';

export const useRole = (): Role => {
  if (import.meta.env.VITE_MOCK_MODE === 'true') return 'admin';
  const { dbUser } = useAuth();
  if (dbUser?.role) return dbUser.role;
  return 'viewer';
};
