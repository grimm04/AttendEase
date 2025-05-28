
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, History as HistoryIcon, Loader2, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';

// Updated Data Type to match API response
interface AttendanceRecord {
  id: string;
  user_id: number;
  date: string;
  clock_in_time: string | null;
  clock_out_time: string | null;
  status: 'Present' | 'Absent' | 'Late' | 'Clocked In';
  location_verified: boolean;
}

// Placeholder User ID - In a real app, this would come from auth
const DEFAULT_USER_ID = 1; 

export default function AttendanceHistoryPage() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAttendanceHistory() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/attendance?userId=${DEFAULT_USER_ID}`);
        if (!response.ok) {
          let errorMessage = `Error: ${response.status} ${response.statusText}`;
          try {
            // Try to parse the error response as JSON
            const errorData = await response.json();
            if (errorData && errorData.error) {
              errorMessage = errorData.error; // Use specific error from API if available
            }
          } catch (jsonError) {
            // If JSON parsing fails, the response body might not be JSON or empty.
            // Stick with the statusText.
          }
          throw new Error(errorMessage);
        }
        const data: AttendanceRecord[] = await response.json();
        setAttendanceRecords(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch attendance history.');
        setAttendanceRecords([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAttendanceHistory();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present':
      case 'Clocked In':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'Late':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Absent':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };


  return (
    <div className="flex flex-col items-center min-h-screen p-4 sm:p-6 md:p-8 bg-background">
      <header className="mb-8 w-full max-w-4xl">
        <Link href="/" passHref>
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Button>
        </Link>
        <div className="flex items-center justify-center mb-2">
            <HistoryIcon className="h-10 w-10 text-primary mr-3" />
            <h1 className="text-3xl sm:text-4xl font-bold text-primary">Attendance History</h1>
        </div>
        <p className="text-center text-muted-foreground">Review your past attendance records (User ID: {DEFAULT_USER_ID}).</p>
      </header>

      <main className="w-full max-w-4xl">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Your Records</CardTitle>
            <CardDescription>
              {isLoading ? "Loading records..." : `Showing ${attendanceRecords.length} attendance records.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading attendance records...</p>
              </div>
            )}
            {error && !isLoading && (
              <div className="flex flex-col items-center justify-center py-6 text-destructive">
                <AlertTriangle className="mr-2 h-6 w-6" />
                <p>Error loading records: {error}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Please ensure user ID {DEFAULT_USER_ID} exists and has attendance data, or try again later.
                  Verify the backend API at /api/attendance is responding correctly.
                </p>
              </div>
            )}
            {!isLoading && !error && attendanceRecords.length === 0 && (
              <p className="text-center text-muted-foreground py-6">No attendance records found for User ID: {DEFAULT_USER_ID}.</p>
            )}
            {!isLoading && !error && attendanceRecords.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Clock-In</TableHead>
                    <TableHead>Clock-Out</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location Verified</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.date}</TableCell>
                      <TableCell>{record.clock_in_time || '-'}</TableCell>
                      <TableCell>{record.clock_out_time || '-'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(record.status)}`}>
                          {record.status}
                        </span>
                      </TableCell>
                       <TableCell>{record.location_verified ? 'Yes' : 'No'}</TableCell>
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
