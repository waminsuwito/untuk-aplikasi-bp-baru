

'use client';

import { type User } from '@/lib/types';

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


/**
 * Retrieves the list of users from localStorage.
 * If no users are found, it seeds localStorage with an initial list.
 * This function should only be called on the client side.
 * @returns {User[]} An array of user objects.
 */
export function getUsers(): User[] {
    if (typeof window === 'undefined') {
        return [];
    }
    try {
        const storedUsers = window.localStorage.getItem(USERS_STORAGE_KEY);
        if (storedUsers) {
            return JSON.parse(storedUsers);
        } else {
            // Seed the initial users into localStorage if it's empty
            window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialUsers));
            return initialUsers;
        }
    } catch (error) {
        console.error('Failed to access users from localStorage:', error);
        return [];
    }
}

/**
 * Saves the provided array of users to localStorage.
 * This function should only be called on the client side.
 * @param {User[]} users The array of users to save.
 */
function saveUsers(users: User[]): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (error) {
        console.error('Failed to save users to localStorage:', error);
    }
}


export function verifyLogin(usernameOrNik: string, password: string): Omit<User, 'password'> | null {
    const users = getUsers();
    const lowerCaseUsernameOrNik = usernameOrNik.toLowerCase();

    const user = users.find(
        (u) =>
            (u.username.toLowerCase() === lowerCaseUsernameOrNik || (u.nik && u.nik.toLowerCase() === lowerCaseUsernameOrNik)) &&
            u.password === password
    );

    if (user) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    } else {
        return null;
    }
}

export function addUser(userData: Omit<User, 'id'>): User {
    const users = getUsers();
    const newUser: User = { ...userData, id: new Date().toISOString() + Math.random().toString(36).substring(2) };
    const updatedUsers = [...users, newUser];
    saveUsers(updatedUsers);
    return newUser;
}

export function updateUser(userId: string, userData: Partial<Omit<User, 'id'>>): void {
    const users = getUsers();
    const updatedUsers = users.map((u) =>
        u.id === userId ? { ...u, ...userData } : u
    );
    saveUsers(updatedUsers);
}

export function deleteUser(userId: string): void {
    const users = getUsers();
    const updatedUsers = users.filter((u) => u.id !== userId);
    saveUsers(updatedUsers);
}

export function changePassword(userId: string, oldPassword: string, newPassword: string): { success: boolean; message: string } {
    const users = getUsers();
    const userIndex = users.findIndex((u) => u.id === userId);

    if (userIndex === -1) {
        return { success: false, message: 'User not found.' };
    }

    const user = users[userIndex];
    if (user.password !== oldPassword) {
        return { success: false, message: 'Incorrect old password.' };
    }

    users[userIndex].password = newPassword;
    saveUsers(users);

    return { success: true, message: 'Password updated successfully.' };
}
