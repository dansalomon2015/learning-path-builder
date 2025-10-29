import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from 'firebase/firestore';
import { toast } from 'react-hot-toast';

// Firebase configuration - requires environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Ensure auth is persisted locally across reloads
setPersistence(auth, browserLocalPersistence).catch(() => {
  // no-op: fallback to default persistence if setting fails
});

// Auth service
export class AuthService {
  static async signIn(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      toast.success('Connexion réussie !');
      return userCredential.user;
    } catch (error: any) {
      const errorMessage = this.getErrorMessage(error.code);
      toast.error(errorMessage);
      throw error;
    }
  }

  static async signUp(email: string, password: string, name: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Create user profile in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name,
        email,
        skillLevel: 'beginner',
        learningObjectives: [],
        preferences: {
          studyMode: 'mixed',
          difficultyAdjustment: 'automatic',
          sessionLength: 15,
          notifications: true,
          language: 'fr',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      toast.success('Compte créé avec succès !');
      return userCredential.user;
    } catch (error: any) {
      const errorMessage = this.getErrorMessage(error.code);
      toast.error(errorMessage);
      throw error;
    }
  }

  static async signOut() {
    try {
      await signOut(auth);
      toast.success('Déconnexion réussie !');
    } catch (error: any) {
      toast.error('Erreur lors de la déconnexion');
      throw error;
    }
  }

  static onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  static getCurrentUser() {
    return auth.currentUser;
  }

  static getIdToken() {
    return auth.currentUser?.getIdToken();
  }

  static async getUserProfile(userId: string) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  private static getErrorMessage(errorCode: string): string {
    const errorMessages: { [key: string]: string } = {
      'auth/user-not-found': 'Aucun compte trouvé avec cette adresse email.',
      'auth/wrong-password': 'Mot de passe incorrect.',
      'auth/email-already-in-use': 'Cette adresse email est déjà utilisée.',
      'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères.',
      'auth/invalid-email': 'Adresse email invalide.',
      'auth/too-many-requests': 'Trop de tentatives. Veuillez réessayer plus tard.',
      'auth/network-request-failed': 'Erreur de connexion. Vérifiez votre internet.',
    };
    return errorMessages[errorCode] || 'Une erreur est survenue.';
  }
}

// Firestore service
export class FirestoreService {
  static async getUserProfile(userId: string) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  static async updateUserProfile(userId: string, data: any) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      toast.success('Profil mis à jour !');
    } catch (error) {
      console.error('Error updating user profile:', error);
      toast.error('Erreur lors de la mise à jour du profil');
      throw error;
    }
  }

  static async getLearningPlans(userId: string) {
    try {
      const q = query(
        collection(db, 'learningPlans'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error getting learning plans:', error);
      throw error;
    }
  }

  static async getLearningPlan(planId: string) {
    try {
      const planDoc = await getDoc(doc(db, 'learningPlans', planId));
      if (planDoc.exists()) {
        return { id: planDoc.id, ...planDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting learning plan:', error);
      throw error;
    }
  }

  static async getStudySessions(userId: string, limitCount: number = 10) {
    try {
      const q = query(
        collection(db, 'studySessions'),
        where('userId', '==', userId),
        orderBy('startTime', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error getting study sessions:', error);
      throw error;
    }
  }

  static async getDocumentUploads(userId: string) {
    try {
      const q = query(
        collection(db, 'documentUploads'),
        where('userId', '==', userId),
        orderBy('processedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error getting document uploads:', error);
      throw error;
    }
  }
}

export default { AuthService, FirestoreService };
