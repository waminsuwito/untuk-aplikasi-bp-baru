
'use client';

import type { User, Jabatan } from './types';

const USERS_STORAGE_KEY = 'app-users';
const LOGGED_IN_USER_KEY = 'app-logged-in-user';

// --- Default Super Admin ---
const SUPER_ADMIN_DEFAULTS: User = {
  id: 'frp-admin-main',
  username: 'FRP_ADMIN',
  password: 'default-password-123456', // Set a default password
  nik: 'FRP_ADMIN',
  jabatan: 'SUPER ADMIN',
  location: 'BP PEKANBARU',
};

// --- Helper Functions ---

const initializeUsers = (): void => {
  if (typeof window === 'undefined') return;
  const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
  if (!storedUsers) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([SUPER_ADMIN_DEFAULTS]));
  } else {
    // Ensure super admin always exists
    const users: User[] = JSON.parse(storedUsers);
    if (!users.some(u => u.id === SUPER_ADMIN_DEFAULTS.id)) {
      users.push(SUPER_ADMIN_DEFAULTS);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
  }
};

// Initialize on script load
initializeUsers();

export async function getUsers(): Promise<User[]> {
  if (typeof window === 'undefined') return [SUPER_ADMIN_DEFAULTS];
  const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
  return storedUsers ? JSON.parse(storedUsers) : [SUPER_ADMIN_DEFAULTS];
}

export async function addUser(userData: Omit<User, 'id'>): Promise<{ success: boolean; message?: string }> {
  const users = await getUsers();
  if (users.some(u => u.nik === userData.nik)) {
    return { success: false, message: `User with NIK "${userData.nik}" already exists.` };
  }
  const newUser: User = {
    ...userData,
    id: `user-${Date.now()}`,
  };
  users.push(newUser);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  return { success: true };
}

export async function updateUser(userId: string, updatedData: Partial<User>): Promise<void> {
  let users = await getUsers();
  users = users.map(u => (u.id === userId ? { ...u, ...updatedData } : u));
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export async function deleteUser(userId: string): Promise<void> {
  let users = await getUsers();
  users = users.filter(u => u.id !== userId);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export async function loginWithIdentifier(identifier: string, passwordFromInput: string): Promise<Omit<User, 'password'>> {
  const users = await getUsers();
  const user = users.find(u => (u.nik === identifier.toUpperCase() || u.username === identifier.toUpperCase()));

  if (!user) {
    throw new Error('Pengguna tidak ditemukan.');
  }

  if (user.password !== passwordFromInput) {
    throw new Error('Password salah.');
  }
  
  const { password, ...userToReturn } = user;
  
  // Store the logged-in user's info
  localStorage.setItem(LOGGED_IN_USER_KEY, JSON.stringify(userToReturn));
  
  return userToReturn;
}

export async function logout(): Promise<void> {
  localStorage.removeItem(LOGGED_IN_USER_KEY);
}

export function getLoggedInUser(): Omit<User, 'password'> | null {
  if (typeof window === 'undefined') return null;
  const storedUser = localStorage.getItem(LOGGED_IN_USER_KEY);
  return storedUser ? JSON.parse(storedUser) : null;
}


export async function changePassword(oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  const loggedInUser = getLoggedInUser();
  if (!loggedInUser) {
    return { success: false, message: "Tidak ada pengguna yang login." };
  }

  const users = await getUsers();
  const userInDb = users.find(u => u.id === loggedInUser.id);

  if (!userInDb) {
    return { success: false, message: "Pengguna tidak ditemukan di database." };
  }
  
  if (userInDb.password !== oldPassword) {
    return { success: false, message: "Password lama salah." };
  }

  userInDb.password = newPassword;
  await updateUser(userInDb.id, { password: newPassword });

  return { success: true, message: "Password berhasil diubah." };
}
