
// src/lib/firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from 'firebase/database';


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBqJ8mUH8D-_nxyUCtYdYvKInbqgjGWFa8",
  authDomain: "mymanagerbp.firebaseapp.com",
  projectId: "mymanagerbp",
  storageBucket: "mymanagerbp.appspot.com",
  messagingSenderId: "160970644943",
  appId: "1:160970644943:web:1d121ec96612e8a41f86ba",
  measurementId: "G-8GT1SNNB7C",
  databaseURL: "https://mymanagerbp-default-rtdb.asia-southeast1.firebasedatabase.app"
};


// Initialize Firebase App
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Get Firebase Services
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);
const database = getDatabase(app);

// Enable Firestore offline persistence
try {
  enableIndexedDbPersistence(firestore);
} catch (err: any) {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore offline persistence failed: Multiple tabs open.');
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore offline persistence failed: Browser does not support it.');
  }
}


export { app, auth, firestore, storage, database };
