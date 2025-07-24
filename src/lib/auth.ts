'use client';

import type { User } from './types';

const USERS_STORAGE_KEY = 'app-users';

// Seed the initial admin user if no users are present
const seedInitialUser = () => {
  try {
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    if (!storedUsers || JSON.parse(storedUsers).length === 0) {
      const initialAdmin: User = {
        id: 'superadmin-main',
        username: 'admin',
        password: '123', // Note: Storing plain text passwords is not secure for production.
        jabatan: 'SUPER ADMIN',
        location: 'BP PEKANBARU',
        nik: 'SA001'
      };
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([initialAdmin]));
    }
  } catch (error) {
    console.error('Failed to seed initial user:', error);
  }
};

// Call seed function on script load.
seedInitialUser();

// Function to create both Firebase Auth user and Firestore user profile
export function addUser(userData: Omit<User, 'id'>): { success: boolean; message?: string } {
    const currentUsers = getUsers();
    const nikExists = currentUsers.some(u => u.nik === userData.nik);

    if (nikExists) {
        return { success: false, message: `User with NIK ${userData.nik} already exists.` };
    }

    const newUser = { ...userData, id: new Date().toISOString() };
    currentUsers.push(newUser);
    try {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(currentUsers));
        return { success: true };
    } catch(e) {
        return { success: false, message: 'Failed to save user to localStorage.' };
    }
}


export function getUsers(): User[] {
    try {
        const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
        return storedUsers ? JSON.parse(storedUsers) : [];
    } catch (error) {
        console.error('Failed to get users from localStorage:', error);
        return [];
    }
}

export function updateUser(userId: string, updatedData: Partial<Omit<User, 'password'>>): void {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...updatedData };
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
}

export function deleteUser(userId: string): void {
    const users = getUsers();
    const updatedUsers = users.filter(u => u.id !== userId);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
}

export function changePassword(
  oldPasswordFromInput: string,
  newPasswordFromInput: string
): { success: boolean, message: string } {
  try {
    const activeUserStr = localStorage.getItem('active-user');
    if (!activeUserStr) {
      return { success: false, message: "No active user session." };
    }
    const activeUser: User = JSON.parse(activeUserStr);
    
    const allUsers = getUsers();
    const userInDb = allUsers.find(u => u.id === activeUser.id);
    
    if (!userInDb || userInDb.password !== oldPasswordFromInput) {
        return { success: false, message: "Password lama salah." };
    }

    const updatedUsers = allUsers.map(u => 
        u.id === activeUser.id ? { ...u, password: newPasswordFromInput } : u
    );

    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    // Also update the active user session if needed, or force re-login
    localStorage.removeItem('active-user');

    return { success: true, message: "Password updated successfully." };

  } catch(error) {
    console.error("Password change error:", error);
    return { success: false, message: "An unknown error occurred." };
  }
}
