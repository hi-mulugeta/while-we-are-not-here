'use client';

import { useMemo } from 'react';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where, orderBy } from 'firebase/firestore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ArchivePage() {
  const { firestore, user } = useFirebase();
  const { profile } = useUserProfile();

  const slipsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    
    const baseQuery = collection(firestore, 'messageSlips');

    if (profile?.role === 'admin') {
      // Admins can see all slips, ordered by most recent
      return query(baseQuery, orderBy('createdAt', 'desc'));
    }
    
    // Regular users can only see their own slips, ordered by most recent
    return query(baseQuery, where('creatorId', '==', user.uid), orderBy('createdAt', 'desc'));

  }, [firestore, user, profile]);

  const { data: slips, isLoading } = useCollection(slipsQuery);

  if (isLoading) {
    return <p>Loading archived messages...</p>;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Message Archive</CardTitle>
          <CardDescription>
            {profile?.role === 'admin' ? 'Viewing all message slips.' : 'Viewing your created message slips.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>From</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="hidden lg:table-cell">Message</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slips && slips.length > 0 ? (
                slips.map((slip) => (
                  <TableRow key={slip.id}>
                    <TableCell className="font-medium">{slip.recipient}</TableCell>
                    <TableCell>{slip.senderName}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {slip.date ? format(new Date(slip.date), 'PP') : 'N/A'} at {slip.time}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell max-w-xs truncate">
                      {slip.message}
                    </TableCell>
                    <TableCell className="text-right">
                        {slip.statusUrgent && <Badge variant="destructive" className="mr-1">Urgent</Badge>}
                        {slip.statusRush && <Badge variant="destructive" className="mr-1">Rush</Badge>}
                        {slip.statusPleaseCall && <Badge>Please Call</Badge>}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No archived messages found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
