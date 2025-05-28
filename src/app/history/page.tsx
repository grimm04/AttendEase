
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, History as HistoryIcon, Loader2, AlertTriangle, UserSearch, Edit3 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";

interface AttendanceRecord {
  id: string;
  user_id: number;
  date: string;
  clock_in_time: string | null;
  clock_out_time: string | null;
  status: 'Present' | 'Absent' | 'Late' | 'Clocked In';
  location_verified: boolean;
}

export default function AttendanceHistoryPage() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Unified loading state
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [inputUserId, setInputUserId] = useState<string>('');
  const [isIdInputMode, setIsIdInputMode] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const userIdFromStorage = localStorage.getItem('currentUserId');
    if (userIdFromStorage) {
      setCurrentUserId(userIdFromStorage);
      setInputUserId(userIdFromStorage);
      setIsIdInputMode(false);
    } else {
      setIsIdInputMode(true);
    }
  }, []);

  useEffect(() => {
    if (currentUserId && !isIdInputMode) {
      fetchAttendanceHistory(currentUserId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, isIdInputMode]);

  const fetchAttendanceHistory = async (userIdToFetch: string) => {
    if (!userIdToFetch || isNaN(parseInt(userIdToFetch))) {
      setError("Invalid User ID provided.");
      setAttendanceRecords([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/attendance?userId=${userIdToFetch}`);
      if (!response.ok) {
        let errorMessage = `Error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (jsonError) {
          // If JSON parsing fails, stick with statusText
        }
        throw new Error(errorMessage);
      }
      const data: AttendanceRecord[] = await response.json();
      setAttendanceRecords(data);
      if (data.length === 0) {
        toast({
            title: "No Records Found",
            description: `No attendance records found for User ID: ${userIdToFetch}.`,
            variant: "default"
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch attendance history.');
      setAttendanceRecords([]);
      toast({
        title: "Error Loading Records",
        description: err.message || 'Failed to fetch attendance history.',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleIdSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputUserId || isNaN(parseInt(inputUserId))) {
      setError("Please enter a valid numeric User ID.");
      toast({
        title: "Invalid User ID",
        description: "Please enter a valid numeric User ID.",
        variant: "destructive",
      });
      return;
    }
    setCurrentUserId(inputUserId);
    localStorage.setItem('currentUserId', inputUserId);
    setIsIdInputMode(false);
    // fetchAttendanceHistory will be triggered by useEffect
  };

  const handleSwitchUser = () => {
    setIsIdInputMode(true);
    setCurrentUserId(null); // Clear current user to stop fetching
    setAttendanceRecords([]); // Clear records
    setError(null);
    // localStorage.removeItem('currentUserId'); // Optional: clear from storage immediately
  };
  
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
        <p className="text-center text-muted-foreground">
          {currentUserId && !isIdInputMode ? `Review your past attendance records (User ID: ${currentUserId}).` : "Enter your User ID to view history."}
        </p>
      </header>

      <main className="w-full max-w-4xl">
        {isIdInputMode ? (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center"><UserSearch className="mr-2 h-6 w-6 text-primary" />Enter User ID</CardTitle>
              <CardDescription>Please enter your User ID to view your attendance history.</CardDescription>
            </CardHeader>
            <form onSubmit={handleIdSubmit}>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="historyUserId">User ID</Label>
                  <Input
                    id="historyUserId"
                    type="text"
                    placeholder="Your User ID (e.g., 1)"
                    value={inputUserId}
                    onChange={(e) => {
                        setInputUserId(e.target.value);
                        if (error) setError(null); // Clear error on input change
                    }}
                    required
                    pattern="\d*"
                    title="Please enter a numeric User ID."
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive flex items-center">
                    <AlertTriangle className="mr-1 h-4 w-4" /> {error}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "View History"}
                </Button>
              </CardContent>
            </form>
          </Card>
        ) : (
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle>Your Records (User ID: {currentUserId})</CardTitle>
                <CardDescription>
                  {isLoading ? "Loading records..." : `Showing ${attendanceRecords.length} attendance records.`}
                </CardDescription>
              </div>
              <Button variant="outline" onClick={handleSwitchUser} size="sm">
                <Edit3 className="mr-2 h-4 w-4" /> Switch User ID
              </Button>
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
                    Please ensure User ID {currentUserId} exists and has attendance data, or try again later.
                    Verify the backend API at /api/attendance is responding correctly.
                  </p>
                </div>
              )}
              {!isLoading && !error && attendanceRecords.length === 0 && (
                <p className="text-center text-muted-foreground py-6">No attendance records found for User ID: {currentUserId}.</p>
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
        )}
      </main>
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} AttendEase. All rights reserved.</p>
      </footer>
    </div>
  );
}
