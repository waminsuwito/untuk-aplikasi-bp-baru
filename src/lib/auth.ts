
'use client';

import { auth, firestore } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updatePassword, onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, updateDoc, deleteDoc, runTransaction } from 'firebase/firestore';
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
const SUPER_ADMIN_PASSWORD = '123456';


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
    
    if (userSnapshot.empty) {
      // If no users exist, create the default super admin
      console.log("No users found. Creating default SUPER ADMIN...");
      try {
        const email = createEmail(SUPER_ADMIN_DEFAULTS.nik);
        // We use a transaction to ensure we don't accidentally create multiple superadmins
        // in a race condition, although it's unlikely on first load.
        await runTransaction(firestore, async (transaction) => {
            const superAdminRef = doc(firestore, 'users', SUPER_ADMIN_DEFAULTS.id);
            const superAdminDoc = await transaction.get(superAdminRef);
            if (!superAdminDoc.exists()) {
                // To create the Firebase Auth user, we need to temporarily sign up
                // This part is tricky on client-side and ideally done via a secure backend/CLI
                // For this project setup, we will rely on a manual creation or a first-time login flow.
                // For now, we return the user data so the login can attempt to find it.
                // The actual auth user should be created in Firebase Console for this to work.
                 console.warn(`
          ******************************************************************
          * PLEASE CREATE THE SUPER ADMIN USER IN FIREBASE AUTHENTICATION  *
          * Email: ${email}                                                *
          * Password: ${SUPER_ADMIN_PASSWORD}                              *
          * UID: ${SUPER_ADMIN_DEFAULTS.id}                                *
          ******************************************************************
        `);
                transaction.set(superAdminRef, SUPER_ADMIN_DEFAULTS);
            }
        });
         return [SUPER_ADMIN_DEFAULTS];
      } catch (e) {
        console.error("Failed to create default super admin:", e);
        return []; // Return empty if creation fails
      }
    }

    const userList = userSnapshot.docs.map(doc => doc.data() as User);
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
    // Re-authenticate user before changing password
    const email = user.email;
    await signInWithEmailAndPassword(auth, email, oldPassword);

    // If re-authentication is successful, update the password
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
    const allUsers = await getUsers();
    const normalizedIdentifier = identifier.toLowerCase();
    
    const userProfile = allUsers.find(
      u => u.nik?.toLowerCase() === normalizedIdentifier || u.username.toLowerCase() === normalizedIdentifier
    );

    if (!userProfile) {
        throw new Error('User with that NIK or Username not found.');
    }
    
    // Now we have the NIK/username, construct the email and try to sign in
    const email = createEmail(userProfile.nik || userProfile.username);
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, passwordFromInput);
        return userCredential.user;
    } catch (error) {
        console.error("Firebase sign-in error:", error);
        throw new Error('Password salah.');
    }
}
