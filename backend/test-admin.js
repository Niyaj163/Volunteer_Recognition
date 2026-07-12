import admin from 'firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

try {
  admin.initializeApp();
  const dbInstance = getFirestore();
  console.log('getFirestore succeeded:', !!dbInstance);
  console.log('FieldValue.increment exists:', typeof FieldValue.increment);
} catch (e) {
  console.log('Error testing Firestore:', e.message);
}
