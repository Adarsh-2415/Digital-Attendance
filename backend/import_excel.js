import xlsx from 'xlsx';
import bcrypt from 'bcryptjs';
import { initDatabase, runQuery, getOne, getAll } from './database.js';

async function importDetails() {
  await initDatabase();

  console.log('📖 Reading Details.xlsx...');
  let workbook;
  try {
    workbook = xlsx.readFile('C:\\Users\\Dell\\Desktop\\Details.xlsx');
  } catch (error) {
    console.error('Failed to read Excel file:', error);
    return;
  }

  // Ensure sheets exist
  if (!workbook.SheetNames.includes('Hod Details') || !workbook.SheetNames.includes('Faculty Details')) {
    console.error('Excel file must contain "Hod Details" and "Faculty Details" sheets.');
    return;
  }

  const hodData = xlsx.utils.sheet_to_json(workbook.Sheets['Hod Details']);
  const facultyData = xlsx.utils.sheet_to_json(workbook.Sheets['Faculty Details']);

  try {
    console.log('🚀 Starting Data Import...');

    // 1. Delete existing HOD and Faculty users
    console.log('🧹 Clearing existing HODs and Faculties...');
    runQuery(`DELETE FROM users WHERE role IN ('hod', 'faculty')`);
    runQuery(`DELETE FROM subjects`); // Clear subjects
    runQuery(`DELETE FROM lectures_mapping`); // Clear mappings

    // 2. Insert HODs
    console.log(`📥 Importing ${hodData.length} HODs...`);
    for (const row of hodData) {
      const name = row['HOD NAME'];
      const dept = row['DEPARTMENT'];
      const qid = String(row['QID']).trim();
      const pwd = String(row['PASSWORD']).trim();
      
      const email = `${qid}@attendance.com`;
      const hashedPwd = bcrypt.hashSync(pwd, 10);
      
      // Delete any existing user with this QID
      runQuery(`DELETE FROM users WHERE qid = ?`, [qid]);

      runQuery(
        `INSERT INTO users (fullName, qid, email, password, role, department) VALUES (?, ?, ?, ?, ?, ?)`,
        [name, qid, email, hashedPwd, 'hod', dept]
      );
    }

    // 3. Insert Faculties & map Subjects
    console.log(`📥 Importing ${facultyData.length} Faculties and mapping subjects...`);
    for (const row of facultyData) {
      const name = row['Faculty Name '] || row['Faculty Name'];
      const dept = row['Department'];
      const subjectName = row['Subject '] || row['Subject'];
      const subjectCode = String(row['Subject Code '] || row['Subject Code']).trim();
      const qid = String(row['QID']).trim();
      const pwd = String(row['Password']).trim();

      if (qid === 'QID' || !qid || !name) continue;

      const email = `${qid}@attendance.com`;

      // Insert Faculty User if not exists
      let faculty = getOne(`SELECT id FROM users WHERE qid = ? AND role = 'faculty'`, [qid]);
      let facultyId;
      if (!faculty) {
        runQuery(`DELETE FROM users WHERE qid = ?`, [qid]);
        const hashedPwd = bcrypt.hashSync(pwd, 10);
        runQuery(
          `INSERT INTO users (fullName, qid, email, password, role, department) VALUES (?, ?, ?, ?, ?, ?)`,
          [name, qid, email, hashedPwd, 'faculty', dept]
        );
        facultyId = getOne(`SELECT id FROM users WHERE qid = ? AND role = 'faculty'`, [qid]).id;
      } else {
        facultyId = faculty.id;
      }

      // Insert Subject if not exists
      let subject = getOne(`SELECT id FROM subjects WHERE code = ?`, [subjectCode]);
      let subjectId;
      if (!subject) {
        runQuery(`INSERT INTO subjects (name, code) VALUES (?, ?)`, [subjectName, subjectCode]);
        subjectId = getOne(`SELECT id FROM subjects WHERE code = ?`, [subjectCode]).id;
      } else {
        subjectId = subject.id;
      }

      // Map Faculty to Subject
      const existingMapping = getOne(`SELECT id FROM lectures_mapping WHERE subjectId = ? AND facultyId = ?`, [subjectId, facultyId]);
      if (!existingMapping) {
        runQuery(`INSERT INTO lectures_mapping (subjectId, facultyId) VALUES (?, ?)`, [subjectId, facultyId]);
      }
    }

    console.log('✅ Import successfully completed!');

  } catch (error) {
    console.error('❌ Error during import:', error);
  }
}

importDetails();
