

'use client';

import { type User, type Jabatan, userLocations, jabatanOptions } from '@/lib/types';
import { auth, firestore } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updatePassword, signOut, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc, getDocs, collection, updateDoc, deleteDoc, writeBatch, query, where, limit } from 'firebase/firestore';

// The initial set of users to seed the application with if none are found.
const initialUsers: Omit<User, 'id'>[] = [
  { username: 'owner', password: '123456', jabatan: 'OWNER', location: 'BP PEKANBARU', nik: 'OWNER-001' },
  { username: 'admin', password: '123456', jabatan: 'SUPER ADMIN', location: 'BP PEKANBARU', nik: 'SUPER-001' },
  { username: 'mirul', password: '123456', jabatan: 'OPRATOR BP', location: 'BP PEKANBARU', nik: 'OP-001' },
  { username: 'transporter', password: '123456', jabatan: 'TRANSPORTER', location: 'BP PEKANBARU', nik: 'TRN-001' },
];

// Helper to create a valid email from a NIK. NIK is guaranteed to be unique.
export const createEmailFromNik = (nik: string) => `${nik.replace(/\s+/g, '_').toLowerCase()}@farika-perkasa.local`;

/**
 * Seeds the Firestore database with the initial user list.
 * This should be called once from a manual trigger on the login page.
 */
export async function seedUsersToFirestore() {
  const usersRef = collection(firestore, 'users');
  
  // This function will now act as a RESET function.
  // It will delete all existing users and then add the initial users.
  // This is a destructive operation.
  console.log("Memulai proses inisialisasi ulang database...");
  
  try {
    const existingUsersSnapshot = await getDocs(usersRef);
    const deleteBatch = writeBatch(firestore);
    existingUsersSnapshot.forEach(doc => {
      // Note: This does not delete the user from Firebase Auth, only Firestore.
      // Proper multi-user deletion requires Admin SDK on a backend.
      deleteBatch.delete(doc.ref);
    });
    await deleteBatch.commit();
    console.log("Pengguna lama di Firestore telah dihapus.");
  } catch(e) {
    console.error("Gagal menghapus pengguna lama:", e);
    return { success: false, message: "Gagal membersihkan database pengguna lama." };
  }


  let successCount = 0;
  let failCount = 0;

  for (const user of initialUsers) {
    try {
      const email = createEmailFromNik(user.nik || '');
      // We assume during a seed, it's okay if the auth user already exists.
      // We will try to create it, and if it fails with 'email-already-in-use', we proceed.
      let authUid: string | undefined;

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, user.password || '123456');
        authUid = userCredential.user.uid;
      } catch (authError: any) {
        if (authError.code === 'auth/email-already-in-use') {
          console.warn(`Pengguna Auth untuk ${user.username} sudah ada. Mencari UID...`);
          // This part is tricky without Admin SDK. For this client-side seed, we can't easily get the UID.
          // The best approach is to let the user delete them from the Firebase Console if a full clean is needed.
          // For now, we will skip adding to firestore if we can't create the auth user.
          failCount++;
          continue; 
        } else {
          throw authError; // Rethrow other auth errors
        }
      }
      
      if (authUid) {
        const userDocRef = doc(firestore, 'users', authUid);
        const { password, ...userDataForFirestore } = user;
        await setDoc(userDocRef, { ...userDataForFirestore, id: authUid });
        console.log(`Pengguna ${user.username} berhasil ditambahkan.`);
        successCount++;
      }
    } catch (error: any) {
      failCount++;
      console.error(`Gagal memproses pengguna ${user.username}:`, error);
    }
  }

  const finalMessage = `Inisialisasi selesai. Berhasil: ${successCount}, Gagal: ${failCount}. Harap dicatat: Pengguna di sistem otentikasi tidak dihapus secara otomatis.`;
  console.log(finalMessage);
  return { success: true, message: finalMessage };
}

/**
 * Retrieves the list of users from Firestore.
 * @returns {Promise<User[]>} An array of user objects.
 */
export async function getUsers(): Promise<User[]> {
    try {
      const usersRef = collection(firestore, 'users');
      const snapshot = await getDocs(usersRef);
      if (snapshot.empty) {
        console.log("No users found in Firestore. Seeding might be needed.");
        return [];
      }
      return snapshot.docs.map(doc => doc.data() as User);
    } catch (e) {
      console.error("Error getting users from firestore", e);
      return [];
    }
}


export async function addUser(userData: Omit<User, 'id' | 'password'> & { password?: string }): Promise<User | null> {
    if (!userData.password) {
        throw new Error("Password is required to create a new user.");
    }
    
    // Check for NIK uniqueness in Firestore first
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where("nik", "==", userData.nik));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        throw new Error(`NIK "${userData.nik}" sudah digunakan.`);
    }

    try {
        const newUserEmail = createEmailFromNik(userData.nik || '');
        // This call might sign out the current admin user if not handled properly.
        // We assume the auth provider will handle the state change.
        const userCredential = await createUserWithEmailAndPassword(auth, newUserEmail, userData.password);
        const authUid = userCredential.user.uid;

        const newUser: User = {
            id: authUid,
            username: userData.username,
            jabatan: userData.jabatan,
            location: userData.location,
            nik: userData.nik,
        };
        
        const userDocRef = doc(firestore, 'users', authUid);
        await setDoc(userDocRef, newUser);
        
        return newUser;

    } catch(error: any) {
        console.error("Failed to add user:", error);
        if (error.code === 'auth/email-already-in-use') {
          // This case should be rare now because of the Firestore check above, but it's a good fallback.
          throw new Error(`NIK "${userData.nik}" sudah terdaftar di sistem otentikasi.`);
        }
        throw error; // Re-throw other errors
    }
}

export async function updateUser(userId: string, userData: Partial<Omit<User, 'id' | 'password'>>): Promise<void> {
    const userDocRef = doc(firestore, 'users', userId);
    await updateDoc(userDocRef, userData);
}

export async function deleteUser(userId: string): Promise<void> {
    // This is a complex operation on the client side.
    // Firebase Auth does not allow deleting other users directly.
    // This function will only delete the user from Firestore.
    // The Auth user will remain, becoming an "orphan".
    // Proper implementation requires a Firebase Function (backend code).
    console.warn("Hanya menghapus data dari Firestore. Pengguna Auth masih ada.");
    const userDocRef = doc(firestore, 'users', userId);
    await deleteDoc(userDocRef);
}

export async function changePassword(userId: string, oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== userId) {
        return { success: false, message: 'Authentication error. Please log in again.' };
    }
    
    try {
        const email = currentUser.email;
        if (!email) {
            return { success: false, message: 'User email not found.' };
        }
        
        // Re-authenticate user before changing password
        const credential = EmailAuthProvider.credential(email, oldPassword);
        await reauthenticateWithCredential(currentUser, credential);
        
        // If re-authentication is successful, update the password
        await updatePassword(currentUser, newPassword);
        return { success: true, message: 'Password updated successfully.' };

    } catch (error: any) {
        console.error("Password change failed:", error);
        let message = 'An unknown error occurred.';
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            message = 'Password lama salah.';
        }
        return { success: false, message };
    }
}

export async function firebaseLogout() {
  await signOut(auth);
}

// Function to get current user detail from firestore
export async function getCurrentUserDetails(uid: string): Promise<Omit<User, 'password'> | null> {
    const userDocRef = doc(firestore, 'users', uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        // Ensure the returned object has the correct ID matching the auth UID
        return { ...data, id: docSnap.id } as Omit<User, 'password'>;
    } else {
        console.warn(`No Firestore document found for UID: ${uid}`);
        return null;
    }
}
