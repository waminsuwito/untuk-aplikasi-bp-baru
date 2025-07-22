

'use client';

import { type User, type Jabatan, userLocations, jabatanOptions } from '@/lib/types';
import { auth, firestore } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updatePassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, getDocs, collection, updateDoc, deleteDoc } from 'firebase/firestore';

// The key used to store users in localStorage.
const USERS_STORAGE_KEY = 'app-users';

// The initial set of users to seed the application with if none are found.
const initialUsers: User[] = [
  // Original Users
  { id: 'owner-main', username: 'owner', password: '123', jabatan: 'OWNER', location: 'BP PEKANBARU', nik: 'OWNER-001' },
  { id: 'superadmin-main', username: 'admin', password: '123', jabatan: 'SUPER ADMIN', location: 'BP PEKANBARU', nik: 'SUPER-001' },
  { id: 'op-1', username: 'mirul', password: '123', jabatan: 'OPRATOR BP', location: 'BP PEKANBARU', nik: 'OP-001' },
  { id: 'transporter-1', username: 'transporter', password: '123', jabatan: 'TRANSPORTER', location: 'BP PEKANBARU', nik: 'TRN-001' },
  
  // New Test Users for Each Role
  { id: 'test-owner', username: 'test_owner', password: '1', jabatan: 'OWNER', location: 'BP PEKANBARU', nik: 'T-OWN' },
  { id: 'test-super_admin', username: 'test_super_admin', password: '1', jabatan: 'SUPER ADMIN', location: 'BP PEKANBARU', nik: 'T-SA' },
  { id: 'test-admin_bp', username: 'test_admin_bp', password: '1', jabatan: 'ADMIN BP', location: 'BP DUMAI', nik: 'T-ABP' },
  { id: 'test-admin_logistik', username: 'test_admin_logistik', password: '1', jabatan: 'ADMIN LOGISTIK', location: 'BP BAUNG', nik: 'T-ALOG' },
  { id: 'test-admin_precast', username: 'test_admin_precast', password: '1', jabatan: 'ADMIN PRECAST', location: 'BP PEKANBARU', nik: 'T-APRE' },
  { id: 'test-admin_qc', username: 'test_admin_qc', password: '1', jabatan: 'ADMIN QC', location: 'BP DUMAI', nik: 'T-AQC' },
  { id: 'test-helper', username: 'test_helper', password: '1', jabatan: 'HELPER', location: 'BP BAUNG', nik: 'T-HELP' },
  { id: 'test-helper_bp', username: 'test_helper_bp', password: '1', jabatan: 'HELPER BP', location: 'BP PEKANBARU', nik: 'T-HBP' },
  { id: 'test-helper_cp', username: 'test_helper_cp', password: '1', jabatan: 'HELPER CP', location: 'BP DUMAI', nik: 'T-HCP' },
  { id: 'test-helper_laborat', username: 'test_helper_laborat', password: '1', jabatan: 'HELPER LABORAT', location: 'BP BAUNG', nik: 'T-HLAB' },
  { id: 'test-helper_las', username: 'test_helper_las', password: '1', jabatan: 'HELPER LAS', location: 'BP PEKANBARU', nik: 'T-HLAS' },
  { id: 'test-helper_precast', username: 'test_helper_precast', password: '1', jabatan: 'HELPER PRECAST', location: 'BP DUMAI', nik: 'T-HPRE' },
  { id: 'test-helper_tambal_ban', username: 'test_helper_tambal_ban', password: '1', jabatan: 'HELPER TAMBAL BAN', location: 'BP BAUNG', nik: 'T-HTB' },
  { id: 'test-hrd', username: 'test_hrd', password: '1', jabatan: 'HRD', location: 'BP PEKANBARU', nik: 'T-HRD' },
  { id: 'test-hse_k3', username: 'test_hse_k3', password: '1', jabatan: 'HSE/K3', location: 'BP DUMAI', nik: 'T-HSE' },
  { id: 'test-kep_koor_bp', username: 'test_kep_koor_bp', password: '1', jabatan: 'KEP KOOR BP', location: 'BP BAUNG', nik: 'T-KKBP' },
  { id: 'test-kep_koor_qc', username: 'test_kep_koor_qc', password: '1', jabatan: 'KEP KOOR QC', location: 'BP PEKANBARU', nik: 'T-KKQC' },
  { id: 'test-kep_koor_teknik', username: 'test_kep_koor_teknik', password: '1', jabatan: 'KEP KOOR TEKNIK', location: 'BP DUMAI', nik: 'T-KKT' },
  { id: 'test-kepala_bp', username: 'test_kepala_bp', password: '1', jabatan: 'KEPALA BP', location: 'BP BAUNG', nik: 'T-KBP' },
  { id: 'test-kepala_gudang', username: 'test_kepala_gudang', password: '1', jabatan: 'KEPALA GUDANG', location: 'BP PEKANBARU', nik: 'T-KG' },
  { id: 'test-kepala_mekanik', username: 'test_kepala_mekanik', password: '1', jabatan: 'KEPALA MEKANIK', location: 'BP DUMAI', nik: 'T-KM' },
  { id: 'test-kepala_oprator', username: 'test_kepala_oprator', password: '1', jabatan: 'KEPALA OPRATOR', location: 'BP BAUNG', nik: 'T-KO' },
  { id: 'test-kepala_precast', username: 'test_kepala_precast', password: '1', jabatan: 'KEPALA PRECAST', location: 'BP PEKANBARU', nik: 'T-KPRE' },
  { id: 'test-kepala_sopir', username: 'test_kepala_sopir', password: '1', jabatan: 'KEPALA SOPIR', location: 'BP DUMAI', nik: 'T-KS' },
  { id: 'test-kepala_workshop', username: 'test_kepala_workshop', password: '1', jabatan: 'KEPALA WORKSHOP', location: 'BP BAUNG', nik: 'T-KW' },
  { id: 'test-layar_monitor', username: 'test_layar_monitor', password: '1', jabatan: 'LAYAR MONITOR', location: 'BP PEKANBARU', nik: 'T-LM' },
  { id: 'test-logistik_material', username: 'test_logistik_material', password: '1', jabatan: 'LOGISTIK MATERIAL', location: 'BP DUMAI', nik: 'T-LMAT' },
  { id: 'test-oprator_bata_ringan', username: 'test_oprator_bata_ringan', password: '1', jabatan: 'OPRATOR BATA RINGAN', location: 'BP BAUNG', nik: 'T-OBR' },
  { id: 'test-oprator_bp', username: 'test_oprator_bp', password: '1', jabatan: 'OPRATOR BP', location: 'BP PEKANBARU', nik: 'T-OBP' },
  { id: 'test-oprator_cp', username: 'test_oprator_cp', password: '1', jabatan: 'OPRATOR CP', location: 'BP DUMAI', nik: 'T-OCP' },
  { id: 'test-oprator_loader', username: 'test_oprator_loader', password: '1', jabatan: 'OPRATOR LOADER', location: 'BP BAUNG', nik: 'T-OL' },
  { id: 'test-oprator_paving', username: 'test_oprator_paving', password: '1', jabatan: 'OPRATOR PAVING', location: 'BP PEKANBARU', nik: 'T-OPAV' },
  { id: 'test-qc', username: 'test_qc', password: '1', jabatan: 'QC', location: 'BP DUMAI', nik: 'T-QC' },
  { id: 'test-sopir_dt', username: 'test_sopir_dt', password: '1', jabatan: 'SOPIR DT', location: 'BP BAUNG', nik: 'T-SDT' },
  { id: 'test-sopir_tm', username: 'test_sopir_tm', password: '1', jabatan: 'SOPIR TM', location: 'BP PEKANBARU', nik: 'T-STM' },
  { id: 'test-transporter', username: 'test_transporter', password: '1', jabatan: 'TRANSPORTER', location: 'BP DUMAI', nik: 'T-TRN' },
  { id: 'test-tukang_bobok', username: 'test_tukang_bobok', password: '1', jabatan: 'TUKANG BOBOK', location: 'BP BAUNG', nik: 'T-TB' },
  { id: 'test-tukang_las', username: 'test_tukang_las', password: '1', jabatan: 'TUKANG LAS', location: 'BP PEKANBARU', nik: 'T-TL' }
];

