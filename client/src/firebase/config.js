// src/firebase/config.js - Configuración Firebase CONDINEA
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyBQE-wPLE5ubXRKfL7uCCmiFFMqKcbfjTY",
  authDomain: "la-fabrica-1.firebaseapp.com",
  projectId: "la-fabrica-1",
  storageBucket: "la-fabrica-1.firebasestorage.app",
  messagingSenderId: "323595670197",
  appId: "1:323595670197:web:8875f0999e72ff6e1f64fc",
  measurementId: "G-JP2R9GNPXR"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, 'us-central1');

export default app;