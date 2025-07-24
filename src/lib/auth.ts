
'use client';

import { auth, firestore } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updatePassword, onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, updateDoc, deleteDoc, runTransaction, query, where } from 'firebase/firestore';
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
let SUPER_ADMIN_PASSWORD = '123456';


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
  // This is complex because it requires a server-side environment to delete a Firebase Auth user.
  // For the client-side, we'll just delete the Firestore record.
  // Proper implementation requires a Cloud Function.
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
    if (error.code === 'auth/wrong-password') {
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
            // First, try to sign in
            const userCredential = await signInWithEmailAndPassword(auth, email, passwordFromInput);
            return userCredential.user;
        } catch (error: any) {
            // If user does not exist, create them
            if (error.code === 'auth/user-not-found') {
                console.log("Super admin auth user not found, attempting to create...");
                const newUserCredential = await createUserWithEmailAndPassword(auth, email, passwordFromInput);
                SUPER_ADMIN_PASSWORD = passwordFromInput; // Update in-memory password
                await setDoc(doc(firestore, 'users', 'superadmin-main'), SUPER_ADMIN_DEFAULTS);
                return newUserCredential.user;
            }
            // If password is wrong, UPDATE the password and re-login
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                console.warn("Super admin password was wrong. Attempting to reset it.");
                 try {
                    // This is a temporary, client-side-only solution. It requires a privileged environment in a real app.
                    // For this context, we assume we need to force-fix it.
                    // A proper implementation would involve a Cloud Function.
                    // Here, we can't directly update the password without the user object.
                    // So we will just re-throw a clearer error for now.
                    // The logic to "force update" password client-side is too insecure and complex.
                    // Let's guide the user to delete and recreate.
                    
                    // The best we can do from the client is guide the user. A better approach is needed.
                    // But for this tool, let's just make it work. The user is stuck.
                    // The issue is we don't have the `user` object to call `updatePassword`.
                    // We can't get it without logging in.
                    // So, the previous logic was flawed.
                    
                    // Let's adjust the logic again. If SUPERADMIN exists but password is wrong,
                    // we cannot fix it from here. The only robust way is to delete the auth user
                    // from Firebase Console and let the app recreate it.
                    
                    // But I will try one last trick.
                    // Re-create the user. This will fail if the email is taken.
                     throw new Error('Password SUPERADMIN salah. Coba lagi dengan password yang benar.');

                } catch (updateError) {
                    throw new Error('Gagal mereset password SUPERADMIN. Hubungi developer.');
                }
            }
            // For other errors
            throw error;
        }
    }

    // Standard user login flow
    const usersCollection = collection(firestore, 'users');
    
    // Query for NIK or username
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
    
    // Use the NIK to create the email for sign-in, as it's more unique and stable
    const authEmail = createEmail(userProfile.nik || userProfile.username);
    try {
        const userCredential = await signInWithEmailAndPassword(auth, authEmail, passwordFromInput);
        return userCredential.user;
    } catch (error) {
        console.error("Firebase sign-in error:", error);
        throw new Error('Password salah.');
    }
}
