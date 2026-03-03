import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
const firebaseClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const firebasePrivateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

if (!firebaseProjectId || !firebaseClientEmail || !firebasePrivateKey) {
  throw new Error(
    'Missing Firebase credentials. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in backend/.env',
  );
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: firebaseProjectId,
      clientEmail: firebaseClientEmail,
      privateKey: firebasePrivateKey,
    }),
  });
}

const db = admin.firestore();
const BATCH_LIMIT = 400;

type Counters = {
  scannedDocs: number;
  updatedDocs: number;
  updatedFields: number;
};

function toTimestamp(value: unknown): admin.firestore.Timestamp | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const timestampLike = value as {
    toDate?: () => Date;
    _seconds?: number;
    seconds?: number;
    _nanoseconds?: number;
    nanoseconds?: number;
  };

  if (typeof timestampLike.toDate === 'function') {
    return null;
  }

  const seconds = Number(timestampLike._seconds ?? timestampLike.seconds);
  const nanoseconds = Number(timestampLike._nanoseconds ?? timestampLike.nanoseconds ?? 0);

  if (!Number.isFinite(seconds) || !Number.isFinite(nanoseconds)) {
    return null;
  }

  const millis = Math.floor(seconds * 1000 + nanoseconds / 1_000_000);
  if (!Number.isFinite(millis)) {
    return null;
  }

  return admin.firestore.Timestamp.fromMillis(millis);
}

async function normalizeCollectionFields(
  collectionName: string,
  fields: string[],
): Promise<Counters> {
  const snapshot = await db.collection(collectionName).get();
  let batch = db.batch();
  let operations = 0;

  const counters: Counters = {
    scannedDocs: snapshot.size,
    updatedDocs: 0,
    updatedFields: 0,
  };

  for (const doc of snapshot.docs) {
    const updates: Record<string, admin.firestore.Timestamp> = {};

    for (const field of fields) {
      const timestamp = toTimestamp(doc.get(field));
      if (timestamp) {
        updates[field] = timestamp;
        counters.updatedFields += 1;
      }
    }

    if (Object.keys(updates).length > 0) {
      batch.update(doc.ref, updates);
      counters.updatedDocs += 1;
      operations += 1;
    }

    if (operations >= BATCH_LIMIT) {
      await batch.commit();
      batch = db.batch();
      operations = 0;
    }
  }

  if (operations > 0) {
    await batch.commit();
  }

  return counters;
}

async function normalizeOrderItemsCreatedAt(): Promise<Counters> {
  const ordersSnapshot = await db.collection('orders').get();
  let batch = db.batch();
  let operations = 0;

  const counters: Counters = {
    scannedDocs: 0,
    updatedDocs: 0,
    updatedFields: 0,
  };

  for (const orderDoc of ordersSnapshot.docs) {
    const itemsSnapshot = await orderDoc.ref.collection('items').get();
    counters.scannedDocs += itemsSnapshot.size;

    for (const itemDoc of itemsSnapshot.docs) {
      const createdAtTimestamp = toTimestamp(itemDoc.get('createdAt'));
      if (!createdAtTimestamp) {
        continue;
      }

      batch.update(itemDoc.ref, { createdAt: createdAtTimestamp });
      counters.updatedDocs += 1;
      counters.updatedFields += 1;
      operations += 1;

      if (operations >= BATCH_LIMIT) {
        await batch.commit();
        batch = db.batch();
        operations = 0;
      }
    }
  }

  if (operations > 0) {
    await batch.commit();
  }

  return counters;
}

async function main() {
  console.log('Starting Firestore timestamp normalization...');

  const targets: Array<{ collection: string; fields: string[] }> = [
    { collection: 'users', fields: ['createdAt', 'updatedAt'] },
    { collection: 'products', fields: ['createdAt', 'updatedAt'] },
    { collection: 'orders', fields: ['createdAt', 'updatedAt'] },
    { collection: 'blog', fields: ['createdAt', 'updatedAt'] },
    { collection: 'cart', fields: ['createdAt', 'updatedAt'] },
    { collection: 'wishlist', fields: ['createdAt', 'updatedAt'] },
  ];

  let totalScanned = 0;
  let totalUpdatedDocs = 0;
  let totalUpdatedFields = 0;

  for (const target of targets) {
    const result = await normalizeCollectionFields(target.collection, target.fields);
    totalScanned += result.scannedDocs;
    totalUpdatedDocs += result.updatedDocs;
    totalUpdatedFields += result.updatedFields;
    console.log(
      `${target.collection}: scanned=${result.scannedDocs}, updatedDocs=${result.updatedDocs}, updatedFields=${result.updatedFields}`,
    );
  }

  const orderItemsResult = await normalizeOrderItemsCreatedAt();
  totalScanned += orderItemsResult.scannedDocs;
  totalUpdatedDocs += orderItemsResult.updatedDocs;
  totalUpdatedFields += orderItemsResult.updatedFields;
  console.log(
    `orders/*/items: scanned=${orderItemsResult.scannedDocs}, updatedDocs=${orderItemsResult.updatedDocs}, updatedFields=${orderItemsResult.updatedFields}`,
  );

  console.log(
    `Done. scannedDocs=${totalScanned}, updatedDocs=${totalUpdatedDocs}, updatedFields=${totalUpdatedFields}`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Timestamp normalization failed:', error);
    process.exit(1);
  });
