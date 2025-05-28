
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, LogIn as LogInIcon, ShieldCheck } from 'lucide-react';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // If already logged in as admin, redirect to dashboard
    if (typeof window !== 'undefined' && localStorage.getItem('isAdminLoggedIn') === 'true') {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call / credential check
    setTimeout(() => {
      if (username === 'admin' && password === 'admin') {
        if (typeof window !== 'undefined') {
            localStorage.setItem('isAdminLoggedIn', 'true');
        }
        toast({
          title: "Login Successful",
          description: "Redirecting to dashboard...",
          action: <ShieldCheck className="text-green-500" />,
        });
        router.push('/dashboard');
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid username or password.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 md:p-8 bg-background">
      <header className="mb-8 w-full max-w-md">
        <div className="flex justify-start w-full">
          <Link href="/" passHref>
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Button>
          </Link>
        </div>
        <div className="flex items-center justify-center mb-2">
          <ShieldCheck className="h-10 w-10 text-primary mr-3" />
          <h1 className="text-3xl sm:text-4xl font-bold text-primary">Admin Login</h1>
        </div>
        <p className="text-center text-muted-foreground">Access the reporting dashboard.</p>
      </header>

      <main className="w-full max-w-sm">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Enter Credentials</CardTitle>
            <CardDescription>Use 'admin' for both username and password for this demo.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="admin"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Logging in...' : <><LogInIcon className="mr-2 h-4 w-4" /> Login</>}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} AttendEase. All rights reserved.</p>
        <p className="text-xs mt-1">Admin login is simulated and not secure for production.</p>
      </footer>
    </div>
  );
}
