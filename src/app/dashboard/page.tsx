import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, LayoutDashboard as DashboardIcon, ShieldAlert } from 'lucide-react';

export default function ReportingDashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 md:p-8 bg-background">
       <header className="mb-8 w-full max-w-2xl text-center">
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
        <p className="text-muted-foreground">Generate and view attendance reports.</p>
      </header>
      
      <main className="w-full max-w-2xl">
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
              For demonstration purposes, this page is a placeholder. In a full application,
              this would be a restricted area with comprehensive reporting functionalities.
            </p>
            <img 
              src="https://placehold.co/600x300.png" 
              alt="Placeholder graph" 
              data-ai-hint="dashboard chart" 
              className="mt-6 rounded-md shadow-sm"
            />
          </CardContent>
        </Card>
      </main>
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} AttendEase. All rights reserved.</p>
      </footer>
    </div>
  );
}
