
'use client';

import { auth, firestore } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updatePassword, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import type { User } from './types';

// Helper to create a fake email from NIK/Username
const createEmail = (identifier: string) => `${identifier.replace(/\s+/g, '_').toLowerCase()}@database.com`;

// Pre-defined superadmin details
const SUPER_ADMIN_DEFAULTS = {
  id: 'superadmin-main',
  username: 'SUPERADMIN',
  nik: 'SUPERADMIN',
  jabatan: 'SUPER ADMIN' as const,
  location: 'BP PEKANBARU' as const,
};

// Function to get all users from Firestore
export async function getUsers(): Promise<User[]> {
  try {
    const usersCollection = collection(firestore, 'users');
    const userSnapshot = await getDocs(usersCollection);
    const userList = userSnapshot.docs.map(doc => doc.data() as User);
    
    // Ensure SUPERADMIN always exists in the list for management purposes
    const superAdminExists = userList.some(u => u.id === SUPER_ADMIN_DEFAULTS.id);
    if (!superAdminExists) {
      userList.push(SUPER_ADMIN_DEFAULTS);
    }
    
    return userList;
  } catch (error) {
    console.error("Error getting users from Firestore:", error);
    // Return a default list with just the superadmin on error
    return [SUPER_ADMIN_DEFAULTS];
  }
}

// Function to create both Firebase Auth user and Firestore user profile
export async function addUser(userData: Omit<User, 'id'>): Promise<{ success: boolean; message?: string }> {
  try {
    const email = createEmail(userData.nik || userData.username);
    const userCredential = await createUserWithEmailAndPassword(auth, email, userData.password!);
    const user = userCredential.user;

    const { password, ...userDataToSave } = userData;

    await setDoc(doc(firestore, "users", user.uid), {
      ...userDataToSave,
      id: user.uid,
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error adding user:", error);
    return { success: false, message: error.message };
  }
}

export async function updateUser(userId: string, updatedData: Partial<User>): Promise<void> {
  const userRef = doc(firestore, 'users', userId);
  await updateDoc(userRef, updatedData);
}

export async function deleteUser(userId: string): Promise<void> {
  await deleteDoc(doc(firestore, 'users', userId));
  console.warn(`User with ID ${userId} deleted from Firestore, but not from Firebase Auth.`);
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<{ success: boolean, message: string }> {
  const user = auth.currentUser;
  if (!user || !user.email) {
    return { success: false, message: "No user is currently signed in or user has no email." };
  }

  try {
    const email = user.email;
    await signInWithEmailAndPassword(auth, email, oldPassword);
    await updatePassword(user, newPassword);
    return { success: true, message: "Password updated successfully." };
  } catch (error: any) {
    console.error("Password change error:", error);
    let message = "An unknown error occurred.";
    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      message = "Password lama salah.";
    }
    return { success: false, message };
  }
}

// Function to handle login with either NIK or username
export async function loginWithIdentifier(identifier: string, passwordFromInput: string): Promise<FirebaseUser> {
    const email = createEmail(identifier);

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, passwordFromInput);
        return userCredential.user;
    } catch (error: any) {
        // If user does not exist in Auth, AND it's the SUPERADMIN, create them.
        if (error.code === 'auth/user-not-found' && identifier.toUpperCase() === 'SUPERADMIN') {
            console.log("SUPERADMIN auth user not found, attempting to create...");
            try {
                const newUserCredential = await createUserWithEmailAndPassword(auth, email, passwordFromInput);
                // Also ensure the Firestore doc for SUPERADMIN exists.
                await setDoc(doc(firestore, 'users', 'superadmin-main'), SUPER_ADMIN_DEFAULTS);
                console.log("SUPERADMIN user created successfully.");
                return newUserCredential.user;
            } catch (createError: any) {
                console.error("Failed to create SUPERADMIN user:", createError);
                throw new Error(`Gagal membuat pengguna SUPERADMIN: ${createError.message}`);
            }
        } else if (error.code === 'auth/invalid-credential') {
            throw new Error('Kombinasi Username dan Password salah.');
        } else {
            console.error("Login error:", error);
            throw new Error('Terjadi kesalahan saat login.');
        }
    }
}
