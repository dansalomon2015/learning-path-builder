import admin from 'firebase-admin';
import { logger } from '@/utils/logger';

class FirebaseService {
  private readonly firestore: admin.firestore.Firestore;
  readonly auth: admin.auth.Auth;

  private readonly serviceAccount: Record<string, unknown>;

  constructor() {
    try {
      // Load service account from file
      let serviceAccountData: Record<string, unknown>;
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
        serviceAccountData = require('./firebase-service-account.json') as Record<string, unknown>;
      } catch {
        // If file doesn't exist, use environment variables or empty object
        serviceAccountData = {};
      }
      this.serviceAccount = serviceAccountData;

      const projectIdEnv: string | undefined = process.env['FIREBASE_PROJECT_ID'];
      const projectId: string =
        projectIdEnv != null && projectIdEnv !== '' ? projectIdEnv : 'gen-lang-client-0438922965';

      // Initialize Firebase Admin SDK
      admin.initializeApp({
        credential: admin.credential.cert(this.serviceAccount as admin.ServiceAccount),
        projectId,
      });

      this.firestore = admin.firestore();
      this.auth = admin.auth();

      logger.info('Firebase Admin SDK initialized successfully');
    } catch (error: unknown) {
      logger.error('Failed to initialize Firebase Admin SDK:', process.env['FIREBASE_PROJECT_ID']);
      throw error;
    }
  }

  // Firestore operations
  async createDocument(
    collection: string,
    data: Record<string, unknown>,
    docId?: string
  ): Promise<string> {
    try {
      if (docId != null && docId !== '') {
        await this.firestore.collection(collection).doc(docId).set(data);
        return docId;
      } else {
        const docRef = await this.firestore.collection(collection).add(data);
        return docRef.id;
      }
    } catch (error: unknown) {
      logger.error(`Error creating document in ${collection}:`, error);
      throw error;
    }
  }

  async getDocument(collection: string, docId: string): Promise<Record<string, unknown> | null> {
    try {
      const doc = await this.firestore.collection(collection).doc(docId).get();
      return doc.exists ? { id: doc.id, ...(doc.data() ?? {}) } : null;
    } catch (error: unknown) {
      logger.error(`Error getting document ${docId} from ${collection}:`, error);
      throw error;
    }
  }

  async updateDocument(
    collection: string,
    docId: string,
    data: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.firestore
        .collection(collection)
        .doc(docId)
        .update({
          ...data,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (error: unknown) {
      logger.error(`Error updating document ${docId} in ${collection}:`, error);
      throw error;
    }
  }

  async deleteDocument(collection: string, docId: string): Promise<void> {
    try {
      await this.firestore.collection(collection).doc(docId).delete();
    } catch (error: unknown) {
      logger.error(`Error deleting document ${docId} from ${collection}:`, error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<Record<string, unknown>> {
    try {
      const userRecord = await this.auth.getUserByEmail(email);
      return {
        uid: userRecord.uid,
        email: userRecord.email ?? undefined,
        displayName: userRecord.displayName ?? undefined,
        photoURL: userRecord.photoURL ?? undefined,
        emailVerified: userRecord.emailVerified,
        createdAt: userRecord.metadata.creationTime,
        lastSignInTime: userRecord.metadata.lastSignInTime,
      };
    } catch (error: unknown) {
      logger.error(`Error getting user by email ${email}:`, error);
      throw error;
    }
  }

  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    try {
      const decodedToken = await this.auth.verifyIdToken(idToken);
      return decodedToken;
    } catch (error: unknown) {
      logger.error('Error verifying ID token:', error);
      throw error;
    }
  }

  async createCustomToken(
    uid: string,
    additionalClaims?: Record<string, unknown>
  ): Promise<string> {
    try {
      return await this.auth.createCustomToken(uid, additionalClaims);
    } catch (error: unknown) {
      logger.error(`Error creating custom token for user ${uid}:`, error);
      throw error;
    }
  }

  // Batch operations
  async batchWrite(
    operations: Array<{
      type: 'set' | 'update' | 'delete';
      collection: string;
      docId: string;
      data?: Record<string, unknown>;
    }>
  ): Promise<void> {
    try {
      const batch = this.firestore.batch();

      operations.forEach(
        (operation: {
          type: 'set' | 'update' | 'delete';
          collection: string;
          docId: string;
          data?: Record<string, unknown>;
        }): void => {
          const type: 'set' | 'update' | 'delete' = operation.type;
          const collection: string = operation.collection;
          const docId: string = operation.docId;
          const data: Record<string, unknown> | undefined = operation.data;
          const docRef = this.firestore.collection(collection).doc(docId);

          switch (type) {
            case 'set':
              if (data != null) {
                batch.set(docRef, data);
              }
              break;
            case 'update':
              if (data != null) {
                batch.update(docRef, data);
              }
              break;
            case 'delete':
              batch.delete(docRef);
              break;
          }
        }
      );

      await batch.commit();
    } catch (error: unknown) {
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
    conditions: Array<{
      field: string;
      operator: admin.firestore.WhereFilterOp;
      value: unknown;
    }>,
    options?: {
      orderBy?: string;
      orderDirection?: 'asc' | 'desc';
      limit?: number;
      offset?: number;
    }
  ): Promise<Array<Record<string, unknown>>> {
    try {
      let query: admin.firestore.Query = this.firestore.collection(collection);

      // Apply conditions
      conditions.forEach(
        (condition: {
          field: string;
          operator: admin.firestore.WhereFilterOp;
          value: unknown;
        }): void => {
          query = query.where(condition.field, condition.operator, condition.value);
        }
      );

      // Apply ordering
      if (options?.orderBy != null && options.orderBy !== '') {
        query = query.orderBy(options.orderBy, options.orderDirection ?? 'asc');
      }

      // Apply limit
      const limitValue: number | undefined = options?.limit;
      if (limitValue != null && limitValue > 0) {
        query = query.limit(limitValue);
      }

      // Apply offset (using cursor-based pagination)
      const offsetValue: number | undefined = options?.offset;
      if (offsetValue != null && offsetValue > 0) {
        // For offset, we need to implement cursor-based pagination
        // This is a simplified version - in production, use cursor-based pagination
        const offsetQuery = query.limit(offsetValue);
        const offsetSnapshot = await offsetQuery.get();
        const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
        if (lastDoc != null) {
          query = query.startAfter(lastDoc);
        }
      }

      const snapshot = await query.get();
      return snapshot.docs.map(
        (doc: admin.firestore.QueryDocumentSnapshot): Record<string, unknown> => {
          const docData: admin.firestore.DocumentData = doc.data();
          return {
            id: doc.id,
            ...docData,
          };
        }
      );
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      logger.error('Firebase health check failed:', error);
      return false;
    }
  }
}

export const firebaseService = new FirebaseService();
export default firebaseService;
