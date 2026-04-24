import bcrypt from 'bcryptjs';
import { initDatabase, runQuery, getOne } from './database.js';

// ─────────────────────────────────────────
// Pre-create HOD and Faculty accounts
// Run this script once: npm run seed
// ─────────────────────────────────────────

const accounts = [
  {
    fullName: 'Dr. HOD Admin',
    qid: '1001',
    email: 'hod@attendance.com',
    password: 'hod123',
    role: 'hod',
    department: 'Department of bachelors of Computer applications (BCA)',
  },
  {
    fullName: 'Prof. Faculty Member',
    qid: '2001',
    email: 'faculty@attendance.com',
    password: 'faculty123',
    role: 'faculty',
    department: 'Department of bachelors of Computer applications (BCA)',
  },
];

async function seed() {
  await initDatabase();

  console.log('🌱 Seeding database with HOD and Faculty accounts...\n');

  for (const account of accounts) {
    // Check if account already exists
    const existing = getOne('SELECT id FROM users WHERE email = ?', [account.email]);
    if (existing) {
      console.log(`⏭️  Skipped: ${account.email} (already exists)`);
      continue;
    }

    // Hash the password
    const hashedPassword = bcrypt.hashSync(account.password, 10);

    // Insert into database
    runQuery(
      'INSERT INTO users (fullName, qid, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [account.fullName, account.qid, account.email, hashedPassword, account.role]
    );

    console.log(`✅ Created ${account.role.toUpperCase()} account:`);
    console.log(`   Email:    ${account.email}`);
    console.log(`   Password: ${account.password}`);
    console.log('');
  }

  console.log('🎉 Seeding complete!\n');
  console.log('─────────────────────────────────────');
  console.log('Login credentials:');
  console.log('─────────────────────────────────────');
  console.log('HOD:     hod@attendance.com     / hod123');
  console.log('Faculty: faculty@attendance.com / faculty123');
  console.log('─────────────────────────────────────');
}

seed();
