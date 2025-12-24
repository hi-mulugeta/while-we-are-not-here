'use client';

import { useFirebase } from '@/firebase/provider';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc } from 'firebase/firestore';

export function useUserProfile() {
  const { firestore, user } = useFirebase();

  const userDocRef = user && firestore ? doc(firestore, 'users', user.uid) : null;
  
  const { data: profile, isLoading, error } = useDoc(userDocRef);

  return { profile, isLoading, error };
}
