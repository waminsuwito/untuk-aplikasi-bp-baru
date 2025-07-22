

'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type User, type Jabatan, jabatanOptions, userLocations } from '@/lib/types';

const formSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters long.' }),
  password: z.string().min(1, { message: 'Password minimal 1 karakter.' }).optional().or(z.literal('')),
  nik: z.string().min(1, { message: 'NIK is required.' }),
  jabatan: z.enum(jabatanOptions),
  location: z.enum(userLocations),
});

export type UserFormValues = z.infer<typeof formSchema>;

interface UserFormProps {
  onSave: (data: UserFormValues, userId: string | null) => void;
  onCancel: () => void;
  userToEdit: User | null;
}

export function UserForm({ onSave, onCancel, userToEdit }: UserFormProps) {
  const isEditing = !!userToEdit;

  const form = useForm<UserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
      nik: '',
      jabatan: 'HELPER',
      location: 'BP PEKANBARU',
    },
  });

  useEffect(() => {
    if (userToEdit) {
      form.reset({
        username: userToEdit.username,
        password: '', // Don't pre-fill password
        jabatan: userToEdit.jabatan,
        location: userToEdit.location || 'BP PEKANBARU',
        nik: userToEdit.nik || '',
      });
    } else {
      form.reset({
        username: '',
        password: '',
        nik: '',
        jabatan: 'HELPER',
        location: 'BP PEKANBARU',
      });
    }
  }, [userToEdit, form]);

  function onSubmit(values: UserFormValues) {
    if (isEditing && !values.password) {
      // @ts-ignore
      delete values.password;
    }
    
    onSave(values, userToEdit?.id || null);
    
    if (!isEditing) {
      form.reset();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="contoh umar santoso" {...field} style={{ textTransform: 'uppercase' }} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder={isEditing ? 'Leave blank to keep current password' : 'Enter password'} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
            control={form.control}
            name="nik"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NIK</FormLabel>
                <FormControl>
                  <Input placeholder="contoh 88" {...field} style={{ textTransform: 'uppercase' }} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        
        <FormField
          control={form.control}
          name="jabatan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jabatan</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a jabatan" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {jabatanOptions.map((jabatan) => (
                    <SelectItem key={jabatan} value={jabatan}>
                      {jabatan}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {userLocations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          {isEditing && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
          <Button type="submit">{isEditing ? 'Update User' : 'Create User'}</Button>
        </div>
      </form>
    </Form>
  );
}
