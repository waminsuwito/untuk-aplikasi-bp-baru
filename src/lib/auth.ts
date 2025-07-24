// This file is for managing user data in localStorage now that Firebase is disconnected.
'use client';

import type { User, Jabatan, UserLocation } from './types';

const USERS_STORAGE_KEY = 'app-users';

// CLEANED UP: Only one admin user by default.
const initialUsers: User[] = [
    { id: 'superadmin-main', username: 'admin', jabatan: 'SUPER ADMIN', location: 'BP PEKANBARU', nik: 'SA001', password: '123' },
];

export function getUsers(): User[] {
  try {
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    if (storedUsers) {
      return JSON.parse(storedUsers);
    } else {
      // If no users are stored, initialize with the default admin
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialUsers));
      return initialUsers;
    }
  } catch (error) {
    console.error("Failed to parse users from localStorage", error);
    // Fallback to default users if parsing fails
    return initialUsers;
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
