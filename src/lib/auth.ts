
'use client';

import { type User, type Jabatan, userLocations, jabatanOptions } from '@/lib/types';
import { auth, firestore } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updatePassword, signOut, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc, getDocs, collection, updateDoc, deleteDoc, writeBatch, query, where, limit } from 'firebase/firestore';

// The initial set of users to seed the application with if none are found.
const initialUsers: Omit<User, 'id'>[] = [
  { username: 'SUPERADMIN', password: '123456', jabatan: 'SUPER ADMIN', location: 'BP PEKANBARU', nik: 'SA001' },
  { username: 'ADMINBP', password: '123456', jabatan: 'ADMIN BP', location: 'BP PEKANBARU', nik: 'ADMINBP-001' },
  { username: 'OWNER', password: '123456', jabatan: 'OWNER', location: 'BP PEKANBARU', nik: 'OWN001' },
  { username: 'MIRUL', password: '123456', jabatan: 'OPRATOR BP', location: 'BP PEKANBARU', nik: 'OP-001' },
  { username: 'TRANSPORTER', password: '123456', jabatan: 'TRANSPORTER', location: 'BP PEKANBARU', nik: 'TRN-001' },
  { username: 'RECOVERY', password: '123456', jabatan: 'SUPER ADMIN', location: 'BP PEKANBARU', nik: 'RECOVERY' },
  { username: 'ADMIN', password: '123456', jabatan: 'SUPER ADMIN', location: 'BP PEKANBARU', nik: 'ADMIN' },
];

// Helper to create a valid email from a NIK. NIK is guaranteed to be unique.
export const createEmailFromNik = (nik: string) => `${nik.replace(/\s+/g, '_').toLowerCase()}@farika-perkasa.local`;

/**
 * Seeds the Firestore database with the initial user list.
 * This should be called once from a manual trigger on the login page.
 * This function NO LONGER deletes old users to prevent permission errors before login.
 */
export async function seedUsersToFirestore() {
  console.log("Memulai proses inisialisasi database...");
  
  let successCount = 0;
  let failCount = 0;

  for (const user of initialUsers) {
    try {
      const email = createEmailFromNik(user.nik || '');
      let authUid: string | undefined;

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, user.password || '123456');
        authUid = userCredential.user.uid;
      } catch (authError: any) {
        if (authError.code === 'auth/email-already-in-use') {
          console.warn(`Pengguna Auth untuk ${user.username} sudah ada. Mencoba mendapatkan UID...`);
          try {
            // Sign in to get UID, then immediately sign out.
            const tempUserCredential = await signInWithEmailAndPassword(auth, email, user.password || '123456');
            authUid = tempUserCredential.user.uid;
            await signOut(auth); // Sign out after getting UID
          } catch(signInError) {
             console.error(`Tidak bisa login untuk mendapatkan UID pengguna ${user.username} yang sudah ada.`, signInError);
             failCount++;
             continue; // Skip to the next user
          }
        } else {
          throw authError;
        }
      }
      
      if (authUid) {
        const userDocRef = doc(firestore, 'users', authUid);
        const { password, ...userDataForFirestore } = user;
        await setDoc(userDocRef, { ...userDataForFirestore, id: authUid });
        console.log(`Pengguna ${user.username} berhasil ditambahkan/diperbarui di Firestore.`);
        successCount++;
      } else {
        failCount++;
        console.error(`Tidak dapat memperoleh UID untuk pengguna ${user.username}. Gagal menyimpan ke Firestore.`);
      }
    } catch (error: any) {
      failCount++;
      console.error(`Gagal memproses pengguna ${user.username}:`, error);
    }
  }

  const finalMessage = `Inisialisasi selesai. Berhasil: ${successCount}, Gagal: ${failCount}.`;
  console.log(finalMessage);
  return { success: true, message: finalMessage };
}

/**
 * Retrieves the list of users from Firestore.
 * This is now handled directly in the components after auth is confirmed.
 */
