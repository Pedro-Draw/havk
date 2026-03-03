import { useAppStore } from '../store/useAppStore';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider, githubProvider } from '../lib/firebase';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';

export const useAuth = () => {
  const { user, isAuthenticated, setUser, logout } = useAppStore();
  const navigate = useNavigate();

  // ---------------- EMAIL LOGIN REAL ----------------
  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);

      const firebaseUser = result.user;

      setUser({
        id: firebaseUser.uid,
        name: firebaseUser.displayName || 'User',
        email: firebaseUser.email,
        avatar: firebaseUser.photoURL,
        provider: 'email',
      });

      navigate('/');
      return true;
    } catch (error) {
      return false;
    }
  };

  // ---------------- GOOGLE REAL ----------------
  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;

    setUser({
      id: firebaseUser.uid,
      name: firebaseUser.displayName,
      email: firebaseUser.email,
      avatar: firebaseUser.photoURL,
      provider: 'google',
    });

    navigate('/');
  };

  // ---------------- GITHUB REAL ----------------
  const signInWithGithub = async () => {
    const result = await signInWithPopup(auth, githubProvider);
    const firebaseUser = result.user;

    setUser({
      id: firebaseUser.uid,
      name: firebaseUser.displayName,
      email: firebaseUser.email,
      avatar: firebaseUser.photoURL,
      provider: 'github',
    });

    navigate('/');
  };

  // ---------------- DEV FAKE ----------------
  const signInAsDev = async () => {
    setUser({
      id: 'dev-001',
      name: 'Havk Developer',
      email: 'dev@havk.local',
      avatar: null,
      provider: 'dev',
      isDev: true,
    });

    navigate('/');
  };

  // ---------------- LOGOUT ----------------
  const signOut = async () => {
    await firebaseSignOut(auth);
    logout();
    navigate('/login');
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