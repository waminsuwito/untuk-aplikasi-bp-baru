
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

export async function getUsers(): Promise<User[]> {
  try {
    const usersCollection = collection(firestore, 'users');
    const userSnapshot = await getDocs(usersCollection);
    const userList = userSnapshot.docs.map(doc => doc.data() as User);
    
    // Check if superadmin exists in the list
    const superAdminExists = userList.some(u => u.id === SUPER_ADMIN_DEFAULTS.id);
    if (!superAdminExists) {
      await setDoc(doc(firestore, 'users', SUPER_ADMIN_DEFAULTS.id), SUPER_ADMIN_DEFAULTS);
      userList.push(SUPER_ADMIN_DEFAULTS);
    }
    
    return userList;
  } catch (error) {
    console.error("Error getting users:", error);
    return [];
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
    const isSuperAdminLogin = identifier.toUpperCase() === 'SUPERADMIN';

    if (isSuperAdminLogin) {
        const email = createEmail(identifier);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, passwordFromInput);
            return userCredential.user;
        } catch (error: any) {
            console.error("SUPERADMIN login error:", error);
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
                throw new Error('Password SUPERADMIN salah.');
            } else if (error.code === 'auth/user-not-found') {
                 try {
                    console.log("SUPERADMIN auth user not found, creating it now...");
                    const newUserCredential = await createUserWithEmailAndPassword(auth, email, passwordFromInput);
                    await setDoc(doc(firestore, 'users', 'superadmin-main'), SUPER_ADMIN_DEFAULTS);
                    console.log("SUPERADMIN user created successfully.");
                    return newUserCredential.user;
                } catch (createError: any) {
                    console.error("Failed to create SUPERADMIN user:", createError);
                    throw new Error(`Gagal membuat pengguna SUPERADMIN. Coba lagi.`);
                }
            } else {
                 throw new Error(`Login gagal: ${error.message}`);
            }
        }
    }

    // Standard user login flow
    const usersCollection = collection(firestore, 'users');
    
    const nikQuery = query(usersCollection, where("nik", "==", identifier.toUpperCase()));
    const usernameQuery = query(usersCollection, where("username", "==", identifier.toUpperCase()));

    const nikSnapshot = await getDocs(nikQuery);
    const usernameSnapshot = await getDocs(usernameQuery);

    let userProfile: User | null = null;
    if (!nikSnapshot.empty) {
        userProfile = nikSnapshot.docs[0].data() as User;
    } else if (!usernameSnapshot.empty) {
        userProfile = usernameSnapshot.docs[0].data() as User;
    }

    if (!userProfile) {
        throw new Error('User dengan NIK atau Username tersebut tidak ditemukan.');
    }
    
    const authEmail = createEmail(userProfile.nik || userProfile.username);
    try {
        const userCredential = await signInWithEmailAndPassword(auth, authEmail, passwordFromInput);
        return userCredential.user;
    } catch (error) {
        console.error("Firebase sign-in error:", error);
        throw new Error('Password salah.');
    }
}
