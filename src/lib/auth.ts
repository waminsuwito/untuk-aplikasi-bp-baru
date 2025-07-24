// This file is for managing user data in localStorage now that Firebase is disconnected.
'use client';

import type { User, Jabatan, UserLocation } from './types';

const USERS_STORAGE_KEY = 'app-users';

const initialUsers: User[] = [
    { id: '1', username: 'SUPER ADMIN', jabatan: 'SUPER ADMIN', location: 'BP PEKANBARU', nik: 'SA001', password: '1' },
    { id: '10', username: 'admin', jabatan: 'SUPER ADMIN', location: 'BP PEKANBARU', nik: 'ADMIN', password: '123' },
    { id: '2', username: 'ADMIN BP', jabatan: 'ADMIN BP', location: 'BP PEKANBARU', nik: 'ADMINBP-001', password: '1' },
    { id: '3', username: 'OWNER', jabatan: 'OWNER', location: 'BP PEKANBARU', nik: 'OWN001', password: '1' },
    { id: '4', username: 'MIRUL', jabatan: 'OPRATOR BP', location: 'BP PEKANBARU', nik: 'OP-001', password: '1' },
    { id: '5', username: 'KARYAWAN TM', jabatan: 'SOPIR TM', location: 'BP PEKANBARU', nik: 'TM001', password: '1' },
    { id: '6', username: 'KEPALA MEKANIK', jabatan: 'KEPALA MEKANIK', location: 'BP PEKANBARU', nik: 'MEK001', password: '1' },
    { id: '7', username: 'TRANSPORTER', jabatan: 'TRANSPORTER', location: 'BP DUMAI', nik: 'TRN001', password: '1' },
    { id: '8', username: 'LOGISTIK MATERIAL', jabatan: 'LOGISTIK MATERIAL', location: 'BP BAUNG', nik: 'LOG001', password: '1' },
    { id: '9', username: 'HSE', jabatan: 'HSE/K3', location: 'BP IKN', nik: 'HSE001', password: '1' },
];

export function getUsers(): User[] {
  try {
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    if (storedUsers) {
      return JSON.parse(storedUsers);
    }
  } catch (error) {
    console.error("Failed to parse users from localStorage", error);
  }
  return []; // Return empty if nothing is stored or parsing fails
}

export function seedUsersToLocalStorage() {
  try {
    // This function now ALWAYS overwrites the existing data to ensure a clean slate.
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialUsers));
    console.log("Initial users seeded to localStorage.");
  } catch (error) {
    console.error("Failed to seed users to localStorage", error);
  }
}


export function addUser(userData: Omit<User, 'id'>): boolean {
  const users = getUsers();
  const nikExists = users.some(u => u.nik === userData.nik);
  if (nikExists) {
    console.error(`User with NIK ${userData.nik} already exists.`);
    return false;
  }
  const newUser: User = {
    ...userData,
    id: new Date().toISOString(),
  };
  const updatedUsers = [...users, newUser];
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
  return true;
}

export function updateUser(userId: string, updatedData: Partial<User>): void {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex > -1) {
    users[userIndex] = { ...users[userIndex], ...updatedData };
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }
}

export function deleteUser(userId: string): void {
  const users = getUsers();
  const updatedUsers = users.filter(u => u.id !== userId);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
}

export function changePassword(userId: string, oldPasswordFromInput: string, newPasswordFromInput: string): { success: boolean, message: string } {
    const users = getUsers();
    const user = users.find(u => u.id === userId);

    if (!user) {
        return { success: false, message: 'Pengguna tidak ditemukan.' };
    }

    if (user.password !== oldPasswordFromInput) {
        return { success: false, message: 'Password lama salah.' };
    }

    // Update password in the user object
    user.password = newPasswordFromInput;
    
    // Save the updated users array back to localStorage
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex > -1) {
        users[userIndex] = user;
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        return { success: true, message: 'Password berhasil diperbarui.' };
    }
    
    return { success: false, message: 'Terjadi kesalahan saat memperbarui password.' };
}
