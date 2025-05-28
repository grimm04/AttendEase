
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

type SuccessClockInResponse = AttendanceRecord & { message: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessClockInResponse | AttendanceRecord | AttendanceRecord[] | ErrorResponse>
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

  if (req.method === 'POST' && req.url?.includes('/api/attendance/clock-in')) {
    try {
      const { userId, locationVerified } = req.body;

      if (userId === undefined || userId === null) { // More robust check for userId
        return res.status(400).json({ error: 'User ID is required' });
      }
      const numericUserId = parseInt(String(userId), 10); // Ensure it's a string before parseInt
      if (isNaN(numericUserId)) {
        return res.status(400).json({ error: 'User ID must be a valid number.' });
      }

      if (typeof locationVerified !== 'boolean') {
        return res.status(400).json({ error: 'Location verification status is required and must be a boolean' });
      }

      const user = await db.get('SELECT id FROM users WHERE id = ?', numericUserId);
      if (!user) {
        return res.status(404).json({ error: `User with ID ${numericUserId} not found` });
      }
      
      const existingRecord = await db.get(
        'SELECT * FROM attendance WHERE user_id = ? AND date = ?',
        numericUserId,
        currentDate
      );

      if (existingRecord && existingRecord.clock_in_time) {
        return res.status(409).json({ error: 'User already clocked in today.' });
      }
      
      let recordIdToFetch;
      let httpStatus = 201; // Default to 201 Created

      if (existingRecord) { // User was marked absent, now clocking in
          await db.run(
            'UPDATE attendance SET clock_in_time = ?, status = ?, location_verified = ? WHERE id = ?',
            currentTime,
            'Clocked In',
            locationVerified ? 1 : 0,
            existingRecord.id
          );
          recordIdToFetch = existingRecord.id;
          httpStatus = 200; // OK for update
      } else { // New clock-in record
           const result = await db.run(
            'INSERT INTO attendance (user_id, date, clock_in_time, status, location_verified) VALUES (?, ?, ?, ?, ?)',
            numericUserId,
            currentDate,
            currentTime,
            'Clocked In',
            locationVerified ? 1 : 0
          );
          if (typeof result.lastID !== 'number') {
            console.error('Failed to get lastID after insert for user:', numericUserId, 'result:', result);
            throw new Error('Database did not return a lastID after insert.');
          }
          recordIdToFetch = result.lastID;
      }

      const finalRecord = await db.get('SELECT * FROM attendance WHERE id = ?', recordIdToFetch);
      if (!finalRecord) {
          console.error('Failed to retrieve record after insert/update for ID:', recordIdToFetch);
          throw new Error('Failed to retrieve attendance record after database operation.');
      }
      
      const responsePayload: SuccessClockInResponse = {
        ...(finalRecord as AttendanceRecord), // Cast here as we expect it to be full record
        message: `Successfully clocked in User ID ${numericUserId}.`
      };
      return res.status(httpStatus).json(responsePayload);

    } catch (error: any) {
      console.error(`Clock-in processing error for User ID ${req.body.userId}:`, error);
      if (error.message && error.message.includes('UNIQUE constraint failed')) {
         return res.status(409).json({ error: 'Attendance record for this user and date already exists (UNIQUE constraint).' });
      }
      // Ensure any other error also returns JSON
      return res.status(500).json({ error: `Failed to record clock-in: ${error.message || 'Unknown server error'}` });
    }
  } else if (req.method === 'PUT' && req.url?.includes('/api/attendance/clock-out')) {
    try {
        const { userId } = req.body; 

        if (userId === undefined || userId === null) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        const numericUserId = parseInt(String(userId), 10);
        if (isNaN(numericUserId)) {
            return res.status(400).json({ error: 'User ID must be a valid number.' });
        }

        const record = await db.get(
            'SELECT * FROM attendance WHERE user_id = ? AND date = ? AND status = ?',
            numericUserId,
            currentDate,
            'Clocked In'
        );

        if (!record) {
            return res.status(404).json({ error: 'No active clock-in found for today to clock out.' });
        }

        const newStatus = 'Present'; 

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
        return res.status(200).json(updatedRecord as AttendanceRecord);
    } catch (error: any) {
        console.error(`Clock-out error for User ID ${req.body.userId}:`, error);
        return res.status(500).json({ error: `Failed to record clock-out: ${error.message || 'Unknown server error'}` });
    }
  } else if (req.method === 'GET') {
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
            const records = await db.all(
                'SELECT a.id, a.user_id, u.name as user_name, u.email as user_email, a.date, a.clock_in_time, a.clock_out_time, a.status, a.location_verified FROM attendance a JOIN users u ON a.user_id = u.id ORDER BY a.date DESC, u.name ASC'
            );
            return res.status(200).json(records.map(r => ({...r, location_verified: !!r.location_verified})) as AttendanceRecord[]);
        }
    } catch (error: any) {
        console.error('Fetch attendance error:', error);
        return res.status(500).json({ error: `Failed to fetch attendance records: ${error.message || 'Unknown server error'}` });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
