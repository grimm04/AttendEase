
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AttendanceRecord | AttendanceRecord[] | ErrorResponse | { message: string }>
) {
  let db;
  try {
    db = await getDb();
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({ error: 'Failed to connect to database' });
  }

  const currentDate = format(new Date(), 'yyyy-MM-dd');
  const currentTime = format(new Date(), 'HH:mm:ss');

  if (req.method === 'POST' && req.url?.includes('/api/attendance/clock-in')) {
    const { userId, locationVerified } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    if (typeof locationVerified !== 'boolean') {
      return res.status(400).json({ error: 'Location verification status is required and must be a boolean' });
    }

    try {
      // Check if user exists
      const user = await db.get('SELECT id FROM users WHERE id = ?', userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const existingRecord = await db.get(
        'SELECT * FROM attendance WHERE user_id = ? AND date = ?',
        userId,
        currentDate
      );

      if (existingRecord && existingRecord.clock_in_time) {
        return res.status(409).json({ error: 'User already clocked in today.' });
      }
      
      // If record exists due to being marked 'Absent' earlier, update it
      if (existingRecord) {
          const result = await db.run(
            'UPDATE attendance SET clock_in_time = ?, status = ?, location_verified = ? WHERE id = ?',
            currentTime,
            'Clocked In',
            locationVerified ? 1 : 0,
            existingRecord.id
          );
          const updatedRecord = await db.get('SELECT * FROM attendance WHERE id = ?', existingRecord.id);
          return res.status(200).json(updatedRecord as AttendanceRecord);
      } else {
           const result = await db.run(
            'INSERT INTO attendance (user_id, date, clock_in_time, status, location_verified) VALUES (?, ?, ?, ?, ?)',
            userId,
            currentDate,
            currentTime,
            'Clocked In',
            locationVerified ? 1 : 0
          );
          if (typeof result.lastID !== 'number') {
            throw new Error('Failed to get lastID after insert.');
          }
          const newRecord = await db.get('SELECT * FROM attendance WHERE id = ?', result.lastID);
          return res.status(201).json(newRecord as AttendanceRecord);
      }


    } catch (error: any) {
      console.error('Clock-in error:', error);
      if (error.message && error.message.includes('UNIQUE constraint failed')) {
         return res.status(409).json({ error: 'Attendance record for this user and date already exists.' });
      }
      return res.status(500).json({ error: 'Failed to record clock-in' });
    }
  } else if (req.method === 'PUT' && req.url?.includes('/api/attendance/clock-out')) {
    const { userId } = req.body; // Assuming clock-out is for the current user for today

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    try {
      const record = await db.get(
        'SELECT * FROM attendance WHERE user_id = ? AND date = ? AND status = ?',
        userId,
        currentDate,
        'Clocked In'
      );

      if (!record) {
        return res.status(404).json({ error: 'No active clock-in found for today to clock out.' });
      }

      // Simple status update for now. "Late" logic would need business rules.
      const newStatus = 'Present'; 

      await db.run(
        'UPDATE attendance SET clock_out_time = ?, status = ? WHERE id = ?',
        currentTime,
        newStatus,
        record.id
      );
      const updatedRecord = await db.get('SELECT * FROM attendance WHERE id = ?', record.id);
      return res.status(200).json(updatedRecord as AttendanceRecord);
    } catch (error) {
      console.error('Clock-out error:', error);
      return res.status(500).json({ error: 'Failed to record clock-out' });
    }
  } else if (req.method === 'GET') {
    const { userId } = req.query;

    try {
      if (userId) {
        if (isNaN(Number(userId))) {
          return res.status(400).json({ error: 'User ID must be a number.' });
        }
        const records = await db.all(
          'SELECT id, user_id, date, clock_in_time, clock_out_time, status, location_verified FROM attendance WHERE user_id = ? ORDER BY date DESC',
          Number(userId)
        );
        return res.status(200).json(records.map(r => ({...r, location_verified: !!r.location_verified})) as AttendanceRecord[]);
      } else {
        // Admin: Get all records
        const records = await db.all(
          'SELECT a.id, a.user_id, u.name as user_name, u.email as user_email, a.date, a.clock_in_time, a.clock_out_time, a.status, a.location_verified FROM attendance a JOIN users u ON a.user_id = u.id ORDER BY a.date DESC, u.name ASC'
        );
        return res.status(200).json(records.map(r => ({...r, location_verified: !!r.location_verified})) as AttendanceRecord[]);
      }
    } catch (error) {
      console.error('Fetch attendance error:', error);
      return res.status(500).json({ error: 'Failed to fetch attendance records' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

