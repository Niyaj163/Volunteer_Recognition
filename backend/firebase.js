import admin from 'firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

let db;
let isMock = false;

// Mock Database Implementation for Offline/Local-First Run
class MockDocSnapshot {
  constructor(exists, data = null) {
    this.exists = exists;
    this._data = data;
  }
  data() {
    return this._data;
  }
}

class MockQuerySnapshot {
  constructor(docs) {
    this.docs = docs;
  }
  forEach(callback) {
    this.docs.forEach(callback);
  }
}

class MockDocumentReference {
  constructor(collectionData, docId, dbInstance) {
    this.collectionData = collectionData;
    this.id = docId;
    this.dbInstance = dbInstance;
  }

  async get() {
    const data = this.collectionData[this.id];
    return new MockDocSnapshot(!!data, data ? JSON.parse(JSON.stringify(data)) : null);
  }

  async set(data) {
    this.collectionData[this.id] = { ...data, id: this.id };
    this.dbInstance.saveData();
    return { writeTime: new Date() };
  }

  async update(data) {
    if (!this.collectionData[this.id]) {
      throw new Error(`Document ${this.id} does not exist.`);
    }
    
    const current = this.collectionData[this.id];
    for (const key in data) {
      const val = data[key];
      // Simulate FieldValue.increment
      if (val && typeof val === 'object' && val._increment !== undefined) {
        current[key] = (current[key] || 0) + val._increment;
      } else {
        current[key] = val;
      }
    }
    
    this.dbInstance.saveData();
    return { writeTime: new Date() };
  }
}

class MockCollectionReference {
  constructor(collectionData, collectionName, dbInstance) {
    this.collectionData = collectionData;
    this.name = collectionName;
    this.dbInstance = dbInstance;
    this.filters = [];
    this.orders = [];
    this.limitVal = null;
  }

  doc(id) {
    const docId = id || Math.random().toString(36).substring(2, 11);
    return new MockDocumentReference(this.collectionData, docId, this.dbInstance);
  }

  where(field, op, value) {
    const query = new MockCollectionReference(this.collectionData, this.name, this.dbInstance);
    query.filters = [...this.filters, { field, op, value }];
    return query;
  }

  orderBy(field, direction = 'asc') {
    const query = new MockCollectionReference(this.collectionData, this.name, this.dbInstance);
    query.filters = [...this.filters];
    query.orders = [...this.orders, { field, direction }];
    return query;
  }

  limit(num) {
    const query = new MockCollectionReference(this.collectionData, this.name, this.dbInstance);
    query.filters = [...this.filters];
    query.orders = [...this.orders];
    query.limitVal = num;
    return query;
  }

  async get() {
    let docs = Object.values(this.collectionData).map(doc => JSON.parse(JSON.stringify(doc)));

    // Apply filters
    for (const filter of this.filters) {
      docs = docs.filter(doc => {
        const val = doc[filter.field];
        if (filter.op === '==') return val === filter.value;
        if (filter.op === '>=') return val >= filter.value;
        if (filter.op === '<=') return val <= filter.value;
        return true;
      });
    }

    // Apply ordering
    for (const order of this.orders) {
      docs.sort((a, b) => {
        let valA = a[order.field];
        let valB = b[order.field];
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        
        if (valA < valB) return order.direction === 'asc' ? -1 : 1;
        if (valA > valB) return order.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Apply limit
    if (this.limitVal !== null) {
      docs = docs.slice(0, this.limitVal);
    }

    const docSnapshots = docs.map(doc => ({
      id: doc.id,
      data: () => doc
    }));

    return new MockQuerySnapshot(docSnapshots);
  }
}

class MockBatch {
  constructor(dbInstance) {
    this.dbInstance = dbInstance;
    this.operations = [];
  }

  update(docRef, data) {
    this.operations.push({ type: 'update', ref: docRef, data });
    return this;
  }

  set(docRef, data) {
    this.operations.push({ type: 'set', ref: docRef, data });
    return this;
  }

  async commit() {
    for (const op of this.operations) {
      if (op.type === 'update') {
        await op.ref.update(op.data);
      } else if (op.type === 'set') {
        await op.ref.set(op.data);
      }
    }
    this.dbInstance.saveData();
    return { writeTime: new Date() };
  }
}

class MockFirestoreDb {
  constructor() {
    this.filePath = path.resolve('./mock_db.json');
    this.store = {
      settings: {
        system: { id: 'system', executiveSecretCode: 'RUET2026', updatedAt: new Date() }
      },
      users: {
        '0123456': { id: '0123456', name: 'RUET Computing Society', role: 'admin', points: 0, createdAt: new Date() }
      },
      recognitions: {}
    };
    this.loadData();
  }

  loadData() {
    try {
      if (fs.existsSync(this.filePath)) {
        const fileContent = fs.readFileSync(this.filePath, 'utf8');
        this.store = JSON.parse(fileContent);
        console.log('Mock database loaded from local JSON file.');
      } else {
        this.saveData();
      }
    } catch (e) {
      console.error('Error loading mock database file, using empty memory store.', e);
    }
  }

  saveData() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.store, null, 2), 'utf8');
    } catch (e) {
      console.error('Error saving mock database file.', e);
    }
  }

  collection(name) {
    if (!this.store[name]) {
      this.store[name] = {};
      this.saveData();
    }
    return new MockCollectionReference(this.store[name], name, this);
  }

  batch() {
    return new MockBatch(this);
  }
}

let FieldValueInstance;

try {
  let credential;

  // Option A: Check if explicit service account file path is provided
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const serviceAccountPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    if (fs.existsSync(serviceAccountPath)) {
      const fileContent = fs.readFileSync(serviceAccountPath, 'utf8');
      const serviceAccount = JSON.parse(fileContent);
      credential = admin.cert(serviceAccount);
      console.log('Firebase initialized using local service account JSON file.');
    }
  }

  // Option B: Fallback to environment variables directly
  if (!credential) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey && projectId.trim() !== '') {
      privateKey = privateKey.trim();
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
      if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
        privateKey = privateKey.slice(1, -1);
      }
      privateKey = privateKey.replace(/\\n/g, '\n');
      credential = admin.cert({
        projectId,
        clientEmail,
        privateKey,
      });
      console.log('Firebase initialized using environment variables.');
    }
  }

  if (credential) {
    admin.initializeApp({
      credential,
    });
    db = getFirestore();
    FieldValueInstance = FieldValue;
    console.log('Firebase Firestore connection established successfully.');
  } else {
    // Fallback to local mock database
    isMock = true;
    db = new MockFirestoreDb();
    FieldValueInstance = {
      increment: (value) => ({ _increment: value })
    };
    console.log('\n=============================================================');
    console.log('WARNING: Firebase credentials not found.');
    console.log('Falling back to a PERSISTENT LOCAL DATABASE: mock_db.json');
    console.log('This allows testing the app out-of-the-box locally.');
    console.log('Configure credentials in backend/.env to connect to Firestore.');
    console.log('=============================================================\n');
  }
} catch (error) {
  console.error('Error initializing Firebase. Falling back to local mock database. Details:', error);
  isMock = true;
  db = new MockFirestoreDb();
  FieldValueInstance = {
    increment: (value) => ({ _increment: value })
  };
}

export { admin, db, FieldValueInstance as FieldValue };
