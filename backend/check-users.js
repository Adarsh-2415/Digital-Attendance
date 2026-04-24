import { initDatabase, getAll } from './database.js';

async function checkUsers() {
  await initDatabase();
  const users = getAll('SELECT id, fullName, qid, email, role, createdAt FROM users');
  
  console.log('\n📊 --- REGISTERED USERS IN DATABASE --- 📊\n');
  if (users.length === 0) {
    console.log('No users found in the database.');
  } else {
    console.table(users);
  }
  console.log('\n----------------------------------------\n');
  
  process.exit(0);
}

checkUsers();
