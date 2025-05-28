
"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, LayoutDashboard as DashboardIcon, ShieldAlert, Users as UsersIcon, Loader2, AlertTriangle, LogOut, PlusCircle, XCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  name: string;
  email: string;
}

export default function ReportingDashboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  // State for the add user form
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [isAddingUser, setIsAddingUser] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const adminLoggedIn = localStorage.getItem('isAdminLoggedIn') === 'true';
      if (!adminLoggedIn) {
        router.replace('/admin-login');
      } else {
        setIsAuthenticated(true);
      }
    }
  }, [router]);

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      setError(null);
      const response = await fetch('/api/users');
      if (!response.ok) {
        let errorMessage = `Failed to fetch users: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (jsonError) {
          try {
            const textError = await response.text();
            errorMessage = `${errorMessage}. Server response: ${textError.substring(0, 200)}...`;
          } catch (textParseError) {}
        }
        throw new Error(errorMessage);
      }
      const data: User[] = await response.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
      setUsers([]); // Clear users on error
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('isAdminLoggedIn');
    }
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    router.push('/');
  };

  const handleAddUserSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) {
      toast({
        title: "Missing Information",
        description: "Please enter both name and email.",
        variant: "destructive",
      });
      return;
    }
    setIsAddingUser(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newUserName, email: newUserEmail }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add user.');
      }
      toast({
        title: "User Added",
        description: `User ${newUserName} added successfully.`,
        action: <UsersIcon className="text-green-500" />,
      });
      setNewUserName('');
      setNewUserEmail('');
      setShowAddUserForm(false); // Hide form on success
      fetchUsers(); // Refresh user list
    } catch (err: any) {
      toast({
        title: "Error Adding User",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsAddingUser(false);
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-4">You need to be logged in as an admin to view this page.</p>
        <Link href="/admin-login" passHref>
          <Button>Go to Admin Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-4 sm:p-6 md:p-8 bg-background">
      <header className="mb-8 w-full max-w-4xl">
        <div className="flex justify-between items-center w-full mb-4">
          <Link href="/" passHref>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Button>
          </Link>
          <Button variant="destructive" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
        <div className="flex items-center justify-center mb-2">
          <DashboardIcon className="h-10 w-10 text-primary mr-3" />
          <h1 className="text-3xl sm:text-4xl font-bold text-primary">Reporting Dashboard</h1>
        </div>
        <p className="text-center text-muted-foreground">Generate and view attendance reports, and manage users.</p>
      </header>
      
      <main className="w-full max-w-4xl space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShieldAlert className="mr-2 h-6 w-6 text-accent" />
              Admin Access Required
            </CardTitle>
            <CardDescription>
              This section is intended for administrative use.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The reporting dashboard provides tools for administrators to generate detailed attendance reports,
              manage user data, and oversee overall attendance patterns.
            </p>
            <img 
              src="https://placehold.co/600x300.png" 
              alt="Placeholder graph" 
              data-ai-hint="dashboard chart"
              className="mt-6 rounded-md shadow-sm"
            />
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <UsersIcon className="mr-2 h-6 w-6 text-primary" />
                Registered Users
              </CardTitle>
              <CardDescription>
                List of users registered in the system.
              </CardDescription>
            </div>
            {!showAddUserForm && (
              <Button onClick={() => setShowAddUserForm(true)} size="sm">
                <PlusCircle className="mr-2 h-4 w-4" /> Add User
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {showAddUserForm && (
              <form onSubmit={handleAddUserSubmit} className="mb-6 p-4 border rounded-md bg-muted/30">
                <h3 className="text-lg font-semibold mb-3">Add New User</h3>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="newUserName">Name</Label>
                    <Input
                      id="newUserName"
                      type="text"
                      placeholder="John Doe"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      disabled={isAddingUser}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="newUserEmail">Email</Label>
                    <Input
                      id="newUserEmail"
                      type="email"
                      placeholder="john.doe@example.com"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      disabled={isAddingUser}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isAddingUser} className="flex-1">
                      {isAddingUser ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                      {isAddingUser ? 'Adding...' : 'Add User'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowAddUserForm(false)} disabled={isAddingUser} className="flex-1">
                      <XCircle className="mr-2 h-4 w-4" /> Cancel
                    </Button>
                  </div>
                </div>
              </form>
            )}

            {isLoadingUsers && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading users...</p>
              </div>
            )}
            {error && !isLoadingUsers && (
              <div className="flex flex-col items-center justify-center py-6 text-destructive">
                <AlertTriangle className="mr-2 h-6 w-6" />
                <p>Error loading users: {error}</p>
                <p className="text-sm text-muted-foreground mt-1">Make sure the backend API at /api/users is running correctly.</p>
              </div>
            )}
            {!isLoadingUsers && !error && users.length === 0 && !showAddUserForm && (
              <p className="text-center text-muted-foreground py-6">No users found. Click 'Add User' to create one.</p>
            )}
            {!isLoadingUsers && !error && users.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.id}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} AttendEase. All rights reserved.</p>
      </footer>
    </div>
  );
}
