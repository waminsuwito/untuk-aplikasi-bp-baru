
// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDCjnPt18xXTDk23jb36Rd238ldAvng8Dw",
  authDomain: "concretemix-ai.firebaseapp.com",
  projectId: "concretemix-ai",
  storageBucket: "concretemix-ai.firebasestorage.app",
  messagingSenderId: "521997201606",
  appId: "1:521997201606:web:90f6aca425e572a6f8a7c7"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

const auth = getAuth(app);
const firestore = getFirestore(app);
const realtimeDb = getDatabase(app);

export { app, auth, firestore, realtimeDb };
