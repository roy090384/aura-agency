import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID (CRITICAL)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export async function loginWithGoogle() {
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });
  return signInWithPopup(auth, googleProvider);
}

export async function loginWithEmail(email: string, pass: string) {
  try {
    return await signInWithEmailAndPassword(auth, email, pass);
  } catch (err: any) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      return await createUserWithEmailAndPassword(auth, email, pass);
    }
    throw err;
  }
}

export async function loginAnonymouslyUser() {
  return signInAnonymously(auth);
}

export async function logoutUser() {
  return signOut(auth);
}

export function getAuthErrorDiagnostic(err: any, currentDomain: string = typeof window !== 'undefined' ? window.location.hostname : '') {
  const code = err?.code || '';
  const message = err?.message || String(err);

  if (code === 'auth/unauthorized-domain') {
    return {
      type: 'unauthorized-domain',
      title: 'Domain Not Authorized in Firebase',
      titleHe: 'הדומיין אינו מורשה ב-Firebase',
      message: `The current domain (${currentDomain}) is not in your Firebase project's Authorized Domains list.`,
      messageHe: `הדומיין הנוכחי (${currentDomain}) אינו ברשימת הדומיינים המורשים בפרויקט ה-Firebase שלך.`,
      fixSteps: [
        `Open Firebase Console > Authentication > Settings`,
        `Click on "Authorized domains" and select "Add domain"`,
        `Add "${currentDomain}"`,
        `Click "Done" and try signing in again.`
      ],
      fixStepsHe: [
        `היכנס ל-Firebase Console > Authentication > Settings`,
        `לחץ על "Authorized domains" ובחר "Add domain"`,
        `הוסף את הדומיין "${currentDomain}"`,
        `לחץ "Done" ונסה להתחבר מחדש.`
      ],
      consoleUrl: `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`
    };
  }

  if (code === 'auth/popup-blocked') {
    return {
      type: 'popup-blocked',
      title: 'Popup Blocked by Browser',
      titleHe: 'חלון הפופ-אפ נחסם בדפדפן',
      message: 'Your browser prevented the Google Sign-in popup from opening.',
      messageHe: 'הדפדפן שלך חסם את פתיחת חלון ההתחברות של Google.',
      fixSteps: [
        'Check your browser address bar for a blocked popup notification icon',
        'Click the icon and select "Always allow popups from this site"',
        'Click "Sign in with Google" again.'
      ],
      fixStepsHe: [
        'בדוק בשורת הכתובת של הדפדפן אם מופיע אייקון של חלון מוקפץ שנחסם',
        'לחץ על האייקון ובחר "אפשר תמיד חלונות קופצים מאתר זה"',
        'לחץ שוב על "התחבר עם Google".'
      ]
    };
  }

  if (code === 'auth/operation-not-allowed') {
    return {
      type: 'operation-not-allowed',
      title: 'Google Provider Disabled in Firebase',
      titleHe: 'ספק Google אינו מופעל ב-Firebase',
      message: `Google Sign-In is not enabled yet in Firebase project '${firebaseConfig.projectId}'.`,
      messageHe: `ספק Google עדיין לא הופעל בפרויקט '${firebaseConfig.projectId}'.`,
      fixSteps: [
        'Open Firebase Console > Authentication > Sign-in method',
        'Click on "Google" in the provider list',
        'Toggle "Enable", choose your project support email, and click "Save".'
      ],
      fixStepsHe: [
        'היכנס ל-Firebase Console > Authentication > Sign-in method',
        'לחץ על "Google" ברשימת הספקים',
        'הפעל את המתג "Enable", בחר אימייל תמיכה ולחץ "Save".'
      ],
      consoleUrl: `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`
    };
  }

  return {
    type: 'general',
    title: 'Sign In Failed',
    titleHe: 'ההתחברות נכשלה',
    message: message,
    messageHe: message,
    fixSteps: [
      'Verify network connectivity',
      'Or use Email / Password sign-in below to connect directly.'
    ],
    fixStepsHe: [
      'בדוק את חיבור הרשת',
      'או השתמש בהתחברות באמצעות אימייל וסיסמה למטה.'
    ]
  };
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

testConnection();
