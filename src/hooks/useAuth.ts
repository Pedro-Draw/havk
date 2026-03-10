// hooks/useAuth.ts
import { useAppStore } from '../store/useAppStore'
import { useNavigate } from 'react-router-dom'
import { auth, googleProvider, githubProvider } from '../lib/firebase'
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import toast from 'react-hot-toast'

export const useAuth = () => {
  const { user, isAuthenticated, setUser, logout: storeLogout } = useAppStore()
  const navigate = useNavigate()

  const buildUser = (firebaseUser: any) => ({
    id: firebaseUser.uid,
    name: firebaseUser.displayName || 'Usuário',
    email: firebaseUser.email,
    avatar: firebaseUser.photoURL,
    language: 'pt-BR',
    theme: 'system',
    createdAt: new Date().toISOString(),
  })

  // LOGIN EMAIL
  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)

      const userData = buildUser(result.user)

      setUser(userData)

      toast.success('Login realizado com sucesso')

      navigate('/', { replace: true })

      return true
    } catch (error: any) {
      console.error('Erro login:', error)

      switch (error.code) {
        case 'auth/user-not-found':
          toast.error('Usuário não encontrado')
          break

        case 'auth/wrong-password':
          toast.error('Senha incorreta')
          break

        case 'auth/invalid-credential':
          toast.error('Credenciais inválidas')
          break

        default:
          toast.error('Erro ao fazer login')
      }

      return false
    }
  }

  // GOOGLE
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider)

      const userData = buildUser(result.user)

      setUser(userData)

      toast.success('Login com Google realizado')

      navigate('/', { replace: true })
    } catch (error) {
      console.error('Erro Google login:', error)
      toast.error('Erro ao fazer login com Google')
    }
  }

  // GITHUB
  const signInWithGithub = async () => {
    try {
      const result = await signInWithPopup(auth, githubProvider)

      const userData = buildUser(result.user)

      setUser(userData)

      toast.success('Login com GitHub realizado')

      navigate('/', { replace: true })
    } catch (error) {
      console.error('Erro GitHub login:', error)
      toast.error('Erro ao fazer login com GitHub')
    }
  }

  // DEV LOGIN
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
    }

    setUser(devUser)

    toast.success('Entrou como desenvolvedor')

    navigate('/', { replace: true })
  }

  // LOGOUT
  const signOut = async () => {
    try {
      await firebaseSignOut(auth)

      storeLogout()

      toast.success('Logout realizado')

      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Erro logout:', error)
      toast.error('Erro ao fazer logout')
    }
  }

  const isDevMode = user?.isDev ?? false

  return {
    user,
    isAuthenticated,
    isDevMode,
    signIn,
    signInWithGoogle,
    signInWithGithub,
    signInAsDev,
    signOut,
  }
}