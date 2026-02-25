import { useAppStore } from '../store/useAppStore';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const { user, isAuthenticated, login, logout, setUser } = useAppStore();
  const navigate = useNavigate();

  const signIn = async (email: string, password: string): Promise<boolean> => {
    const success = await login(email, password);
    if (success) {
      navigate('/');
    }
    return success;
  };

  const signOut = () => {
    logout();
    navigate('/login');
  };

  const isDevMode = user?.isDev ?? false;

  return {
    user,
    isAuthenticated,
    isDevMode,
    signIn,
    signOut,
    setUser,
  };
};