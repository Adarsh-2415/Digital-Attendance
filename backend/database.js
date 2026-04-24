import initSqlJs from 'sql.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, 'database.sqlite');

let db;

export async function initDatabase() {
  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
    console.log('✅ Loaded existing database');
  } else {
    db = new SQL.Database();
    console.log('✅ Created new database');
  }

  // Create users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fullName TEXT NOT NULL,
      qid TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      department TEXT,
      section TEXT,
      year TEXT,
      semester TEXT,
      profileCompleted INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);

  // Migrations for Student Profile & Dynamic Details
  try {
    db.run("ALTER TABLE users ADD COLUMN department TEXT");
  } catch (e) {}
  try {
    db.run("ALTER TABLE users ADD COLUMN section TEXT");
  } catch (e) {}
  try {
    db.run("ALTER TABLE users ADD COLUMN year TEXT");
  } catch (e) {}
  try {
    db.run("ALTER TABLE users ADD COLUMN semester TEXT");
  } catch (e) {}
  try {
    db.run("ALTER TABLE users ADD COLUMN profileCompleted INTEGER DEFAULT 0");
  } catch (e) {}

  // Create attendance_requests table
  db.run(`
    CREATE TABLE IF NOT EXISTS attendance_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId INTEGER NOT NULL,
      courseSecDept TEXT NOT NULL,
      yearSemester TEXT NOT NULL,
      eventName TEXT NOT NULL,
      eventDate TEXT NOT NULL,
      endDate TEXT,
      eventType TEXT NOT NULL,
      roleInEvent TEXT NOT NULL,
      reason TEXT NOT NULL,
      declarationAccepted INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      rejectionReason TEXT,
      processedBy TEXT,
      updatedAt TEXT,
      proofPath TEXT,
      fileSize INTEGER,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (studentId) REFERENCES users(id)
    )
  `);

  // Migration: Add new columns if they don't exist
  try {
    db.run("ALTER TABLE attendance_requests ADD COLUMN rejectionReason TEXT");
  } catch (e) {}
  try {
    db.run("ALTER TABLE attendance_requests ADD COLUMN processedBy TEXT");
  } catch (e) {}
  try {
    db.run("ALTER TABLE attendance_requests ADD COLUMN updatedAt TEXT");
  } catch (e) {}
  try {
    db.run("ALTER TABLE attendance_requests ADD COLUMN proofPath TEXT");
  } catch (e) {}
  try {
    db.run("ALTER TABLE attendance_requests ADD COLUMN fileSize INTEGER");
  } catch (e) {}

  saveDatabase();
  console.log('✅ Synchronized attendance_requests schema');

  // Create attendance_participants table
  db.run(`
    CREATE TABLE IF NOT EXISTS attendance_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requestId INTEGER NOT NULL,
      name TEXT NOT NULL,
      qid TEXT NOT NULL,
      courseSecDeptOpt TEXT,
      yearOpt TEXT,
      FOREIGN KEY (requestId) REFERENCES attendance_requests(id)
    )
  `);

  // Migration for attendance_participants
  try {
    db.run("ALTER TABLE attendance_participants ADD COLUMN yearOpt TEXT");
  } catch (e) {}

  // Migration for erpMarked
  try {
    db.run("ALTER TABLE attendance_request_lectures ADD COLUMN erpMarked INTEGER DEFAULT 0");
  } catch (e) {}

  saveDatabase();
  console.log('✅ Users table ready');

  // Create subjects table
  db.run(`
    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL
    )
  `);

  // Create lectures_mapping table
  db.run(`
    CREATE TABLE IF NOT EXISTS lectures_mapping (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subjectId INTEGER NOT NULL,
      facultyId INTEGER NOT NULL,
      FOREIGN KEY (subjectId) REFERENCES subjects(id),
      FOREIGN KEY (facultyId) REFERENCES users(id)
    )
  `);

  // Create attendance_request_lectures table
  db.run(`
    CREATE TABLE IF NOT EXISTS attendance_request_lectures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requestId INTEGER NOT NULL,
      subjectId INTEGER NOT NULL,
      facultyId INTEGER NOT NULL,
      lectureDate TEXT NOT NULL,
      FOREIGN KEY (requestId) REFERENCES attendance_requests(id),
      FOREIGN KEY (subjectId) REFERENCES subjects(id),
      FOREIGN KEY (facultyId) REFERENCES users(id)
    )
  `);

  // Create password_resets table
  db.run(`
    CREATE TABLE IF NOT EXISTS password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      hashedOtp TEXT NOT NULL,
      createdAt TEXT DEFAULT (datetime('now')),
      expiresAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  // Seed Data: Check if subjects exist, if not add some
  const subjectCount = getOne("SELECT count(*) as count FROM subjects").count;
  if (subjectCount === 0) {
    console.log('🌱 Seeding initial subjects and mappings...');
    
    // Add subjects
    db.run("INSERT INTO subjects (name, code) VALUES (?, ?)", ["Data Structures & Algorithms", "CSE-301"]);
    db.run("INSERT INTO subjects (name, code) VALUES (?, ?)", ["Web Development", "CSE-302"]);
    db.run("INSERT INTO subjects (name, code) VALUES (?, ?)", ["Operating Systems", "CSE-303"]);
    db.run("INSERT INTO subjects (name, code) VALUES (?, ?)", ["Database Management", "CSE-304"]);

    // Map to faculty (Assuming Prof. Faculty Member is id: 2)
    const subjects = getAll("SELECT id FROM subjects");
    const faculty = getOne("SELECT id FROM users WHERE role = 'faculty' LIMIT 1");
    
    if (faculty) {
      subjects.forEach(sub => {
        db.run("INSERT INTO lectures_mapping (subjectId, facultyId) VALUES (?, ?)", [sub.id, faculty.id]);
      });
      console.log('✅ Seeding complete');
    } else {
      console.log('⚠️ No faculty found to seed mapping');
    }
    saveDatabase();
  }

  return db;
}

// Save database to file after every write
export function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// Helper: Run INSERT/UPDATE/DELETE and auto-save
export function runQuery(sql, params = []) {
  db.run(sql, params);
  
  // CRITICAL: Get last inserted row id BEFORE saving/exporting
  const result = db.exec('SELECT last_insert_rowid() as id');
  const id = result.length > 0 ? Number(result[0].values[0][0]) : null;
  
  // Save database to disk
  saveDatabase();
  
  return id;
}

// Helper: Get one row
export function getOne(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

// Helper: Get all rows
export function getAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

export default db;
