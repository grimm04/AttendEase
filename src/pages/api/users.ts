
import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/lib/db'; // Import the getDb function

// This type is illustrative. Adjust it based on your actual user data structure.
type User = {
  id?: number;
  name: string;
  email: string;
};

type ErrorResponse = {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<User[] | User | ErrorResponse>
) {
  let db;
  try {
    db = await getDb(); // Get the database instance
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({ error: 'Failed to connect to database' });
  }

  if (req.method === 'GET') {
    try {
      const users = await db.all('SELECT id, name, email FROM users');
      res.status(200).json(users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  } else if (req.method === 'POST') {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    
    if (typeof name !== 'string' || typeof email !== 'string') {
        return res.status(400).json({ error: 'Name and email must be strings' });
    }

    try {
      const result = await db.run(
        'INSERT INTO users (name, email) VALUES (?, ?)',
        name,
        email
      );
      // Check if result contains lastID
      if (typeof result.lastID === 'number') {
        res.status(201).json({ id: result.lastID, name, email });
      } else {
        // Fallback if lastID is not available (should not happen with SQLite INSERT)
        const newUser = await db.get('SELECT id, name, email FROM users WHERE email = ?', email);
        if (newUser) {
          res.status(201).json(newUser);
        } else {
          throw new Error('Failed to retrieve created user');
        }
      }
    } catch (error: any) {
      if (error.message && error.message.includes('UNIQUE constraint failed: users.email')) {
        // More robust check for unique constraint violation
        res.status(409).json({ error: 'User with this email already exists' });
      } else {
        console.error('Failed to create user:', error);
        res.status(500).json({ error: 'Failed to create user' });
      }
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
