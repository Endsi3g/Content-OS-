import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SignInPage } from './ui/sign-in-flow-1';
import { PasswordResetModal } from './PasswordResetModal';

export const Login = ({ onBack }: { onBack?: (section?: string) => void }) => {
  const { signInWithGoogle } = useAuth();
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  return (
    <>
      <SignInPage
        onGoogleSignIn={signInWithGoogle}
        onNavigate={onBack}
      />
      <PasswordResetModal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} />
    </>
  );
};
