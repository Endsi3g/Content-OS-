import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types';

export const useRole = (): Role => {
  const { dbUser } = useAuth();
  if (dbUser?.role) return dbUser.role;
  return 'viewer';
};
