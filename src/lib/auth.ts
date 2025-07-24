'use client';

import { auth, firestore } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import type { User } from './types';

// This function now only seeds the initial SUPER ADMIN user if they don't exist in Firestore.
// It's safe to call and won't overwrite existing data unless the 'superadmin-main' user is missing.
export async function seedUsersToFirestore() {
  const adminId = 'superadmin-main'; // A consistent, unique ID for the main admin
  const userRef = doc(firestore, 'users', adminId);

  try {
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      // The user doesn't exist, so we create them.
      // NOTE: Firebase Auth user is created separately during the first login or a dedicated setup step.
      // This only seeds the Firestore user profile document.
      const initialAdmin: User = {
        id: adminId,
        username: 'admin',
        jabatan: 'SUPER ADMIN',
        location: 'BP PEKANBARU',
        nik: 'SA001',
        // Password is not stored in Firestore.
      };
      await setDoc(userRef, initialAdmin);
      console.log('Initial admin user seeded to Firestore.');
      return true;
    }
  } catch (error) {
    console.error('Error seeding users to Firestore:', error);
    return false;
  }
}

// Function to create both Firebase Auth user and Firestore user profile
export async function addUser(userData: Omit<User, 'id'> & { password?: string }): Promise<{ success: boolean; message?: string }> {
  if (!userData.password) {
    return { success: false, message: 'Password is required to create a new user.' };
  }

  // Create a pseudo-email for Firebase Auth, as NIK is the primary identifier
  const email = `${userData.nik}@farika.co.id`;

  try {
    // Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, userData.password);
    const user = userCredential.user;

    // Create user profile in Firestore
    const userForFirestore: User = {
      ...userData,
      id: user.uid, // Use the UID from Firebase Auth as the document ID
    };
    delete userForFirestore.password; // Ensure password is not saved in Firestore

    await setDoc(doc(firestore, 'users', user.uid), userForFirestore);
    return { success: true };
  } catch (error: any) {
    console.error('Error adding user:', error);
    // Provide a more user-friendly error message
    if (error.code === 'auth/email-already-in-use') {
      return { success: false, message: `User with NIK ${userData.nik} already exists.` };
    }
    return { success: false, message: error.message };
  }
}


export async function getUsers(): Promise<User[]> {
    const usersCollection = collection(firestore, 'users');
    const userSnapshot = await getDocs(usersCollection);
    const userList = userSnapshot.docs.map(doc => doc.data() as User);
    return userList;
}

export async function updateUser(userId: string, updatedData: Partial<Omit<User, 'password'>>): Promise<void> {
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, updatedData);
}

export async function deleteUser(userId: string): Promise<void> {
    // Note: This only deletes the Firestore record.
    // Deleting a Firebase Auth user is a protected admin action and typically done server-side.
    // For this client-side app, we'll just remove their data from our user list.
    await deleteDoc(doc(firestore, 'users', userId));
}

export async function changePassword(
  oldPasswordFromInput: string,
  newPasswordFromInput: string
): Promise<{ success: boolean, message: string }> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.email) {
    return { success: false, message: "No user is currently signed in." };
  }

  try {
    // Re-authenticate the user to confirm their identity
    const credential = EmailAuthProvider.credential(currentUser.email, oldPasswordFromInput);
    await reauthenticateWithCredential(currentUser, credential);
    
    // If re-authentication is successful, update the password
    await updatePassword(currentUser, newPasswordFromInput);
    return { success: true, message: "Password updated successfully." };
  } catch (error: any) {
    console.error("Password change error:", error);
    let message = "An unknown error occurred.";
    if (error.code === 'auth/wrong-password') {
      message = "Password lama salah.";
    } else if (error.code === 'auth/too-many-requests') {
      message = "Terlalu banyak percobaan. Coba lagi nanti.";
    }
    return { success: false, message };
  }
}
