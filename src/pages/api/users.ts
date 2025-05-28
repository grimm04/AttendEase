
import type { NextApiRequest, NextApiResponse } from 'next';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// This type is illustrative. Adjust it based on your actual user data structure.
type User = {
  id?: number;
  name: string;
  email: string;
};

type ErrorResponse = {
  error: string;
};

// Database connection variable
let db: any = null;

// Function to initialize the database connection and create table if it doesn't exist
async function initializeDatabase() {
  if (!db) {
    // Open a database connection.
    // The database file will be created in the project root if it doesn't exist.
    db = await open({
      filename: './users.db', // Database file will be in the project root
      driver: sqlite3.Database,
    });

    // Create the users table if it doesn't already exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE
      )
    `);
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<User[] | User | ErrorResponse>
) {
  try {
    await initializeDatabase();
  } catch (error) {
    console.error('Database initialization error:', error);
    return res.status(500).json({ error: 'Failed to initialize database' });
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
      res.status(201).json({ id: result.lastID, name, email });
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT') {
        // Specifically, SQLITE_CONSTRAINT_UNIQUE for the email field
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
