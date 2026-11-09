import { deleteApp, getApps, initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, signOut, updateProfile } from 'firebase/auth';
import { firebaseConfig } from './firebase';
import { mapAuthError } from './authSession';

const APP_NAME = 'havk-member-provision';

export async function createMemberAccount(name: string, email: string, password: string) {
  const existing = getApps().find((app) => app.name === APP_NAME);
  const secondary = existing || initializeApp(firebaseConfig, APP_NAME);
  const memberAuth = getAuth(secondary);
  try {
    const credential = await createUserWithEmailAndPassword(memberAuth, email, password);
    await updateProfile(credential.user, { displayName: name });
    await signOut(memberAuth);
    return { uid: credential.user.uid, alreadyExists: false };
  } catch (error: any) {
    if (error?.code === 'auth/email-already-in-use') {
      return { uid: null, alreadyExists: true };
    }
    throw new Error(mapAuthError(error));
  } finally {
    if (!existing) {
      try {
        await deleteApp(secondary);
      } catch {
        /* o app secundário só exists para não trocar a sessão de quem está criando */
      }
    }
  }
}