// Helper to create a valid email from a username
const createEmail = (username: string) => `${username.replace(/\s+/g, '_').toLowerCase()}@farika-perkasa.local`;

/**
 * Seeds the Firestore database with the initial user list.
 * This should be called once.
 */
export async function seedUsersToFirestore() {
  const usersRef = collection(firestore, 'users');
  const existingUsersSnapshot = await getDocs(usersRef);

  if (!existingUsersSnapshot.empty) {
    console.log("Firestore 'users' collection already has data. Seeding skipped.");
    return;
  }

  console.log("Seeding users to Firestore...");
  const promises = initialUsers.map(async (user) => {
    try {
      const email = createEmail(user.username);
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, user.password || 'defaultPassword123');
      const authUid = userCredential.user.uid;

      // Save user details in Firestore
      const userDocRef = doc(firestore, 'users', authUid);
      await setDoc(userDocRef, {
        id: authUid, // Use Firebase Auth UID as the document ID
        username: user.username,
        jabatan: user.jabatan,
        location: user.location,
        nik: user.nik,
      });
    } catch (error: any) {
      // Ignore "email-already-in-use" as it might happen on re-runs
      if (error.code !== 'auth/email-already-in-use') {
        console.error(`Failed to seed user ${user.username}:`, error);
      }
    }
  });

  await Promise.all(promises);
  console.log("Seeding complete.");
}

