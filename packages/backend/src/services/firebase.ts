import admin from 'firebase-admin';
import { logger } from '@/utils/logger';

class FirebaseService {
  private app: admin.app.App;
  private firestore: admin.firestore.Firestore;
  private auth: admin.auth.Auth;

  private serviceAccount = require('./firebase-service-account.json');

  constructor() {
    try {
      // Initialize Firebase Admin SDK
      this.app = admin.initializeApp({
        credential: admin.credential.cert(this.serviceAccount),
        projectId: process.env['FIREBASE_PROJECT_ID'] || 'gen-lang-client-0438922965',
      });

      this.firestore = admin.firestore();
      this.auth = admin.auth();

      logger.info('Firebase Admin SDK initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Firebase Admin SDK:', process.env['FIREBASE_PROJECT_ID']);
      throw error;
    }
  }

  // Firestore operations
  async createDocument(collection: string, data: any, docId?: string): Promise<string> {
    try {
      if (docId) {
        await this.firestore.collection(collection).doc(docId).set(data);
        return docId;
      } else {
        const docRef = await this.firestore.collection(collection).add(data);
        return docRef.id;
      }
    } catch (error) {
      logger.error(`Error creating document in ${collection}:`, error);
      throw error;
    }
  }

  async getDocument(collection: string, docId: string): Promise<any> {
    try {
      const doc = await this.firestore.collection(collection).doc(docId).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
      logger.error(`Error getting document ${docId} from ${collection}:`, error);
      throw error;
    }
  }

  async updateDocument(collection: string, docId: string, data: any): Promise<void> {
    try {
      await this.firestore
        .collection(collection)
        .doc(docId)
        .update({
          ...data,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
      logger.error(`Error updating document ${docId} in ${collection}:`, error);
      throw error;
    }
  }

  async deleteDocument(collection: string, docId: string): Promise<void> {
    try {
      await this.firestore.collection(collection).doc(docId).delete();
    } catch (error) {
      logger.error(`Error deleting document ${docId} from ${collection}:`, error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<any> {
    try {
      const userRecord = await this.auth.getUserByEmail(email);
      return {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
        emailVerified: userRecord.emailVerified,
        createdAt: userRecord.metadata.creationTime,
        lastSignInTime: userRecord.metadata.lastSignInTime,
      };
    } catch (error) {
      logger.error(`Error getting user by email ${email}:`, error);
      throw error;
    }
  }

  async verifyIdToken(idToken: string): Promise<any> {
    try {
      const decodedToken = await this.auth.verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      logger.error('Error verifying ID token:', error);
      throw error;
    }
  }

  async createCustomToken(uid: string, additionalClaims?: any): Promise<string> {
    try {
      return await this.auth.createCustomToken(uid, additionalClaims);
    } catch (error) {
      logger.error(`Error creating custom token for user ${uid}:`, error);
      throw error;
    }
  }

  // Batch operations
  async batchWrite(operations: any[]): Promise<void> {
    try {
      const batch = this.firestore.batch();

      operations.forEach(operation => {
        const { type, collection, docId, data } = operation;
        const docRef = this.firestore.collection(collection).doc(docId);

        switch (type) {
          case 'set':
            batch.set(docRef, data);
            break;
          case 'update':
            batch.update(docRef, data);
            break;
          case 'delete':
            batch.delete(docRef);
            break;
        }
      });

      await batch.commit();
    } catch (error) {
      logger.error('Error in batch write operation:', error);
      throw error;
    }
  }

  // Batch operations
  getBatch(): admin.firestore.WriteBatch {
    return this.firestore.batch();
  }

  getDocRef(collection: string, docId: string): admin.firestore.DocumentReference {
    return this.firestore.collection(collection).doc(docId);
  }

  // Advanced query operations
  async queryDocuments(
    collection: string,
    conditions: Array<{ field: string; operator: any; value: any }>,
    options?: {
      orderBy?: string;
      orderDirection?: 'asc' | 'desc';
      limit?: number;
      offset?: number;
    }
  ): Promise<any[]> {
    try {
      let query: admin.firestore.Query = this.firestore.collection(collection);

      // Apply conditions
      conditions.forEach(condition => {
        query = query.where(condition.field, condition.operator, condition.value);
      });

      // Apply ordering
      if (options?.orderBy) {
        query = query.orderBy(options.orderBy, options.orderDirection || 'asc');
      }

      // Apply limit
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      // Apply offset (using cursor-based pagination)
      if (options?.offset && options.offset > 0) {
        // For offset, we need to implement cursor-based pagination
        // This is a simplified version - in production, use cursor-based pagination
        const offsetQuery = query.limit(options.offset);
        const offsetSnapshot = await offsetQuery.get();
        const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
        if (lastDoc) {
          query = query.startAfter(lastDoc);
        }
      }

      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      logger.error(`Error querying documents from ${collection}:`, error);
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      // Try to list collections to verify Firestore connection
      await this.firestore.listCollections();
      return true;
    } catch (error) {
      logger.error('Firebase health check failed:', error);
      return false;
    }
  }
}

export const firebaseService = new FirebaseService();
export default firebaseService;
