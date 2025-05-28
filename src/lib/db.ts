
import sqlite3 from 'sqlite3';
import { open, type Database } from 'sqlite';

// Database connection variable
let db: Database | null = null;

// Function to initialize the database connection and create tables if they don't exist
export async function initializeDatabase(): Promise<Database> {
  if (!db) {
    db = await open({
      filename: './attendee.db', // Database file will be in the project root
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

    // Create the attendance table if it doesn't already exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        date TEXT NOT NULL, -- YYYY-MM-DD
        clock_in_time TEXT, -- HH:MM:SS
        clock_out_time TEXT, -- HH:MM:SS
        status TEXT NOT NULL CHECK(status IN ('Present', 'Absent', 'Late', 'Clocked In')),
        location_verified INTEGER NOT NULL DEFAULT 0, -- 0 for false, 1 for true
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE (user_id, date) -- A user has one attendance record per day
      )
    `);
  }
  return db;
}

// Function to get the database instance
export async function getDb(): Promise<Database> {
  if (!db) {
    return initializeDatabase();
  }
  return db;
}
