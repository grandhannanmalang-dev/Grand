import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updatePassword } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "gen-lang-client-0998544411",
  appId: "1:489975264369:web:d50dc7d6ba5bf8ac9997d0",
  apiKey: "AIzaSyCR5z_UeDjkOmpbX5sr0NKKbd-H1IdMUEk",
  authDomain: "gen-lang-client-0998544411.firebaseapp.com",
  storageBucket: "gen-lang-client-0998544411.firebasestorage.app",
  messagingSenderId: "489975264369",
  measurementId: ""
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Secondary app for admin to create users without logging out
const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
export const secondaryAuth = getAuth(secondaryApp);

export const db = getFirestore(app, "ai-studio-manajemeniuranpe-1f5dda47-d94e-4831-bfb9-0c772d03c23d");

export { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updatePassword };