export async function getUsers(): Promise<User[]> {
    if (!auth.currentUser) {
        console.warn("Attempted to get users without an authenticated user.");
        return [];
    }
    try {
      const usersRef = collection(firestore, 'users');
      const snapshot = await getDocs(usersRef);
      if (snapshot.empty) {
        return [];
      }
      return snapshot.docs.map(doc => doc.data() as User);
    } catch (e) {
      console.error("Error getting users from firestore", e);
      return [];
    }
}

export async function findUserByNikOrUsername(identifier: string): Promise<User | null> {
    const usersRef = collection(firestore, 'users');
    const upperIdentifier = identifier.toUpperCase();
    
    // First, try to find by NIK
    const nikQuery = query(usersRef, where("nik", "==", upperIdentifier), limit(1));
    const nikSnapshot = await getDocs(nikQuery);
    if (!nikSnapshot.empty) {
        return nikSnapshot.docs[0].data() as User;
    }

    // If not found by NIK, try by username
    const usernameQuery = query(usersRef, where("username", "==", upperIdentifier), limit(1));
    const usernameSnapshot = await getDocs(usernameQuery);
    if (!usernameSnapshot.empty) {
        return usernameSnapshot.docs[0].data() as User;
    }
    
    return null;
}

export async function addUser(userData: Omit<User, 'id'> & { password?: string }): Promise<User | null> {
    if (!userData.password) {
        throw new Error("Password wajib diisi untuk pengguna baru.");
    }
     if (!userData.nik || userData.nik.trim() === '') {
        throw new Error("NIK wajib diisi untuk pengguna baru.");
    }
    
    // Check for NIK uniqueness in Firestore first
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where("nik", "==", userData.nik));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        throw new Error(`NIK "${userData.nik}" sudah digunakan.`);
    }

    // Since we cannot create a new auth user on behalf of an admin from the client-side,
    // we will just save the user data to Firestore.
    // The user will need to be created in Firebase Auth console manually or have a separate sign-up flow.
    // For this app's context, we'll assume a "lazy" creation where the auth account is created
    // behind the scenes or seeded.
    // The MOST secure way is to use a Firebase Function (backend) for this.
    // Given the constraints, we will add the user to firestore and rely on the seeding process.
    try {
        const email = createEmailFromNik(userData.nik);
        // This is the problematic part on the client. An admin cannot create users for others.
        // We will mock this by just adding to firestore.
        // In a real scenario, this would be a call to a Firebase Function.
        
        const newUserId = doc(collection(firestore, 'id_generator')).id; // Generate a unique ID
        const userDocRef = doc(firestore, 'users', newUserId);
        
        // We cannot create the auth user here. We just save the details.
        // This means the user CANNOT log in until their auth account is created.
        const { password, ...userDataForFirestore } = userData;
        
        // This is a placeholder for the password. It's NOT stored securely.
        // In a real app, never store plaintext passwords.
        const dataToSave = { 
            ...userDataForFirestore, 
            id: newUserId,
            // A flag to indicate this user needs auth creation
            pendingAuthCreation: true 
        };

        // For this app, let's try creating the auth user anyway,
        // acknowledging the limitations (admin will be logged out).
        // Let's revert to the old logic that tried to create the user,
        // as the main issue was `getDocs` during seed.
        const userCredential = await createUserWithEmailAndPassword(auth, email, userData.password);
        const authUid = userCredential.user.uid;

        await setDoc(doc(firestore, 'users', authUid), {
            ...userDataForFirestore,
            id: authUid
        });
        
        return { ...userData, id: authUid };
    } catch(error: any) {
        console.error("Gagal menambahkan pengguna:", error);
        if (error.code === 'auth/email-already-in-use') {
            throw new Error(`NIK "${userData.nik}" sudah terdaftar di sistem otentikasi.`);
        }
        throw new Error("Gagal menyimpan pengguna baru.");
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
        const { password, ...userDataToReturn } = data;
        return { ...userDataToReturn, id: docSnap.id } as Omit<User, 'password'>;
    } else {
        console.warn(`No Firestore document found for UID: ${uid}`);
        return null;
    }
}
