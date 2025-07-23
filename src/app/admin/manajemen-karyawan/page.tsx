'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { UserForm, type UserFormValues } from '@/components/admin/user-form';
import { UserList } from '@/components/admin/user-list';
import { type User, type Jabatan } from '@/lib/types';
import { getUsers, addUser, updateUser, deleteUser } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { useEffect, useState, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-provider';


export default function ManajemenKaryawanPage() {
  const { isLoading: isAuthLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const userList = await getUsers();
      setUsers(userList || []); // Ensure userList is an array, fallback to empty array
    } catch (error) {
      console.error("Failed to load users:", error);
      toast({ variant: 'destructive', title: "Error", description: "Could not load user data from the database." });
      setUsers([]); // On error, ensure users is an empty array
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // Only fetch users once the authentication process is complete
    if (!isAuthLoading) {
      fetchUsers();
    }
  }, [isAuthLoading, fetchUsers]);

  const handleSaveUser = async (data: UserFormValues, userId: string | null) => {
    const currentUsers = await getUsers();
    const nikExists = currentUsers.some(
      (user) => user.nik === data.nik && user.id !== userId
    );

    if (nikExists) {
      toast({
        variant: 'destructive',
        title: 'Gagal Menyimpan',
        description: `NIK "${data.nik}" sudah digunakan oleh pengguna lain.`,
      });
      return;
    }
    
    if (userId) {
      const userDataToUpdate: Partial<User> = {
        username: data.username,
        jabatan: data.jabatan as Jabatan,
        location: data.location,
        nik: data.nik,
      };
      if (data.password) {
        // For editing, we assume password change is handled elsewhere or requires re-authentication.
        // The simplified approach is to not allow password changes from this form directly for existing users.
        // Or, we need a separate, more secure flow for it.
        // For now, we will just update other details. If password change is needed, it's a separate feature.
        console.warn("Password change for existing users from this form is not implemented.");
      }
      await updateUser(userId, userDataToUpdate);
      toast({ title: 'User Updated', description: `User "${data.username}" has been updated.` });
    } else {
       if (!data.password) {
        toast({
          variant: 'destructive',
          title: 'Creation Failed',
          description: 'Password is required for new users.',
        });
        return;
      }
      const newUser: Omit<User, 'id'> = {
        username: data.username,
        password: data.password,
        jabatan: data.jabatan as Jabatan,
        location: data.location,
        nik: data.nik,
      };
      
      const result = await addUser(newUser);
      if (result) {
        toast({ title: 'User Created', description: `User "${data.username}" has been created.` });
      } else {
        toast({ variant: 'destructive', title: 'Creation Failed', description: `Could not create user. Please check console for details.`});
      }
    }
    
    await fetchUsers();
    setUserToEdit(null);
  };
  
  const handleEditUser = (id: string) => {
    const user = users.find(u => u.id === id);
    if (user) {
      setUserToEdit(user);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDeleteUser = async (id: string) => {
    await deleteUser(id);
    await fetchUsers();
  };

  const handleCancelEdit = () => {
    setUserToEdit(null);
  };

  const usersForDisplay = Array.isArray(users) ? users.map(({ password, ...user }) => user) : [];

  if (isLoading || isAuthLoading) {
    return (
        <div className="w-full max-w-4xl space-y-6 mx-auto">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-40 w-full" />
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="w-full max-w-4xl space-y-6 mx-auto">
       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
             <Shield className="h-6 w-6 text-primary" />
             {userToEdit ? 'Edit User' : 'Create New User'}
          </CardTitle>
          <CardDescription>
            {userToEdit ? `Editing user: ${userToEdit.username}` : 'Add a new user and assign them a role.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserForm
            onSave={handleSaveUser}
            userToEdit={userToEdit}
            onCancel={handleCancelEdit}
          />
        </CardContent>
      </Card>
      
      <Separator />

      <Card>
          <CardHeader>
              <CardTitle>Manage Users</CardTitle>
              <CardDescription>View, edit, or delete existing users.</CardDescription>
          </Header>
          <CardContent>
              <UserList users={usersForDisplay} onEdit={handleEditUser} onDelete={handleDeleteUser} />
          </CardContent>
      </Card>
    </div>
  );
}