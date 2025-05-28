
import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/db';
import { format } from 'date-fns';

type AttendanceRecord = {
  id?: number;
  user_id: number;
  date: string; // YYYY-MM-DD
  clock_in_time?: string | null; // HH:MM:SS
  clock_out_time?: string | null; // HH:MM:SS
  status: 'Present' | 'Absent' | 'Late' | 'Clocked In';
  location_verified: boolean;
};

type ErrorResponse = {
  error: string;
};

// This endpoint will now primarily handle fetching attendance records
// and could handle clock-out if we create a specific PUT handler here or a separate file.
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AttendanceRecord[] | AttendanceRecord | ErrorResponse>
) {
  let db;
  try {
    db = await getDb();
  } catch (dbError: any) {
    console.error('FATAL: Database connection error in /api/attendance:', dbError);
    return res.status(500).json({ error: `Failed to connect to database: ${dbError.message}` });
  }

  const currentDate = format(new Date(), 'yyyy-MM-dd');
  const currentTime = format(new Date(), 'HH:mm:ss');

  if (req.method === 'GET') {
    try {
        const { userId } = req.query;

        if (userId) {
            if (typeof userId !== 'string' || isNaN(parseInt(userId, 10))) {
                return res.status(400).json({ error: 'User ID query parameter must be a valid number.' });
            }
            const numericUserId = parseInt(userId, 10);
            const records = await db.all(
                'SELECT id, user_id, date, clock_in_time, clock_out_time, status, location_verified FROM attendance WHERE user_id = ? ORDER BY date DESC',
                numericUserId
            );
            return res.status(200).json(records.map(r => ({...r, location_verified: !!r.location_verified})) as AttendanceRecord[]);
        } else {
            // Admin: Get all records with user details
            const records = await db.all(
                'SELECT a.id, a.user_id, u.name as user_name, u.email as user_email, a.date, a.clock_in_time, a.clock_out_time, a.status, a.location_verified FROM attendance a JOIN users u ON a.user_id = u.id ORDER BY a.date DESC, u.name ASC'
            );
            return res.status(200).json(records.map(r => ({...r, location_verified: !!r.location_verified})) as AttendanceRecord[]);
        }
    } catch (error: any) {
        console.error('Fetch attendance error:', error);
        return res.status(500).json({ error: `Failed to fetch attendance records: ${error.message || 'Unknown server error'}` });
    }
  } else if (req.method === 'PUT') { // Example: Clock-out can live here or be moved to /api/attendance/clock-out.ts
    // For now, keeping clock-out logic here as an example.
    // Ensure frontend calls PUT /api/attendance for this.
    try {
        const { userId } = req.body; 

        if (userId === undefined || userId === null) {
            return res.status(400).json({ error: 'User ID is required for clock-out' });
        }
        const numericUserId = parseInt(String(userId), 10);
        if (isNaN(numericUserId)) {
            return res.status(400).json({ error: 'User ID must be a valid number for clock-out.' });
        }

        const record = await db.get(
            'SELECT * FROM attendance WHERE user_id = ? AND date = ? AND (status = ? OR status = ?)', // Allow clocking out if 'Clocked In' or 'Present' (if they clocked in and out, then in again)
            numericUserId,
            currentDate,
            'Clocked In',
            'Present' // Consider if user might clock in again after clocking out
        );

        if (!record) {
            return res.status(404).json({ error: 'No active clock-in found for today to clock out, or already clocked out.' });
        }
        
        if (!record.clock_in_time) {
             return res.status(400).json({ error: 'Cannot clock out. User was never clocked in today.' });
        }

        const newStatus = 'Present'; // Successfully clocked out means they were present

        await db.run(
            'UPDATE attendance SET clock_out_time = ?, status = ? WHERE id = ?',
            currentTime,
            newStatus,
            record.id
        );
        const updatedRecord = await db.get('SELECT * FROM attendance WHERE id = ?', record.id);
        if (!updatedRecord) {
            throw new Error('Failed to retrieve updated record after clock-out.');
        }
        return res.status(200).json({...updatedRecord, location_verified: !!updatedRecord.location_verified} as AttendanceRecord);
    } catch (error: any) {
        console.error(`Clock-out error for User ID ${req.body.userId}:`, error);
        return res.status(500).json({ error: `Failed to record clock-out: ${error.message || 'Unknown server error'}` });
    }
  }
  else {
    res.setHeader('Allow', ['GET', 'PUT']); // Adjusted based on current handlers in this file
    return res.status(405).json({ error: `Method ${req.method} Not Allowed on /api/attendance` });
  }
}
