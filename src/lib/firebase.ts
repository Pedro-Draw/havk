import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";

// 🔐 Config do seu projeto
const firebaseConfig = {
  apiKey: "AIzaSyDzUKr7R8cbx4wCV96mgm7_Z_OzLgwzRFw",
  authDomain: "havk-d1abf.firebaseapp.com",
  projectId: "havk-d1abf",
  storageBucket: "havk-d1abf.firebasestorage.app",
  messagingSenderId: "586489470790",
  appId: "1:586489470790:web:a8f4ced65b0075609a4f47",
  measurementId: "G-2ZYFF0M9XK",
};

// 🚀 Inicializa app
const app = initializeApp(firebaseConfig);

// 📊 Analytics (evita erro em SSR / localhost)
let analytics: ReturnType<typeof getAnalytics> | undefined;

isSupported().then((yes) => {
  if (yes) {
    analytics = getAnalytics(app);
  }
});

// 🔐 Auth
export const auth = getAuth(app);

// Mantém login salvo após refresh
setPersistence(auth, browserLocalPersistence);

// 🔵 Google Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

// ⚫ GitHub Provider
export const githubProvider = new GithubAuthProvider();

export default app;