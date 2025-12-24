'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LogOut, Home, Archive, UserCog, Shield } from 'lucide-react';

import { useFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Button } from '@/components/ui/button';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { auth, user, isUserLoading } = useFirebase();
  const { profile, isLoading: isProfileLoading } = useUserProfile();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If auth state is not loading and there's no user, redirect to login.
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleSignOut = () => {
    if (auth) {
      auth.signOut();
    }
  };

  // While checking for the user, show a global loading screen.
  if (isUserLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  // If no user, useEffect will trigger redirect, so we render nothing to avoid flicker.
  if (!user) {
    return null;
  }

  // At this point, user is authenticated. Now we can show the layout.
  // We can show another loader while profile is loading inside the layout.
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
            <div className="flex items-center gap-3">
                <Avatar>
                    <AvatarImage src={user.photoURL ?? ''} />
                    <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <span className="text-sm font-semibold">{user.displayName}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>
            </div>
        </SidebarHeader>
        <SidebarContent>
            <SidebarMenu>
                <SidebarMenuItem>
                    <Link href="/app" passHref>
                        <SidebarMenuButton asChild isActive={pathname === '/app'}>
                            <span>
                                <Home />
                                <span>Home</span>
                            </span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <Link href="/app/archive" passHref>
                        <SidebarMenuButton asChild isActive={pathname === '/app/archive'}>
                            <span>
                                <Archive />
                                <span>Archive</span>
                            </span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
                {profile?.role === 'admin' && (
                    <SidebarMenuItem>
                         <Link href="/app/admin" passHref>
                            <SidebarMenuButton asChild isActive={pathname === '/app/admin'}>
                               <span>
                                 <UserCog />
                                 <span>Admin</span>
                               </span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                )}
            </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4">
          <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </SidebarFooter>
      </Sidebar>
      <main className="flex-1">
        <header className="flex h-14 items-center justify-between border-b bg-background px-4">
            <SidebarTrigger />
            <div className='flex items-center gap-2'>
                {isProfileLoading ? (
                    <span className='text-sm text-muted-foreground font-medium'>...</span>
                ) : (
                    <>
                        <Shield size={16} className='text-muted-foreground' />
                        <span className='text-sm text-muted-foreground font-medium'>{profile?.role}</span>
                    </>
                )}
            </div>
        </header>
        {isProfileLoading ? <div className="p-8">Loading profile...</div> : children}
      </main>
    </SidebarProvider>
  );
}
