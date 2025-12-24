'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, doc } from 'firebase/firestore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminPage() {
  const { firestore, user } = useFirebase();
  const { profile, isLoading: isProfileLoading } = useUserProfile();
  const router = useRouter();

  useEffect(() => {
    if (!isProfileLoading && profile?.role !== 'admin') {
      router.push('/app');
    }
  }, [profile, isProfileLoading, router]);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);

  const { data: users, isLoading: isUsersLoading } = useCollection(usersQuery);

  const handleRoleChange = (uid: string, role: 'user' | 'admin') => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', uid);
    updateDocumentNonBlocking(userRef, { role });
  };

  if (isProfileLoading || profile?.role !== 'admin') {
    return <p>Loading or redirecting...</p>;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
          <CardDescription>Manage user roles.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isUsersLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : (
                users?.map((u: any) => (
                  <TableRow key={u.uid}>
                    <TableCell className="font-medium flex items-center gap-2">
                        <Avatar>
                            <AvatarImage src={u.photoURL} alt={u.displayName} />
                            <AvatarFallback>{u.displayName?.[0]}</AvatarFallback>
                        </Avatar>
                        {u.displayName}
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell className="text-right">
                      <Select
                        value={u.role}
                        onValueChange={(value: 'user' | 'admin') => handleRoleChange(u.uid, value)}
                        disabled={u.uid === user?.uid}
                      >
                        <SelectTrigger className="w-[120px] ml-auto">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
