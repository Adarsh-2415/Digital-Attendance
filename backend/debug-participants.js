import { initDatabase, getAll } from './database.js';

async function debug() {
  await initDatabase();
  console.log('--- LATEST REQUESTS ---');
  const requests = getAll("SELECT id, studentId, eventName, status FROM attendance_requests ORDER BY id DESC LIMIT 5");
  console.table(requests);

  console.log('--- PARTICIPANTS ---');
  const participants = getAll("SELECT * FROM attendance_participants ORDER BY id DESC LIMIT 10");
  console.table(participants);

  process.exit(0);
}

debug();
