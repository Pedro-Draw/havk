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
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  type AuthProvider,
} from 'firebase/auth'
import toast from 'react-hot-toast'
import { DEV_SESSION_KEY, applyFirebaseUser, mapAuthError } from '../lib/authSession'
import { lookupAccount } from '../lib/passwordReset'

export type PasswordResetResult = 'sent' | 'missing' | 'invalid' | 'failed'

const toastStyle = {
  background: '#18181b',
  color: '#fafafa',
  border: '1px solid #3f3f46',
  borderRadius: '16px',
  maxWidth: '420px',
}

export const useAuth = () => {
  const { user, isAuthenticated, setUser, logout: storeLogout } = useAppStore()
  const navigate = useNavigate()

  // LOGIN EMAIL
  const signIn = async (email: string, password: string, remember = true): Promise<boolean> => {
    const normalizedEmail = email.trim().toLowerCase()
    try {
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
      try {
        sessionStorage.removeItem(DEV_SESSION_KEY)
      } catch {
        /* ignora */
      }
      const result = await signInWithEmailAndPassword(auth, normalizedEmail, password)
      await applyFirebaseUser(result.user)
      navigate('/', { replace: true })
      return true
    } catch (error: any) {
      console.error('Erro login:', error)
      throw new Error(mapAuthError(error))
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
      throw new Error(mapAuthError(error))
    }
  }

  const finishProviderLogin = async (providerInstance: AuthProvider) => {
    try {
      sessionStorage.removeItem(DEV_SESSION_KEY)
    } catch {
      /* ignora */
    }
    try {
      const result = await signInWithPopup(auth, providerInstance)
      await applyFirebaseUser(result.user)
      navigate('/', { replace: true })
      return true
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        return false
      }
      console.error('Erro login provedor:', error)
      throw new Error(mapAuthError(error))
    }
  }

  // GOOGLE
  const signInWithGoogle = async () => finishProviderLogin(googleProvider)

  // GITHUB
  const signInWithGithub = async () => finishProviderLogin(githubProvider)

  // PROVIDER GENÉRICO (para Signup)
  const signInWithProvider = async (provider: 'google' | 'github') => {
    const ok = await finishProviderLogin(provider === 'google' ? googleProvider : githubProvider)
    return ok ? useAppStore.getState().user : null
  }

  // RECUPERAR SENHA
  const sendPasswordReset = async (email: string): Promise<PasswordResetResult> => {
    const normalized = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      toast.error('Digite um e-mail válido.', { style: toastStyle })
      return 'invalid'
    }

    const account = await lookupAccount(normalized)
    if (account === 'missing') {
      toast.error('Não existe uma conta com esse e-mail. Nenhum link foi enviado.', { style: toastStyle })
      return 'missing'
    }
    if (account === 'unknown') {
      toast.error('Não foi possível confirmar essa conta. Nenhum link foi enviado.', { style: toastStyle })
      return 'failed'
    }

    try {
      await sendPasswordResetEmail(auth, normalized)
      toast.success('Enviamos o link de recuperação para esse e-mail. Confira a caixa de entrada e o spam.', { style: toastStyle })
      return 'sent'
    } catch (error: any) {
      console.error('Erro ao enviar e-mail de recuperação:', error)
      if (error.code === 'auth/user-not-found') {
        toast.error('Não existe uma conta com esse e-mail. Nenhum link foi enviado.', { style: toastStyle })
        return 'missing'
      }
      if (error.code === 'auth/invalid-email') {
        toast.error('Digite um e-mail válido.', { style: toastStyle })
        return 'invalid'
      }
      toast.error('Não foi possível enviar o e-mail de recuperação. Tente novamente.', { style: toastStyle })
      return 'failed'
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
    try {
      sessionStorage.setItem(DEV_SESSION_KEY, JSON.stringify(devUser))
    } catch {
      /* ignora */
    }
    await setUser(devUser)
    toast.success('Entrou como desenvolvedor')
    navigate('/', { replace: true })
  }

  // LOGOUT
  const signOut = async () => {
    try {
      sessionStorage.removeItem(DEV_SESSION_KEY)
    } catch {
      /* ignora */
    }
    try {
      await firebaseSignOut(auth)
      await storeLogout()
      toast.success('Logout realizado')
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Erro logout:', error)
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
