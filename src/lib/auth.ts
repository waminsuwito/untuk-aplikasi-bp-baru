

'use client';

import { type User, type Jabatan, userLocations, jabatanOptions } from '@/lib/types';
import { auth, firestore } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updatePassword, signOut, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc, getDocs, collection, updateDoc, deleteDoc, writeBatch, query, where, limit } from 'firebase/firestore';

// The initial set of users to seed the application with if none are found.
const initialUsers: Omit<User, 'id'>[] = [
  // Original Users
  { username: 'owner', password: '123456', jabatan: 'OWNER', location: 'BP PEKANBARU', nik: 'OWNER-001' },
  { username: 'admin', password: '123456', jabatan: 'SUPER ADMIN', location: 'BP PEKANBARU', nik: 'SUPER-001' },
  { username: 'mirul', password: '123456', jabatan: 'OPRATOR BP', location: 'BP PEKANBARU', nik: 'OP-001' },
  { username: 'transporter', password: '123456', jabatan: 'TRANSPORTER', location: 'BP PEKANBARU', nik: 'TRN-001' },
  
  // New Test Users for Each Role
  { username: 'test_owner', password: '123456', jabatan: 'OWNER', location: 'BP PEKANBARU', nik: 'T-OWN' },
  { username: 'test_super_admin', password: '123456', jabatan: 'SUPER ADMIN', location: 'BP PEKANBARU', nik: 'T-SA' },
  { username: 'test_admin_bp', password: '123456', jabatan: 'ADMIN BP', location: 'BP DUMAI', nik: 'T-ABP' },
  { username: 'test_admin_logistik', password: '123456', jabatan: 'ADMIN LOGISTIK', location: 'BP BAUNG', nik: 'T-ALOG' },
  { username: 'test_admin_precast', password: '123456', jabatan: 'ADMIN PRECAST', location: 'BP PEKANBARU', nik: 'T-APRE' },
  { username: 'test_admin_qc', password: '123456', jabatan: 'ADMIN QC', location: 'BP DUMAI', nik: 'T-AQC' },
  { username: 'test_helper', password: '123456', jabatan: 'HELPER', location: 'BP BAUNG', nik: 'T-HELP' },
  { username: 'test_helper_bp', password: '123456', jabatan: 'HELPER BP', location: 'BP PEKANBARU', nik: 'T-HBP' },
  { username: 'test_helper_cp', password: '123456', jabatan: 'HELPER CP', location: 'BP DUMAI', nik: 'T-HCP' },
  { username: 'test_helper_laborat', password: '123456', jabatan: 'HELPER LABORAT', location: 'BP BAUNG', nik: 'T-HLAB' },
  { username: 'test_helper_las', password: '123456', jabatan: 'HELPER LAS', location: 'BP PEKANBARU', nik: 'T-HLAS' },
  { username: 'test_helper_precast', password: '123456', jabatan: 'HELPER PRECAST', location: 'BP DUMAI', nik: 'T-HPRE' },
  { username: 'test_helper_tambal_ban', password: '123456', jabatan: 'HELPER TAMBAL BAN', location: 'BP BAUNG', nik: 'T-HTB' },
  { username: 'test_hrd', password: '123456', jabatan: 'HRD', location: 'BP PEKANBARU', nik: 'T-HRD' },
  { username: 'test_hse_k3', password: '123456', jabatan: 'HSE/K3', location: 'BP DUMAI', nik: 'T-HSE' },
  { username: 'test_kep_koor_bp', password: '123456', jabatan: 'KEP KOOR BP', location: 'BP BAUNG', nik: 'T-KKBP' },
  { username: 'test_kep_koor_qc', password: '123456', jabatan: 'KEP KOOR QC', location: 'BP PEKANBARU', nik: 'T-KKQC' },
  { username: 'test_kep_koor_teknik', password: '123456', jabatan: 'KEP KOOR TEKNIK', location: 'BP DUMAI', nik: 'T-KKT' },
  { username: 'test_kepala_bp', password: '123456', jabatan: 'KEPALA BP', location: 'BP BAUNG', nik: 'T-KBP' },
  { username: 'test_kepala_gudang', password: '123456', jabatan: 'KEPALA GUDANG', location: 'BP PEKANBARU', nik: 'T-KG' },
  { username: 'test_kepala_mekanik', password: '123456', jabatan: 'KEPALA MEKANIK', location: 'BP DUMAI', nik: 'T-KM' },
  { username: 'test_kepala_oprator', password: '123456', jabatan: 'KEPALA OPRATOR', location: 'BP BAUNG', nik: 'T-KO' },
  { username: 'test_kepala_precast', password: '123456', jabatan: 'KEPALA PRECAST', location: 'BP PEKANBARU', nik: 'T-KPRE' },
  { username: 'test_kepala_sopir', password: '123456', jabatan: 'KEPALA SOPIR', location: 'BP DUMAI', nik: 'T-KS' },
  { username: 'test_kepala_workshop', password: '123456', jabatan: 'KEPALA WORKSHOP', location: 'BP BAUNG', nik: 'T-KW' },
  { username: 'test_layar_monitor', password: '123456', jabatan: 'LAYAR MONITOR', location: 'BP PEKANBARU', nik: 'T-LM' },
  { username: 'test_logistik_material', password: '123456', jabatan: 'LOGISTIK MATERIAL', location: 'BP DUMAI', nik: 'T-LMAT' },
  { username: 'test_oprator_bata_ringan', password: '123456', jabatan: 'OPRATOR BATA RINGAN', location: 'BP BAUNG', nik: 'T-OBR' },
  { username: 'test_oprator_bp', password: '123456', jabatan: 'OPRATOR BP', location: 'BP PEKANBARU', nik: 'T-OBP' },
  { username: 'test_oprator_cp', password: '123456', jabatan: 'OPRATOR CP', location: 'BP DUMAI', nik: 'T-OCP' },
  { username: 'test_oprator_loader', password: '123456', jabatan: 'OPRATOR LOADER', location: 'BP BAUNG', nik: 'T-OL' },
  { username: 'test_oprator_paving', password: '123456', jabatan: 'OPRATOR PAVING', location: 'BP PEKANBARU', nik: 'T-OPAV' },
  { username: 'test_qc', password: '123456', jabatan: 'QC', location: 'BP DUMAI', nik: 'T-QC' },
  { username: 'test_sopir_dt', password: '123456', jabatan: 'SOPIR DT', location: 'BP BAUNG', nik: 'T-SDT' },
  { username: 'test_sopir_tm', password: '123456', jabatan: 'SOPIR TM', location: 'BP PEKANBARU', nik: 'T-STM' },
  { username: 'test_transporter', password: '123456', jabatan: 'TRANSPORTER', location: 'BP DUMAI', nik: 'T-TRN' },
  { username: 'test_tukang_bobok', password: '123456', jabatan: 'TUKANG BOBOK', location: 'BP BAUNG', nik: 'T-TB' },
  { username: 'test_tukang_las', password: '123456', jabatan: 'TUKANG LAS', location: 'BP PEKANBARU', nik: 'T-TL' }
];

