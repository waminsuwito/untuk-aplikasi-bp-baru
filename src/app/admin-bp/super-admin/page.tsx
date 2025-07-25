
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { UserForm, type UserFormValues } from '@/components/admin/user-form';
import { UserList } from '@/components/admin/user-list';
import { type User, type Jabatan } from '@/lib/types';
import { addUser, updateUser, deleteUser, getUsers } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { useEffect, useState, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-provider';


export default function SuperAdminPage() {
  const { isLoading: isAuthLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const userList = await getUsers();
      setUsers(userList || []);
    } catch (error) {
      console.error("Failed to load users:", error);
      toast({ variant: 'destructive', title: "Error", description: "Could not load user data from the database." });
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!isAuthLoading) {
        fetchUsers();
    }
  }, [isAuthLoading, fetchUsers]);

  const handleSaveUser = async (data: UserFormValues, userId: string | null) => {
    const currentUsers = await getUsers();
    
    const nikExists = currentUsers.some(
      (user) => user.nik === data.nik && user.id !== userId
    );

    if (nikExists && userToEdit?.nik !== data.nik) {
      toast({
        variant: 'destructive',
        title: 'Gagal Menyimpan',
        description: `NIK "${data.nik}" sudah digunakan oleh pengguna lain.`,
      });
      return;
    }
    
    if (userId) { // Editing an existing user
      const userDataToUpdate: Partial<User> = {
        username: data.username,
        jabatan: data.jabatan as Jabatan,
        location: data.location,
        nik: data.nik,
      };

      if (data.password) {
        if (data.password.length < 6) {
          toast({
            variant: 'destructive',
            title: 'Password Terlalu Pendek',
            description: 'Password baru harus memiliki setidaknya 6 karakter.',
          });
          return;
        }
        userDataToUpdate.password = data.password; 
        console.warn(`Admin is changing password for user ${userId}.`);
      }

      await updateUser(userId, userDataToUpdate);
      toast({ title: 'User Updated', description: `User "${data.username}" has been updated.` });

    } else { // Creating a new user
       if (!data.password || data.password.length < 6) {
        toast({
          variant: 'destructive',
          title: 'Creation Failed',
          description: 'Password is required and must be at least 6 characters long.',
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
      if (result.success) {
        toast({ title: 'User Created', description: `User "${data.username}" has been created.` });
      } else {
        toast({ variant: 'destructive', title: 'Creation Failed', description: result.message || `Could not create user.`});
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
  
  const usersForDisplay = Array.isArray(users) ? users.map(({ password, ...user }) => user) : [];

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
          </CardHeader>
          <CardContent>
              <UserList users={usersForDisplay} onEdit={handleEditUser} onDelete={handleDeleteUser} />
          </CardContent>
      </Card>
    </div>
  );
}
