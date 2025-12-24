'use client';

import { useFirebase, useMemoFirebase } from '@/firebase/provider';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc } from 'firebase/firestore';

export function useUserProfile() {
  const { firestore, user } = useFirebase();

  const userDocRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  
  const { data: profile, isLoading, error } = useDoc(userDocRef);

  return { profile, isLoading, error };
}
