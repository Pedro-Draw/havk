// hooks/useAuth.ts
import { useAppStore } from '../store/useAppStore'
import { useNavigate } from 'react-router-dom'
import { auth, googleProvider, githubProvider } from '../lib/firebase'
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
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
    avatar: firebaseUser.photoURL || null,
    language: 'pt-BR' as const,
    theme: 'system' as const,
    createdAt: firebaseUser.metadata?.creationTime || new Date().toISOString(),
  })

  // LOGIN EMAIL
  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      const userData = buildUser(result.user)
      await setUser(userData)
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
        case 'auth/too-many-requests':
          toast.error('Muitas tentativas. Tente novamente mais tarde.')
          break
        default:
          toast.error('Erro ao fazer login')
      }
      return false
    }
  }

  // CRIAR CONTA (SIGNUP)
  const createAccount = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)

      // Atualiza o nome no Firebase
      await updateProfile(result.user, { displayName: name })

      const userData = {
        id: result.user.uid,
        name: name.trim(),
        email: result.user.email || email,
        avatar: null,
        language: 'pt-BR' as const,
        theme: 'system' as const,
        createdAt: new Date().toISOString(),
      }

      await setUser(userData)
      toast.success('Conta criada com sucesso! Bem-vindo ao Havk.')
      navigate('/', { replace: true })
      return true
    } catch (error: any) {
      console.error('Erro ao criar conta:', error)
      switch (error.code) {
        case 'auth/email-already-in-use':
          toast.error('Este e-mail já está em uso. Tente fazer login.')
          break
        case 'auth/weak-password':
          toast.error('Senha muito fraca. Use pelo menos 6 caracteres.')
          break
        case 'auth/invalid-email':
          toast.error('E-mail inválido.')
          break
        default:
          toast.error('Erro ao criar conta. Tente novamente.')
      }
      return false
    }
  }

  // GOOGLE
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const userData = buildUser(result.user)
      await setUser(userData)
      toast.success('Login com Google realizado')
      navigate('/', { replace: true })
    } catch (error: any) {
      console.error('Erro Google login:', error)
      if (error.code !== 'auth/popup-closed-by-user') {
        toast.error('Erro ao fazer login com Google')
      }
    }
  }

  // GITHUB
  const signInWithGithub = async () => {
    try {
      const result = await signInWithPopup(auth, githubProvider)
      const userData = buildUser(result.user)
      await setUser(userData)
      toast.success('Login com GitHub realizado')
      navigate('/', { replace: true })
    } catch (error: any) {
      console.error('Erro GitHub login:', error)
      if (error.code !== 'auth/popup-closed-by-user') {
        toast.error('Erro ao fazer login com GitHub')
      }
    }
  }

  // PROVIDER GENÉRICO (para Signup)
  const signInWithProvider = async (provider: 'google' | 'github') => {
    try {
      const providerInstance = provider === 'google' ? googleProvider : githubProvider
      const result = await signInWithPopup(auth, providerInstance)
      const userData = buildUser(result.user)
      await setUser(userData)
      toast.success(`Login com ${provider === 'google' ? 'Google' : 'GitHub'} realizado`)
      navigate('/', { replace: true })
      return userData
    } catch (error: any) {
      console.error(`Erro ${provider} login:`, error)
      if (error.code !== 'auth/popup-closed-by-user') {
        toast.error(`Erro ao fazer login com ${provider === 'google' ? 'Google' : 'GitHub'}`)
      }
      return null
    }
  }

  // RECUPERAR SENHA
  const sendPasswordReset = async (email: string): Promise<boolean> => {
    try {
      await sendPasswordResetEmail(auth, email)
      toast.success('E-mail de recuperação enviado! Verifique sua caixa de entrada.')
      return true
    } catch (error: any) {
      console.error('Erro ao enviar e-mail de recuperação:', error)
      switch (error.code) {
        case 'auth/user-not-found':
          // Por segurança, não revelamos se o e-mail existe ou não
          toast.success('Se este e-mail estiver cadastrado, você receberá um link de recuperação.')
          return true
        case 'auth/invalid-email':
          toast.error('E-mail inválido.')
          break
        default:
          toast.error('Erro ao enviar e-mail de recuperação.')
      }
      return false
    }
  }

  // DEV LOGIN
  const signInAsDev = async () => {
    const devUser = {
      id: 'dev-001',
      name: 'Havk Developer',
      email: 'dev@havk.local',
      avatar: null,
      language: 'pt-BR' as const,
      theme: 'system' as const,
      createdAt: new Date().toISOString(),
      isDev: true,
    }
    await setUser(devUser)
    toast.success('Entrou como desenvolvedor')
    navigate('/', { replace: true })
  }

  // LOGOUT
  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      await storeLogout()
      toast.success('Logout realizado')
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Erro logout:', error)
      // Mesmo com erro no Firebase, faz logout local
      await storeLogout()
      navigate('/login', { replace: true })
    }
  }

  const isDevMode = user?.isDev ?? false

  return {
    user,
    isAuthenticated,
    isDevMode,
    signIn,
    createAccount,
    signInWithGoogle,
    signInWithGithub,
    signInWithProvider,
    signInAsDev,
    signOut,
    sendPasswordReset,
  }
}
