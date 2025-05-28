
"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, LayoutDashboard as DashboardIcon, ShieldAlert, Users as UsersIcon, Loader2, AlertTriangle } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
}

export default function ReportingDashboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('/api/users');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch users: ${response.statusText}`);
        }
        const data: User[] = await response.json();
        setUsers(data);
      } catch (err: any) {
        setError(err.message);
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUsers();
  }, []);

  return (
    <div className="flex flex-col items-center min-h-screen p-4 sm:p-6 md:p-8 bg-background">
       <header className="mb-8 w-full max-w-4xl text-center">
        <div className="flex justify-start w-full">
          <Link href="/" passHref>
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Button>
          </Link>
        </div>
        <div className="flex items-center justify-center mb-2">
            <DashboardIcon className="h-10 w-10 text-primary mr-3" />
            <h1 className="text-3xl sm:text-4xl font-bold text-primary">Reporting Dashboard</h1>
        </div>
        <p className="text-muted-foreground">Generate and view attendance reports, and manage users.</p>
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
            <p className="mt-4 text-sm text-accent-foreground bg-accent/20 p-3 rounded-md">
              For demonstration purposes, some features are placeholders. In a full application,
              this would be a restricted area with comprehensive functionalities.
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
          <CardHeader>
            <CardTitle className="flex items-center">
              <UsersIcon className="mr-2 h-6 w-6 text-primary" />
              Registered Users
            </CardTitle>
            <CardDescription>
              List of users registered in the system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading users...</p>
              </div>
            )}
            {error && !isLoading && (
              <div className="flex flex-col items-center justify-center py-6 text-destructive">
                <AlertTriangle className="mr-2 h-6 w-6" />
                <p>Error loading users: {error}</p>
                 <p className="text-sm text-muted-foreground mt-1">Make sure the backend API at /api/users is running correctly.</p>
              </div>
            )}
            {!isLoading && !error && users.length === 0 && (
              <p className="text-center text-muted-foreground py-6">No users found.</p>
            )}
            {!isLoading && !error && users.length > 0 && (
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
