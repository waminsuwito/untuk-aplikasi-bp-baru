
'use client';

import { auth, firestore } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updatePassword, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, updateDoc, deleteDoc, query, where, limit } from 'firebase/firestore';
import type { User } from './types';

// Helper to create a fake email from NIK/Username
const createEmail = (identifier: string) => `${identifier.replace(/\s+/g, '_').toLowerCase()}@database.com`;

// Pre-defined superadmin details
const SUPER_ADMIN_DEFAULTS: Omit<User, 'password'> = {
  id: 'superadmin-main',
  username: 'SUPERADMIN',
  nik: 'SUPERADMIN',
  jabatan: 'SUPER ADMIN',
  location: 'BP PEKANBARU',
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
      userList.push(SUPER_ADMIN_DEFAULTS as User);
    }
    
    return userList;
  } catch (error) {
    console.error("Error getting users from Firestore:", error);
    // Return a default list with just the superadmin on error
    return [SUPER_ADMIN_DEFAULTS as User];
  }
}

// Function to create both Firebase Auth user and Firestore user profile
export async function addUser(userData: Omit<User, 'id'>): Promise<{ success: boolean; message?: string }> {
  try {
    if (!userData.password || userData.password.length < 6) {
        return { success: false, message: "Password is required and must be at least 6 characters long." };
    }
    const email = createEmail(userData.nik || userData.username);
    const userCredential = await createUserWithEmailAndPassword(auth, email, userData.password);
    const user = userCredential.user;

    const { password, ...userDataToSave } = userData;

    await setDoc(doc(firestore, "users", user.uid), {
      ...userDataToSave,
      id: user.uid,
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error adding user:", error);
    if (error.code === 'auth/email-already-in-use') {
        return { success: false, message: `User with NIK/Username "${userData.nik || userData.username}" already exists.`};
    }
    return { success: false, message: error.message };
  }
}

export async function updateUser(userId: string, updatedData: Partial<User>): Promise<void> {
  const userRef = doc(firestore, 'users', userId);
  await updateDoc(userRef, updatedData);
}

export async function deleteUser(userId: string): Promise<void> {
  await deleteDoc(doc(firestore, 'users', userId));
  // Note: This only deletes the Firestore record, not the Firebase Auth user.
  // Proper user deletion would require a backend function.
}

export async function changePassword(oldPassword: string, newPassword:string): Promise<{ success: boolean, message: string }> {
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


// Definitive login function
export async function loginWithIdentifier(identifier: string, passwordFromInput: string): Promise<FirebaseUser> {
    const email = createEmail(identifier);
    const isSuperAdminAttempt = identifier.toUpperCase() === 'SUPERADMIN';

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, passwordFromInput);
        return userCredential.user;
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            if (isSuperAdminAttempt) {
                // If SUPERADMIN auth user doesn't exist, create it. This should only run once.
                try {
                    const newUserCredential = await createUserWithEmailAndPassword(auth, email, passwordFromInput);
                    // Also create the Firestore doc for SUPERADMIN.
                    await setDoc(doc(firestore, 'users', 'superadmin-main'), SUPER_ADMIN_DEFAULTS);
                    return newUserCredential.user;
                } catch (createError: any) {
                    throw new Error(`Gagal membuat pengguna SUPERADMIN: ${createError.message}`);
                }
            } else {
                 // For regular users, we might check firestore to see if the user should exist
                const q = query(collection(firestore, "users"), where("nik", "==", identifier));
                const querySnapshot = await getDocs(q);
                if (querySnapshot.empty) {
                    throw new Error('Pengguna tidak ditemukan di database.');
                }
                // If user exists in Firestore but not auth, something is wrong.
                // For now, treat as a generic failure.
                throw new Error('Terjadi masalah dengan akun Anda. Hubungi administrator.');
            }
        } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            throw new Error('Password salah. Silakan coba lagi.');
        } else {
            console.error("Unhandled login error:", error);
            throw new Error(`Terjadi kesalahan saat login: ${error.code}`);
        }
    }
}

