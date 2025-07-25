
'use client';

import { auth, firestore } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updatePassword, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import type { User } from './types';

// Helper to create a fake email from NIK/Username
const createEmail = (identifier: string) => `${identifier.replace(/\s+/g, '_').toLowerCase()}@database.com`;

// Pre-defined superadmin details using a new, unique name
const SUPER_ADMIN_DEFAULTS: Omit<User, 'password'> = {
  id: 'frp-admin-main',
  username: 'FRP_ADMIN',
  nik: 'FRP_ADMIN',
  jabatan: 'SUPER ADMIN',
  location: 'BP PEKANBARU',
};

// Function to get all users from Firestore
export async function getUsers(): Promise<User[]> {
  try {
    const usersCollection = collection(firestore, 'users');
    const userSnapshot = await getDocs(usersCollection);
    const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    
    // Ensure FRP_ADMIN always exists in the list for management purposes
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
  // Note: This does not delete the Firebase Auth user, only the Firestore document.
  // For a full user deletion, you would need a backend function.
  await deleteDoc(doc(firestore, 'users', userId));
}

export async function changePassword(oldPassword: string, newPassword:string): Promise<{ success: boolean, message: string }> {
    const user = auth.currentUser;
    if (!user || !user.email) {
        return { success: false, message: "No user is currently signed in or user has no email." };
    }

    try {
        const email = user.email;
        // Re-authenticate user before changing password
        await signInWithEmailAndPassword(auth, email, oldPassword);
        
        // If re-authentication is successful, update the password
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

export async function loginWithIdentifier(identifier: string, passwordFromInput: string): Promise<FirebaseUser> {
    const isSuperAdminAttempt = identifier.toUpperCase() === 'FRP_ADMIN';
    const email = createEmail(identifier);

    try {
        // Always try to sign in first.
        const userCredential = await signInWithEmailAndPassword(auth, email, passwordFromInput);
        return userCredential.user;
    } catch (error: any) {
        // If sign-in fails because the user doesn't exist...
        if (error.code === 'auth/user-not-found') {
            // ... and it's the main admin attempting to log in for the first time...
            if (isSuperAdminAttempt) {
                // ...then create the FRP_ADMIN user now.
                try {
                    const newUserCredential = await createUserWithEmailAndPassword(auth, email, passwordFromInput);
                    // Also create the Firestore doc for FRP_ADMIN.
                    await setDoc(doc(firestore, 'users', newUserCredential.user.uid), { ...SUPER_ADMIN_DEFAULTS, id: newUserCredential.user.uid });
                    return newUserCredential.user;
                } catch (createError: any) {
                    console.error("Failed to create FRP_ADMIN user:", createError);
                    throw new Error(`Gagal membuat pengguna FRP_ADMIN: ${createError.message}`);
                }
            } else {
                // If it's a regular user that's not found, deny access.
                throw new Error('Pengguna tidak ditemukan. Silakan hubungi administrator.');
            }
        } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            throw new Error('Password salah. Silakan coba lagi.');
        } else {
            // For any other errors (network issues, etc.)
            console.error("Unhandled login error:", error);
            throw new Error(`Terjadi kesalahan saat login: ${error.code}`);
        }
    }
}
