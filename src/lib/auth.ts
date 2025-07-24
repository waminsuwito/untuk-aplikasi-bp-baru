// This file is intentionally left blank as Firebase authentication is removed.

import type { User } from './types';

export function getUsers(): User[] {
  // Return an empty array as there's no database connection.
  return [];
}

export function createEmailFromNik(nik: string) {
    // This function remains for compatibility but is not used for authentication.
    return `${nik}@example.com`;
}

// All other functions like addUser, updateUser, deleteUser, changePassword, etc.
// are removed as they require a Firebase connection.
