import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, History as HistoryIcon } from 'lucide-react';

// Sample Data Type
interface AttendanceRecord {
  id: string;
  date: string;
  clockInTime: string;
  clockOutTime: string;
  status: 'Present' | 'Absent' | 'Late';
}

// Sample Data
const sampleAttendanceData: AttendanceRecord[] = [
  { id: '1', date: '2024-07-20', clockInTime: '09:00 AM', clockOutTime: '05:00 PM', status: 'Present' },
  { id: '2', date: '2024-07-19', clockInTime: '09:15 AM', clockOutTime: '05:05 PM', status: 'Late' },
  { id: '3', date: '2024-07-18', clockInTime: '-', clockOutTime: '-', status: 'Absent' },
  { id: '4', date: '2024-07-17', clockInTime: '08:55 AM', clockOutTime: '04:50 PM', status: 'Present' },
  { id: '5', date: '2024-07-16', clockInTime: '09:05 AM', clockOutTime: '05:10 PM', status: 'Present' },
];

export default function AttendanceHistoryPage() {
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
        <p className="text-center text-muted-foreground">Review your past attendance records.</p>
      </header>

      <main className="w-full max-w-4xl">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Your Records</CardTitle>
            <CardDescription>
              Showing the last {sampleAttendanceData.length} attendance records.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Clock-In Time</TableHead>
                  <TableHead>Clock-Out Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleAttendanceData.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.date}</TableCell>
                    <TableCell>{record.clockInTime}</TableCell>
                    <TableCell>{record.clockOutTime}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold
                        ${record.status === 'Present' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : ''}
                        ${record.status === 'Late' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' : ''}
                        ${record.status === 'Absent' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : ''}
                      `}>
                        {record.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {sampleAttendanceData.length === 0 && (
              <p className="text-center text-muted-foreground mt-4">No attendance records found.</p>
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
