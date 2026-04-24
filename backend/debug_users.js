import { initDatabase, getAll } from './database.js';

async function debug() {
  await initDatabase();
  const users = getAll("SELECT id, fullName, role FROM users");
  console.log(JSON.stringify(users, null, 2));
}

debug();
