import { Injectable, Inject } from '@nestjs/common';
import { getFirestore } from '../config/firebase.config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirestoreService {
  private _db: admin.firestore.Firestore | null = null;

  private get db(): admin.firestore.Firestore {
    if (!this._db) {
      this._db = getFirestore();
    }
    return this._db;
  }

  // Generic CRUD operations
  async create<T extends { id?: string }>(
    collection: string,
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<T> {
    const now = new Date();
    const docRef = this.db.collection(collection).doc();
    const newData = this.sanitizeForFirestore({
      ...data,
      id: docRef.id,
      createdAt: admin.firestore.Timestamp.fromDate(now),
      updatedAt: admin.firestore.Timestamp.fromDate(now),
    });
    await docRef.set(newData);
    return this.convertTimestamps(newData) as T;
  }

  async findById<T>(collection: string, id: string): Promise<T | null> {
    const doc = await this.db.collection(collection).doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return this.convertTimestamps({ id: doc.id, ...doc.data() }) as T;
  }

  async findAll<T>(
    collection: string,
    filters?: Array<{ field: string; operator: any; value: any }>,
    orderBy?: { field: string; direction: 'asc' | 'desc' },
    limit?: number,
    selectFields?: string[],
  ): Promise<T[]> {
    let query: admin.firestore.Query = this.db.collection(collection);

    if (filters) {
      filters.forEach((filter) => {
        // Validate that the value is not NaN for comparison operators
        if (
          (filter.operator === '>' ||
            filter.operator === '<' ||
            filter.operator === '>=' ||
            filter.operator === '<=') &&
          (isNaN(filter.value) || !isFinite(filter.value))
        ) {
          throw new Error(
            `Invalid filter value for field "${filter.field}": cannot use ${filter.operator} operator with NaN or infinite value`,
          );
        }
        query = query.where(filter.field, filter.operator, filter.value);
      });
    }

    if (orderBy) {
      query = query.orderBy(orderBy.field, orderBy.direction);
    }

    if (limit) {
      query = query.limit(limit);
    }

    if (selectFields && selectFields.length > 0) {
      query = query.select(...selectFields);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) =>
      this.convertTimestamps({ id: doc.id, ...doc.data() }),
    ) as T[];
  }

  async findPage<T>(
    collection: string,
    filters?: Array<{ field: string; operator: any; value: any }>,
    page: number = 1,
    limit: number = 20,
    orderBy?: { field: string; direction: 'asc' | 'desc' },
    selectFields?: string[],
  ): Promise<{ items: T[]; total: number }> {
    let query: admin.firestore.Query = this.db.collection(collection);

    if (filters) {
      filters.forEach((filter) => {
        if (
          (filter.operator === '>' ||
            filter.operator === '<' ||
            filter.operator === '>=' ||
            filter.operator === '<=') &&
          (isNaN(filter.value) || !isFinite(filter.value))
        ) {
          throw new Error(
            `Invalid filter value for field "${filter.field}": cannot use ${filter.operator} operator with NaN or infinite value`,
          );
        }
        query = query.where(filter.field, filter.operator, filter.value);
      });
    }

    const countSnapshot = await query.count().get();
    const total = countSnapshot.data().count;

    if (orderBy) {
      query = query.orderBy(orderBy.field, orderBy.direction);
    }

    if (selectFields && selectFields.length > 0) {
      query = query.select(...selectFields);
    }

    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 20;
    const offset = (safePage - 1) * safeLimit;

    const snapshot = await query.offset(offset).limit(safeLimit).get();
    const items = snapshot.docs.map((doc) =>
      this.convertTimestamps({ id: doc.id, ...doc.data() }),
    ) as T[];

    return { items, total };
  }

  async update<T>(
    collection: string,
    id: string,
    data: Partial<Omit<T, 'id' | 'createdAt'>>,
  ): Promise<T> {
    const docRef = this.db.collection(collection).doc(id);
    const updateData = this.sanitizeForFirestore({
      ...data,
      updatedAt: admin.firestore.Timestamp.fromDate(new Date()),
    });
    await docRef.update(updateData);
    return this.findById<T>(collection, id) as Promise<T>;
  }

  async delete(collection: string, id: string): Promise<void> {
    await this.db.collection(collection).doc(id).delete();
  }

  async findByField<T>(
    collection: string,
    field: string,
    value: any,
  ): Promise<T | null> {
    const snapshot = await this.db
      .collection(collection)
      .where(field, '==', value)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return this.convertTimestamps({ id: doc.id, ...doc.data() }) as T;
  }

  async findManyByField<T>(
    collection: string,
    field: string,
    value: any,
  ): Promise<T[]> {
    const snapshot = await this.db
      .collection(collection)
      .where(field, '==', value)
      .get();

    return snapshot.docs.map((doc) =>
      this.convertTimestamps({ id: doc.id, ...doc.data() }),
    ) as T[];
  }

  // Convert Firestore Timestamps to Date objects
  private convertTimestamps(data: any): any {
    if (!data) return data;

    const converted = { ...data };

    if (converted.createdAt && converted.createdAt.toDate) {
      converted.createdAt = converted.createdAt.toDate();
    }
    if (converted.updatedAt && converted.updatedAt.toDate) {
      converted.updatedAt = converted.updatedAt.toDate();
    }

    return converted;
  }

  private sanitizeForFirestore<T>(value: T): T {
    if (Array.isArray(value)) {
      return value
        .map((item) => this.sanitizeForFirestore(item))
        .filter((item) => item !== undefined) as T;
    }

    if (value && typeof value === 'object') {
      const result: Record<string, any> = {};
      Object.entries(value as Record<string, any>).forEach(([key, val]) => {
        if (val === undefined) {
          return;
        }
        result[key] = this.sanitizeForFirestore(val);
      });
      return result as T;
    }

    return value;
  }

  // Get collection reference for complex queries
  getCollection(collection: string) {
    return this.db.collection(collection);
  }
}

