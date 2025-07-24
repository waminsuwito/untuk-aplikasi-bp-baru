// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
// These variables should be in a .env.local file
const firebaseConfig = {
  apiKey: "AIzaSyA4yWJZ21J5WY0nIFRMMbLBwc9ZMBySLhA",
  authDomain: "mymanager-40720.firebaseapp.com",
  projectId: "mymanager-40720",
  storageBucket: "mymanager-40720.appspot.com",
  messagingSenderId: "172872646446",
  appId: "1:172872646446:web:3bf4bed1fc2ec675ba04bf",
  measurementId: "G-FC8BEMR30L",
  databaseURL: "https://mymanager-40720-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

const auth = getAuth(app);
const firestore = getFirestore(app);
const realtimeDb = getDatabase(app);

export { app, auth, firestore, realtimeDb };