/**
 * Retrieves the list of users from Firestore.
 * @returns {Promise<User[]>} An array of user objects.
 */
export async function getUsers(): Promise<User[]> {
    const usersRef = collection(firestore, 'users');
    const snapshot = await getDocs(usersRef);
    if (snapshot.empty) {
      await seedUsersToFirestore();
      const newSnapshot = await getDocs(usersRef);
      return newSnapshot.docs.map(doc => doc.data() as User);
    }
    return snapshot.docs.map(doc => doc.data() as User);
}

/**
 * Verifies user login against Firebase Auth and retrieves user data from Firestore.
 * @param nikOrUsername The user's NIK or username.
 * @param password The user's password.
 * @returns {Promise<Omit<User, 'password'> | null>} The user object without the password, or null if login fails.
 */
export async function verifyLogin(nikOrUsername: string, password: string): Promise<Omit<User, 'password'> | null> {
    const allUsers = await getUsers();
    const lowerCaseInput = nikOrUsername.toLowerCase();
    
    // Find the user in our Firestore user list
    const userDetail = allUsers.find(
        u => (u.username.toLowerCase() === lowerCaseInput || (u.nik && u.nik.toLowerCase() === lowerCaseInput))
    );

    if (!userDetail) {
        return null; // User not found in Firestore details
    }
    
    try {
        const email = createEmail(userDetail.username);
        // Try to sign in with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // If sign-in is successful, return the user details from Firestore
        const { password, ...userWithoutPassword } = userDetail;
        return { ...userWithoutPassword, id: userCredential.user.uid }; // Return with the correct Firebase UID
    } catch (error) {
        console.error("Firebase login failed:", error);
        return null; // Auth failed
    }
}

export async function addUser(userData: Omit<User, 'id' | 'password'> & { password?: string }): Promise<User> {
    if (!userData.password) {
        throw new Error("Password is required to create a new user.");
    }
    
    const email = createEmail(userData.username);
    const userCredential = await createUserWithEmailAndPassword(auth, email, userData.password);
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
}

export async function updateUser(userId: string, userData: Partial<Omit<User, 'id' | 'password'>>): Promise<void> {
    const userDocRef = doc(firestore, 'users', userId);
    await updateDoc(userDocRef, userData);

    // Note: Changing username/email in Firebase Auth requires re-authentication and is more complex.
    // For this app, we'll only update Firestore data. Password update is a separate function.
}


export async function deleteUser(userId: string): Promise<void> {
    // This is a complex operation. Deleting a Firebase Auth user is irreversible and
    // requires admin privileges, typically handled via a backend/cloud function.
    // For a client-side only app, we will just delete the Firestore record.
    const userDocRef = doc(firestore, 'users', userId);
    await deleteDoc(userDocRef);
    
    // In a real app: You would call a cloud function here to delete the Auth user.
    // e.g., `const deleteUserFn = httpsCallable(functions, 'deleteUser'); await deleteUserFn({ uid: userId });`
}

export async function changePassword(userId: string, oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== userId) {
        return { success: false, message: 'Authentication error. Please log in again.' };
    }
    
    try {
        // Firebase does not have a direct "change password with old password" method on the client.
        // The common flow is to re-authenticate first to prove identity.
        const email = currentUser.email;
        if (!email) {
            return { success: false, message: 'User email not found.' };
        }
        await signInWithEmailAndPassword(auth, email, oldPassword);
        
        // If re-authentication is successful, update the password.
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
        return docSnap.data() as Omit<User, 'password'>;
    } else {
        return null;
    }
}
