import { initDatabase, getAll } from './database.js';

async function debug() {
  await initDatabase();
  console.log('--- TABLE INFO: attendance_requests ---');
  const info = getAll("PRAGMA table_info(attendance_requests)");
  console.table(info);
  process.exit(0);
}

debug();