// Helper to create a valid email from a username
const createEmail = (username: string) => `${username.replace(/\s+/g, '_').toLowerCase()}@farika-perkasa.local`;

/**
 * Seeds the Firestore database with the initial user list.
 * This should be called once from a manual trigger on the login page.
 */
export async function seedUsersToFirestore() {
  const usersRef = collection(firestore, 'users');
  const existingUsersSnapshot = await getDocs(query(usersRef, limit(1)));

  if (!existingUsersSnapshot.empty) {
    const message = "Database 'users' sudah berisi data. Proses inisialisasi dilewati.";
    console.log(message);
    return { success: true, message };
  }
  
  console.log("Memulai proses inisialisasi database...");
  let successCount = 0;
  let failCount = 0;

  const batch = writeBatch(firestore);

  for (const user of initialUsers) {
    try {
      const email = createEmail(user.username);
      // Create user in Firebase Auth first
      const userCredential = await createUserWithEmailAndPassword(auth, email, user.password || '123456');
      const authUid = userCredential.user.uid;

      // Prepare user details for Firestore, using the new authUid as the document ID and the 'id' field.
      const userDocRef = doc(firestore, 'users', authUid);
      const { password, ...userDataForFirestore } = user; // Exclude password from Firestore document
      batch.set(userDocRef, { ...userDataForFirestore, id: authUid }); // CRITICAL FIX: Save the correct authUid

      console.log(`Pengguna ${user.username} berhasil ditambahkan ke batch.`);
      successCount++;
    } catch (error: any) {
      failCount++;
      if (error.code !== 'auth/email-already-in-use') {
        console.error(`Gagal membuat pengguna Auth untuk ${user.username}:`, error);
      } else {
        console.warn(`Pengguna Auth untuk ${user.username} sudah ada.`);
      }
    }
  }

  try {
    await batch.commit(); // Commit all user documents at once
    console.log("Batch commit berhasil.");
  } catch(e) {
    console.error("Gagal melakukan batch commit ke Firestore:", e);
    const finalMessage = `Inisialisasi Gagal Total: Tidak dapat menulis ke Firestore. Berhasil: 0, Gagal: ${initialUsers.length}.`;
    return { success: false, message: finalMessage };
  }

  const finalMessage = `Inisialisasi selesai. Berhasil: ${successCount}, Gagal: ${failCount}.`;
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
    
    const adminUser = auth.currentUser;
    if (!adminUser) {
        throw new Error("Admin user is not properly logged in.");
    }

    try {
        const newUserEmail = createEmail(userData.username);
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

        // After creating the user, Firebase automatically signs in as the new user.
        // We need to sign back in as the original admin.
        // A more robust solution would involve admin SDK on a server, but for client-side this is a workaround.
        await signOut(auth); // Sign out the new user
        // The AuthProvider will handle re-authenticating the admin via its onAuthStateChanged listener and persisted state.
        // This relies on the admin's session being persisted.

        return newUser;
    } catch(error) {
        console.error("Failed to add user:", error);
        // Attempt to sign back in as admin even if there was an error
        await signOut(auth);
        return null;
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
