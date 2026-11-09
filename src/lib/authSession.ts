import type { User as FirebaseUser } from 'firebase/auth'
import { getAll } from '../db/indexedDB'
import { useAppStore } from '../store/useAppStore'

export const DEV_SESSION_KEY = 'havk-dev-session'

export function mapAuthError(error: { code?: string; message?: string } | null | undefined): string {
  switch (error?.code) {
    case 'auth/invalid-email':
      return 'E-mail inválido.'
    case 'auth/user-disabled':
      return 'Esta conta foi desativada.'
    case 'auth/user-not-found':
      return 'Não encontramos uma conta com esse e-mail.'
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'E-mail ou senha incorretos.'
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Aguarde um pouco e tente de novo.'
    case 'auth/network-request-failed':
      return 'Sem conexão com o servidor. Verifique sua internet.'
    case 'auth/operation-not-allowed':
      return 'O login por e-mail e senha não está habilitado neste projeto.'
    case 'auth/unauthorized-domain':
      return 'Este endereço não está autorizado no Firebase. Inclua o domínio em Authentication > Settings > Authorized domains.'
    case 'auth/popup-blocked':
      return 'O navegador bloqueou a janela de login. Permita pop-ups e tente de novo.'
    case 'auth/account-exists-with-different-credential':
      return 'Já existe uma conta com esse e-mail usando outro método de login.'
    case 'auth/email-already-in-use':
      return 'Este e-mail já está em uso. Tente entrar.'
    case 'auth/weak-password':
      return 'Senha muito fraca. Use pelo menos 6 caracteres.'
    case 'auth/requires-recent-login':
      return 'Por segurança, entre novamente antes de alterar a senha.'
    default:
      return 'Não foi possível concluir a autenticação. Tente novamente.'
  }
}

export async function applyFirebaseUser(fbUser: FirebaseUser) {
  let local: Record<string, any> | null = null

  try {
    const locals = await getAll<Record<string, any>>('user')
    local = locals.find((item) => item.id === fbUser.uid) || null
  } catch (err) {
    console.error('Falha ao ler perfil local:', err)
  }

  const current = useAppStore.getState().user
  const same = current?.id === fbUser.uid ? current : null

  await useAppStore.getState().setUser({
    id: fbUser.uid,
    name: same?.name || local?.name || fbUser.displayName || 'Usuário',
    email: fbUser.email || same?.email || local?.email || '',
    avatar: same?.avatar ?? local?.avatar ?? fbUser.photoURL ?? null,
    language: same?.language || local?.language || 'pt-BR',
    theme: same?.theme || local?.theme || 'system',
    createdAt: same?.createdAt || local?.createdAt || fbUser.metadata?.creationTime || new Date().toISOString(),
    username: same?.username || local?.username,
    bio: same?.bio || local?.bio,
    role: same?.role || local?.role,
    website: same?.website || local?.website,
    instagram: same?.instagram || local?.instagram,
    linkedin: same?.linkedin || local?.linkedin,
    github: same?.github || local?.github,
    isDev: false,
  })
}
