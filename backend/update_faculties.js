import bcrypt from 'bcryptjs';
import { initDatabase, runQuery, getOne, getAll } from './database.js';

const faculties = [
  { fullName: 'Prof. Alan Turing', qid: '2001', email: 'alan@attendance.com', password: 'password123', role: 'faculty', subjectName: 'Data Structures & Algorithms', subjectCode: 'CSE-301' },
  { fullName: 'Prof. Tim Berners-Lee', qid: '2002', email: 'tim@attendance.com', password: 'password123', role: 'faculty', subjectName: 'Web Development', subjectCode: 'CSE-302' },
  { fullName: 'Prof. Linus Torvalds', qid: '2003', email: 'linus@attendance.com', password: 'password123', role: 'faculty', subjectName: 'Operating Systems', subjectCode: 'CSE-303' },
  { fullName: 'Prof. E.F. Codd', qid: '2004', email: 'codd@attendance.com', password: 'password123', role: 'faculty', subjectName: 'Database Management', subjectCode: 'CSE-304' },
  { fullName: 'Prof. Ada Lovelace', qid: '2005', email: 'ada@attendance.com', password: 'password123', role: 'faculty', subjectName: 'Artificial Intelligence', subjectCode: 'CSE-305' },
];

async function update() {
  await initDatabase();

  console.log('🔄 Updating Faculties and Subjects...');

  for (const f of faculties) {
    // 1. Create or update faculty
    let faculty = getOne('SELECT id FROM users WHERE qid = ?', [f.qid]);
    let facultyId;
    
    if (!faculty) {
      const hashedPassword = bcrypt.hashSync(f.password, 10);
      runQuery(
        'INSERT INTO users (fullName, qid, email, password, role) VALUES (?, ?, ?, ?, ?)',
        [f.fullName, f.qid, f.email, hashedPassword, f.role]
      );
      facultyId = getOne('SELECT id FROM users WHERE qid = ?', [f.qid]).id;
      console.log(`✅ Created faculty: ${f.fullName} (QID: ${f.qid})`);
    } else {
      facultyId = faculty.id;
      runQuery(
        'UPDATE users SET fullName = ? WHERE id = ?',
        [f.fullName, facultyId]
      );
    }

    // 2. Create or update subject
    let subject = getOne('SELECT id FROM subjects WHERE code = ?', [f.subjectCode]);
    let subjectId;
    
    if (!subject) {
      runQuery('INSERT INTO subjects (name, code) VALUES (?, ?)', [f.subjectName, f.subjectCode]);
      subjectId = getOne('SELECT id FROM subjects WHERE code = ?', [f.subjectCode]).id;
      console.log(`✅ Created subject: ${f.subjectName}`);
    } else {
      subjectId = subject.id;
    }

    // 3. Update mapping
    const existingMapping = getOne('SELECT id FROM lectures_mapping WHERE subjectId = ?', [subjectId]);
    if (existingMapping) {
      runQuery('UPDATE lectures_mapping SET facultyId = ? WHERE id = ?', [facultyId, existingMapping.id]);
    } else {
      runQuery('INSERT INTO lectures_mapping (subjectId, facultyId) VALUES (?, ?)', [subjectId, facultyId]);
    }
    
    console.log(`🔗 Mapped ${f.subjectCode} to ${f.fullName}`);
  }

  console.log('\n🎉 Update complete. Here are the credentials to use:');
  console.log('----------------------------------------------------');
  for (const f of faculties) {
    console.log(`Subject: ${f.subjectName}`);
    console.log(`Faculty Name: ${f.fullName}`);
    console.log(`QID: ${f.qid}`);
    console.log(`Password: ${f.password}`);
    console.log('----------------------------------------------------');
  }
}

update();
