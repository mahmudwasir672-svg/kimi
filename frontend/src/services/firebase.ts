/**
 * SheetMail Sender - Firebase Configuration
 * =========================================
 * Firebase initialization and configuration
 */

import { initializeApp, FirebaseApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getFunctions, Functions } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { FIREBASE_CONFIG } from '@constants';

// ============================================================================
// FIREBASE INITIALIZATION
// ============================================================================

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let functions: Functions;

/**
 * Initialize Firebase services
 */
export function initializeFirebase(): { app: FirebaseApp; auth: Auth; firestore: Firestore; functions: Functions } {
  // Check if Firebase is already initialized
  if (getApps().length > 0) {
    app = getApp();
    auth = getAuth(app);
    firestore = getFirestore(app);
    functions = getFunctions(app);
    return { app, auth, firestore, functions };
  }
  
  // Validate configuration
  if (!FIREBASE_CONFIG.apiKey || !FIREBASE_CONFIG.projectId) {
    throw new Error(
      'Firebase configuration is incomplete. Please check your app.json configuration.'
    );
  }
  
  // Initialize Firebase App
  app = initializeApp(FIREBASE_CONFIG);
  
  // Initialize Auth with AsyncStorage persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
  
  // Initialize Firestore
  firestore = getFirestore(app);
  
  // Initialize Functions
  functions = getFunctions(app);
  
  console.log('Firebase initialized successfully');
  
  return { app, auth, firestore, functions };
}

/**
 * Get Firebase app instance
 */
export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return app;
}

/**
 * Get Firebase Auth instance
 */
export function getFirebaseAuth(): Auth {
  if (!auth) {
    throw new Error('Firebase Auth not initialized. Call initializeFirebase() first.');
  }
  return auth;
}

/**
 * Get Firestore instance
 */
export function getFirebaseFirestore(): Firestore {
  if (!firestore) {
    throw new Error('Firestore not initialized. Call initializeFirebase() first.');
  }
  return firestore;
}

/**
 * Get Functions instance
 */
export function getFirebaseFunctions(): Functions {
  if (!functions) {
    throw new Error('Firebase Functions not initialized. Call initializeFirebase() first.');
  }
  return functions;
}

// ============================================================================
// AUTH STATE LISTENER
// ============================================================================

import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { useAuthStore } from '@store';

/**
 * Set up auth state listener
 */
export function setupAuthListener(): () => void {
  const auth = getFirebaseAuth();
  
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    const { setUser, setLoading } = useAuthStore.getState();
    
    if (firebaseUser) {
      // User is signed in
      const user = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || '',
        photoUrl: firebaseUser.photoURL || undefined,
        hasGmailAccess: false, // Will be updated after checking tokens
        hasSheetsAccess: false,
        createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
        updatedAt: new Date(firebaseUser.metadata.lastSignInTime || Date.now()),
      };
      
      setUser(user);
      
      // Check Google OAuth permissions
      try {
        const { authApi } = await import('./api');
        const tokenStatus = await authApi.validateToken();
        
        if (tokenStatus.valid) {
          useAuthStore.getState().updateUser({
            hasGmailAccess: true,
            hasSheetsAccess: true,
          });
        }
      } catch (error) {
        console.log('Token validation failed:', error);
      }
    } else {
      // User is signed out
      setUser(null);
    }
    
    setLoading(false);
  });
  
  return unsubscribe;
}

// ============================================================================
// FIRESTORE LISTENERS
// ============================================================================

import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';

/**
 * Subscribe to user's campaigns
 */
export function subscribeToCampaigns(
  userId: string,
  onUpdate: (campaigns: DocumentData[]) => void,
  onError: (error: Error) => void
): () => void {
  const db = getFirebaseFirestore();
  
  const q = query(
    collection(db, 'campaigns'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  const unsubscribe = onSnapshot(
    q,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const campaigns = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      onUpdate(campaigns);
    },
    onError
  );
  
  return unsubscribe;
}

/**
 * Subscribe to campaign progress
 */
export function subscribeToCampaignProgress(
  campaignId: string,
  onUpdate: (progress: DocumentData) => void,
  onError: (error: Error) => void
): () => void {
  const db = getFirebaseFirestore();
  
  const unsubscribe = onSnapshot(
    collection(db, 'campaigns', campaignId, 'progress'),
    (snapshot: QuerySnapshot<DocumentData>) => {
      if (!snapshot.empty) {
        const progress = snapshot.docs[0].data();
        onUpdate(progress);
      }
    },
    onError
  );
  
  return unsubscribe;
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  initialize: initializeFirebase,
  getApp: getFirebaseApp,
  getAuth: getFirebaseAuth,
  getFirestore: getFirebaseFirestore,
  getFunctions: getFirebaseFunctions,
  setupAuthListener,
  subscribeToCampaigns,
  subscribeToCampaignProgress,
};
