// hooks/useAuth.ts
import { useAppStore } from '../store/useAppStore';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider, githubProvider } from '../lib/firebase';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const { user, isAuthenticated, setUser, logout: storeLogout } = useAppStore();
  const navigate = useNavigate();

  // EMAIL + PASSWORD LOGIN
  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = result.user;

      const userData = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || 'Usuário',
        email: firebaseUser.email || email,
        avatar: firebaseUser.photoURL,
        language: 'pt-BR',
        theme: 'system',
        createdAt: new Date().toISOString(),
      };

      setUser(userData);
      toast.success('Login realizado com sucesso!');
      navigate('/', { replace: true });
      return true;
    } catch (error: any) {
      toast.error('E-mail ou senha incorretos');
      console.error('Erro no login com e-mail:', error);
      return false;
    }
  };

  // GOOGLE LOGIN
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      const userData = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName,
        email: firebaseUser.email,
        avatar: firebaseUser.photoURL,
        language: 'pt-BR',
        theme: 'system',
        createdAt: new Date().toISOString(),
      };

      setUser(userData);
      toast.success('Login com Google realizado!');
      navigate('/', { replace: true });
    } catch (error: any) {
      toast.error('Erro ao fazer login com Google');
      console.error('Erro Google login:', error);
    }
  };

  // GITHUB LOGIN
  const signInWithGithub = async () => {
    try {
      const result = await signInWithPopup(auth, githubProvider);
      const firebaseUser = result.user;

      const userData = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName,
        email: firebaseUser.email,
        avatar: firebaseUser.photoURL,
        language: 'pt-BR',
        theme: 'system',
        createdAt: new Date().toISOString(),
      };

      setUser(userData);
      toast.success('Login com GitHub realizado!');
      navigate('/', { replace: true });
    } catch (error: any) {
      toast.error('Erro ao fazer login com GitHub');
      console.error('Erro GitHub login:', error);
    }
  };

  // DEV MODE (FAKE LOGIN RÁPIDO)
  const signInAsDev = async () => {
    const devUser = {
      id: 'dev-001',
      name: 'Havk Developer',
      email: 'dev@havk.local',
      avatar: null,
      language: 'pt-BR',
      theme: 'system',
      createdAt: new Date().toISOString(),
      isDev: true,
    };

    setUser(devUser);
    toast.success('Entrou como desenvolvedor (modo teste)');
    navigate('/', { replace: true });
  };

  // LOGOUT
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      storeLogout();
      toast.success('Logout realizado');
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error('Erro ao fazer logout');
      console.error('Erro logout:', error);
    }
  };

  const isDevMode = user?.isDev ?? false;

  return {
    user,
    isAuthenticated,
    isDevMode,
    signIn,
    signInWithGoogle,
    signInWithGithub,
    signInAsDev,
    signOut,
  };
};