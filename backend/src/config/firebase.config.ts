import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';

let firebaseApp: admin.app.App;
let firestoreDb: admin.firestore.Firestore | null = null;

const loadServiceAccountFromFile = (): any => {
  try {
    // Try to load from common service account file locations
    const possiblePaths = [
      path.join(process.cwd(), 'zinoshop-8ec06-firebase-adminsdk-fbsvc-7892ffbff8.json'),
      path.join(process.cwd(), 'backend', 'zinoshop-8ec06-firebase-adminsdk-fbsvc-7892ffbff8.json'),
      path.join(__dirname, '..', '..', 'zinoshop-8ec06-firebase-adminsdk-fbsvc-7892ffbff8.json'),
      path.join(__dirname, '..', 'zinoshop-8ec06-firebase-adminsdk-fbsvc-7892ffbff8.json'),
    ];

    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(fileContent);
      }
    }
    return null;
  } catch (error) {
    console.error('Error loading service account file:', error);
    return null;
  }
};

export const initializeFirebase = (configService: ConfigService) => {
  if (!firebaseApp) {
    // Option 1: Use service account JSON from environment variable
    if (configService.get('FIREBASE_SERVICE_ACCOUNT')) {
      try {
        const serviceAccount = JSON.parse(
          configService.get('FIREBASE_SERVICE_ACCOUNT'),
        );
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log('Firebase initialized from FIREBASE_SERVICE_ACCOUNT environment variable');
        return firebaseApp;
      } catch (error) {
        console.error('Error parsing FIREBASE_SERVICE_ACCOUNT:', error);
      }
    }
    
    // Option 2: Use individual environment variables
    if (configService.get('FIREBASE_PROJECT_ID')) {
      try {
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId: configService.get('FIREBASE_PROJECT_ID'),
            clientEmail: configService.get('FIREBASE_CLIENT_EMAIL'),
            privateKey: configService.get('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
          }),
        });
        console.log('Firebase initialized from individual environment variables');
        return firebaseApp;
      } catch (error) {
        console.error('Error initializing Firebase from environment variables:', error);
      }
    }

    // Option 3: Try to load from service account JSON file
    const serviceAccount = loadServiceAccountFromFile();
    if (serviceAccount) {
      try {
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log('Firebase initialized from service account JSON file');
        return firebaseApp;
      } catch (error) {
        console.error('Error initializing Firebase from JSON file:', error);
      }
    }

    // Option 4: Use default credentials (for Firebase emulator or GCP)
    // Only if GOOGLE_APPLICATION_CREDENTIALS is set or running on GCP
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GCLOUD_PROJECT) {
      try {
        firebaseApp = admin.initializeApp();
        console.log('Firebase initialized using default credentials');
        return firebaseApp;
      } catch (error) {
        console.error('Error initializing Firebase with default credentials:', error);
      }
    }

    // If we get here, initialization failed
    throw new Error(
      'Firebase initialization failed. Please set FIREBASE_SERVICE_ACCOUNT, FIREBASE_PROJECT_ID, ' +
      'or place the service account JSON file in the backend directory. ' +
      'See FIREBASE_SETUP.md for instructions.'
    );
  }
  return firebaseApp;
};

export const getFirestore = () => {
  if (!firebaseApp) {
    // Fallback: Try to initialize using available methods
    try {
      // Option 1: Use service account JSON from environment variable
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log('Firebase initialized from FIREBASE_SERVICE_ACCOUNT (fallback)');
        if (!firestoreDb) {
          firestoreDb = admin.firestore();
          firestoreDb.settings({ ignoreUndefinedProperties: true });
        }
        return firestoreDb;
      }
      
      // Option 2: Use individual environment variables
      if (process.env.FIREBASE_PROJECT_ID) {
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
        });
        console.log('Firebase initialized from environment variables (fallback)');
        if (!firestoreDb) {
          firestoreDb = admin.firestore();
          firestoreDb.settings({ ignoreUndefinedProperties: true });
        }
        return firestoreDb;
      }

      // Option 3: Try to load from service account JSON file
      const serviceAccount = loadServiceAccountFromFile();
      if (serviceAccount) {
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log('Firebase initialized from JSON file (fallback)');
        if (!firestoreDb) {
          firestoreDb = admin.firestore();
          firestoreDb.settings({ ignoreUndefinedProperties: true });
        }
        return firestoreDb;
      }

      // Don't try default credentials as fallback - it will fail without proper setup
      throw new Error(
        'Firebase not initialized. Please ensure initializeFirebase() is called in main.ts ' +
        'or set FIREBASE_SERVICE_ACCOUNT/FIREBASE_PROJECT_ID environment variables. ' +
        'See FIREBASE_SETUP.md for setup instructions.'
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('Firebase not initialized')) {
        throw error;
      }
      throw new Error(
        `Firebase initialization failed: ${error instanceof Error ? error.message : String(error)}. ` +
        'Please check your Firebase configuration. See FIREBASE_SETUP.md for instructions.'
      );
    }
  }
  if (!firestoreDb) {
    firestoreDb = admin.firestore();
    firestoreDb.settings({ ignoreUndefinedProperties: true });
  }
  return firestoreDb;
};

export const getAuth = () => {
  if (!firebaseApp) {
    throw new Error('Firebase not initialized. Call initializeFirebase first.');
  }
  return admin.auth();
};

