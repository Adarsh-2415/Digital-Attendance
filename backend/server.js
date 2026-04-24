import express from 'express'; // Force restart
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase, runQuery, getOne, getAll } from './database.js';
import { sendOTPEmail } from './emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'digital-attendance-secret-key-2026';

// Middleware
app.use(cors());
app.use(express.json());

// 📁 File Upload Configuration
const UPLOAD_DIR = path.join(__dirname, 'uploads', 'proofs');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log('📁 Created uploads/proofs directory');
}

// Static serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const userId = req.user?.id || 'anon';
    const timestamp = Date.now();
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, `${userId}-${timestamp}-${cleanName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, and PDF are allowed.'));
    }
  }
});

// Safe File Deletion Helper
const safeDeleteFile = (filePath) => {
  if (!filePath) return;
  const fullPath = path.join(__dirname, filePath);
  try {
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log('🗑️ Deleted file:', fullPath);
    }
  } catch (err) {
    console.error('❌ Error deleting file:', err.message);
  }
};

// Root route for status check
app.get('/', (req, res) => {
  res.json({
    message: 'Digital Attendance System API is running 🚀',
    status: 'online',
    version: '1.0.0'
  });
});

// ─────────────────────────────────────────
// POST /api/register — Student Registration
// ─────────────────────────────────────────
app.post('/api/register', (req, res) => {
  try {
    const { fullName, qid, email, password } = req.body;

    // Validation
    if (!fullName || !qid || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if email already exists
    const existingEmail = getOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existingEmail) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Check if QID already exists
    const existingQid = getOne('SELECT id FROM users WHERE qid = ?', [qid]);
    if (existingQid) {
      return res.status(409).json({ error: 'QID already registered' });
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Insert student into database
    const lastId = runQuery(
      'INSERT INTO users (fullName, qid, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [fullName, qid, email, hashedPassword, 'student']
    );

    // Generate JWT token
    const token = jwt.sign(
      { id: lastId, email, role: 'student', fullName },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: { id: lastId, fullName, email, qid, role: 'student' }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────
// POST /api/login — Login for all users
// ─────────────────────────────────────────
app.post('/api/login', (req, res) => {
  try {
    const { qid, password } = req.body;

    // Validation
    if (!qid || !password) {
      return res.status(400).json({ error: 'QID and password are required' });
    }

    // Find user by QID
    const user = getOne('SELECT * FROM users WHERE qid = ?', [qid]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid QID or password' });
    }

    // Compare password
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid QID or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, fullName: user.fullName },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { 
        id: user.id, 
        fullName: user.fullName, 
        email: user.email, 
        qid: user.qid, 
        role: user.role,
        department: user.department,
        section: user.section,
        year: user.year,
        semester: user.semester,
        profileCompleted: user.profileCompleted
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────
// POST /api/auth/forgot-password
// ─────────────────────────────────────────
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { qid, email } = req.body;
    if (!qid || !email) return res.status(400).json({ error: 'QID and Email are required' });

    const normalizedEmail = email.trim().toLowerCase();
    
    // Check if user exists
    const user = getOne('SELECT id FROM users WHERE qid = ? AND LOWER(email) = ?', [qid.trim(), normalizedEmail]);
    if (!user) {
      return res.status(404).json({ error: 'No user found with the provided QID and Email' });
    }

    // Rate Limiting: Check if there is an active request in the last 60 seconds
    const recentReset = getOne(
      "SELECT id FROM password_resets WHERE userId = ? AND createdAt >= datetime('now', '-60 seconds')",
      [user.id]
    );
    if (recentReset) {
      return res.status(429).json({ error: 'Please wait 60 seconds before requesting another OTP.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Clear old OTPs
    runQuery('DELETE FROM password_resets WHERE userId = ?', [user.id]);
    
    // Save new OTP
    runQuery(
      'INSERT INTO password_resets (userId, hashedOtp, expiresAt) VALUES (?, ?, ?)',
      [user.id, hashedOtp, expiresAt]
    );

    // Send Email
    await sendOTPEmail(normalizedEmail, otp);

    console.log('📧 OTP sent successfully to:', normalizedEmail);
    res.json({ message: 'OTP sent successfully to your email.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request.' });
  }
});

// ─────────────────────────────────────────
// POST /api/auth/reset-password
// ─────────────────────────────────────────
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { qid, otp, newPassword, confirmPassword } = req.body;
    if (!qid || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    const user = getOne('SELECT id FROM users WHERE qid = ?', [qid.trim()]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const resetRecord = getOne('SELECT * FROM password_resets WHERE userId = ?', [user.id]);
    if (!resetRecord) return res.status(400).json({ error: 'No active OTP request found.' });

    if (new Date() > new Date(resetRecord.expiresAt)) {
      runQuery('DELETE FROM password_resets WHERE id = ?', [resetRecord.id]);
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    const isOtpValid = await bcrypt.compare(otp.trim(), resetRecord.hashedOtp);
    if (!isOtpValid) return res.status(400).json({ error: 'Invalid OTP.' });

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    runQuery('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);
    runQuery('DELETE FROM password_resets WHERE id = ?', [resetRecord.id]);

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// ─────────────────────────────────────────
// Middleware: Authenticate Token
// ─────────────────────────────────────────
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// ─────────────────────────────────────────
// POST /api/auth/change-password
// ─────────────────────────────────────────
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New passwords do not match' });
    }

    const user = getOne('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    runQuery('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);

    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

// ─────────────────────────────────────────
// GET /api/me — Get current user from token
// ─────────────────────────────────────────
const cleanupOrphans = () => {
  try {
    const orphanCount = runQuery('DELETE FROM attendance_participants WHERE requestId = 0');
    if (orphanCount) console.log('✅ Cleaned up orphan participant records.');
  } catch (e) {}
};
cleanupOrphans();

app.get('/api/me', authenticateToken, (req, res) => {
  try {
    const user = getOne('SELECT id, fullName, email, qid, role, department, section, year, semester, profileCompleted FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Fetch me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────
// POST /api/student/profile — Complete Profile
// ─────────────────────────────────────────
app.post('/api/student/profile', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can update profile' });
    }
    const { department, section, year, semester } = req.body;
    
    if (!department || !section || !year || !semester) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    runQuery(
      'UPDATE users SET department = ?, section = ?, year = ?, semester = ?, profileCompleted = 1 WHERE id = ?',
      [department, section, year, semester, req.user.id]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────
// GET /api/data/hod — Fetch HOD by Department
// ─────────────────────────────────────────
app.get('/api/data/hod', authenticateToken, (req, res) => {
  try {
    const { department } = req.query;
    if (!department) return res.status(400).json({ error: 'Department is required' });
    
    const hod = getOne('SELECT id, fullName FROM users WHERE role = "hod" AND department = ?', [department]);
    res.json(hod || null);
  } catch (error) {
    console.error('Fetch HOD error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────
// GET /api/data/faculty — Fetch Faculty by Department
// ─────────────────────────────────────────
app.get('/api/data/faculty', authenticateToken, (req, res) => {
  try {
    const { department } = req.query;
    if (!department) return res.status(400).json({ error: 'Department is required' });
    
    // Fetch faculty mapped to their subjects
    const faculties = getAll(`
      SELECT 
        u.id as facultyId, u.fullName as facultyName,
        s.id as subjectId, s.name as subjectName, s.code as subjectCode
      FROM users u
      JOIN lectures_mapping m ON u.id = m.facultyId
      JOIN subjects s ON m.subjectId = s.id
      WHERE u.role = 'faculty' AND u.department = ?
    `, [department]);
    
    res.json(faculties);
  } catch (error) {
    console.error('Fetch Faculty error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────
// GET /api/subjects — List available subjects
// ─────────────────────────────────────────
app.get('/api/subjects', authenticateToken, (req, res) => {
  try {
    const subjects = getAll('SELECT * FROM subjects ORDER BY name ASC');
    res.json(subjects);
  } catch (error) {
    console.error('Fetch subjects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────
// POST /api/attendance-requests — Apply for Attendance
// ─────────────────────────────────────────
app.post('/api/attendance-requests', authenticateToken, upload.single('proof'), (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can submit attendance requests' });
    }

    let {
      courseSecDept,
      yearSemester,
      eventName,
      eventDate,
      endDate,
      eventType,
      roleInEvent,
      reason,
      declarationAccepted,
      participants,
      missedLectures
    } = req.body;

    // Handle FormData stringified arrays
    if (typeof participants === 'string') {
      try { participants = JSON.parse(participants); } catch (e) { participants = []; }
    }
    if (typeof missedLectures === 'string') {
      try { missedLectures = JSON.parse(missedLectures); } catch (e) { missedLectures = []; }
    }

    const proofFile = req.file;
    if (!proofFile) {
      return res.status(400).json({ error: 'Please upload a proof of participation (JPG, PNG, or PDF)' });
    }

    const proofPath = `uploads/proofs/${proofFile.filename}`;
    const fileSize = proofFile.size;

    // Validation
    if (!courseSecDept || !yearSemester || !eventName || !eventDate || !eventType || !roleInEvent || !reason || !declarationAccepted) {
      return res.status(400).json({ error: 'All required fields must be filled' });
    }

    if (!missedLectures || !Array.isArray(missedLectures) || missedLectures.length === 0) {
      return res.status(400).json({ error: 'At least one missed lecture must be selected' });
    }

    // Check for duplicate lectures (same date and subject)
    const lectureKeys = new Set();
    for (const l of missedLectures) {
      const key = `${l.lectureDate}-${l.subjectId}`;
      if (lectureKeys.has(key)) {
        return res.status(400).json({ error: 'Duplicate lecture selection detected' });
      }
      lectureKeys.add(key);
    }

    // Insert request
    const requestId = runQuery(
      `INSERT INTO attendance_requests (
        studentId, courseSecDept, yearSemester, eventName, 
        eventDate, endDate, eventType, roleInEvent, reason, 
        declarationAccepted, proofPath, fileSize
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id, courseSecDept, yearSemester, eventName,
        eventDate, endDate || null, eventType, roleInEvent, reason, 
        declarationAccepted == 'true' || declarationAccepted === true || declarationAccepted === 1 ? 1 : 0,
        proofPath, fileSize
      ]
    );

    if (!requestId || requestId === 0) {
      console.error('CRITICAL: Failed to retrieve a valid Request ID from database.');
      return res.status(500).json({ error: 'Database ID generation failed. Please try again.' });
    }

    // Insert Missed Lectures with Faculty Mapping
    for (const l of missedLectures) {
      const mapping = getOne('SELECT facultyId FROM lectures_mapping WHERE subjectId = ?', [l.subjectId]);
      if (mapping) {
        runQuery(
          `INSERT INTO attendance_request_lectures (requestId, subjectId, facultyId, lectureDate) VALUES (?, ?, ?, ?)`,
          [requestId, l.subjectId, mapping.facultyId, l.lectureDate]
        );
      }
    }

    // Insert participants if any
    if (participants && Array.isArray(participants) && participants.length > 0) {
      for (const p of participants) {
        try {
          if (p.name && p.qid) {
            runQuery(
              `INSERT INTO attendance_participants (requestId, name, qid, courseSecDeptOpt, yearOpt) VALUES (?, ?, ?, ?, ?)`,
              [requestId, p.name, p.qid, p.course || p.courseSecDeptOpt || '', p.year || p.yearOpt || '']
            );
          }
        } catch (loopErr) {
          console.error(`Error saving participant:`, loopErr);
        }
      }
    }

    res.status(201).json({
      message: 'Attendance request submitted successfully',
      requestId
    });

  } catch (error) {
    console.error('Attendance request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/student/requests', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can access their requests' });
    }

    const requests = getAll(
      'SELECT * FROM attendance_requests WHERE studentId = ? ORDER BY createdAt DESC',
      [req.user.id]
    );

    res.json(requests);
  } catch (error) {
    console.error('Fetch requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/student/requests/:id', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can access their request details' });
    }

    const requestId = req.params.id;
    
    // Fetch request details
    const request = getOne(
      'SELECT r.*, u.fullName, u.qid FROM attendance_requests r JOIN users u ON r.studentId = u.id WHERE r.id = ? AND r.studentId = ?',
      [requestId, req.user.id]
    );

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Fetch participants
    const participants = getAll(
      'SELECT * FROM attendance_participants WHERE requestId = ?',
      [requestId]
    );

    // Fetch missed lectures
    const missedLectures = getAll(
      `SELECT al.*, s.name as subjectName, s.code as subjectCode 
       FROM attendance_request_lectures al 
       JOIN subjects s ON al.subjectId = s.id 
       WHERE al.requestId = ?`,
      [requestId]
    );

    res.json({ ...request, participants, missedLectures });
  } catch (error) {
    console.error('Fetch detailed request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/student/requests/:id', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const requestId = req.params.id;
    const request = getOne('SELECT id, proofPath, status FROM attendance_requests WHERE id = ? AND studentId = ?', [requestId, req.user.id]);

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending requests can be deleted' });
    }

    // Delete associated data first
    runQuery('DELETE FROM attendance_request_lectures WHERE requestId = ?', [requestId]);
    runQuery('DELETE FROM attendance_participants WHERE requestId = ?', [requestId]);
    runQuery('DELETE FROM attendance_requests WHERE id = ?', [requestId]);

    // Delete physical file
    safeDeleteFile(request.proofPath);

    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Delete request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────
// HOD Dashboard Endpoints
// ─────────────────────────────────────────

app.get('/api/hod/requests', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'hod') {
      return res.status(403).json({ error: 'Access denied: HOD role required' });
    }

    // Get the HOD's department
    const hodUser = getOne('SELECT department FROM users WHERE id = ?', [req.user.id]);
    const hodDepartment = hodUser?.department;

    if (!hodDepartment) {
      return res.status(403).json({ error: 'HOD department not configured' });
    }

    // Fetch all requests where the student's department matches the HOD's department
    const requests = getAll(`
      SELECT r.*, u.fullName, u.qid 
      FROM attendance_requests r 
      JOIN users u ON r.studentId = u.id 
      WHERE u.department = ?
      ORDER BY 
        CASE WHEN r.status = 'pending' THEN 0 ELSE 1 END,
        r.createdAt DESC
    `, [hodDepartment]);

    res.json(requests);
  } catch (error) {
    console.error('Fetch HOD requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/hod/requests/:id', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'hod') {
      return res.status(403).json({ error: 'Access denied: HOD role required' });
    }

    const requestId = req.params.id;
    
    // Get HOD department
    const hodUser = getOne('SELECT department FROM users WHERE id = ?', [req.user.id]);
    const hodDepartment = hodUser?.department;

    if (!hodDepartment) {
      return res.status(403).json({ error: 'HOD department not configured' });
    }

    const request = getOne(
      'SELECT r.*, u.fullName, u.qid FROM attendance_requests r JOIN users u ON r.studentId = u.id WHERE r.id = ? AND u.department = ?',
      [requestId, hodDepartment]
    );

    if (!request) {
      return res.status(404).json({ error: 'Request not found or access denied (different department)' });
    }

    const participants = getAll('SELECT * FROM attendance_participants WHERE requestId = ?', [requestId]);
    const missedLectures = getAll(
      `SELECT al.*, s.name as subjectName, s.code as subjectCode 
       FROM attendance_request_lectures al 
       JOIN subjects s ON al.subjectId = s.id 
       WHERE al.requestId = ?`,
      [requestId]
    );
    res.json({ ...request, participants, missedLectures });
  } catch (error) {
    console.error('Fetch HOD detailed request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/hod/requests/:id/status', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'hod') {
      return res.status(403).json({ error: 'Access denied: HOD role required' });
    }

    const requestId = req.params.id;
    const { status, rejectionReason } = req.body;
    
    // Get HOD department
    const hodUser = getOne('SELECT department FROM users WHERE id = ?', [req.user.id]);
    const hodDepartment = hodUser?.department;

    if (!hodDepartment) return res.status(403).json({ error: 'HOD department not configured' });

    // Verify access
    const request = getOne(
      'SELECT r.id FROM attendance_requests r JOIN users u ON r.studentId = u.id WHERE r.id = ? AND u.department = ?',
      [requestId, hodDepartment]
    );
    if (!request) return res.status(403).json({ error: 'Access denied to this request' });

    const processedBy = req.user.fullName;
    const updatedAt = new Date().toISOString();
    
    if (status === 'rejected') {
      runQuery(
        'UPDATE attendance_requests SET status = ?, rejectionReason = ?, processedBy = ?, updatedAt = ? WHERE id = ?', 
        [status, rejectionReason || '', processedBy, updatedAt, requestId]
      );
    } else {
      runQuery(
        'UPDATE attendance_requests SET status = ?, rejectionReason = NULL, processedBy = ?, updatedAt = ? WHERE id = ?', 
        [status, processedBy, updatedAt, requestId]
      );
    }

    res.json({ message: `Request ${status} successfully` });
  } catch (error) {
    console.error('Update request status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/hod/stats', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'hod') {
      return res.status(403).json({ error: 'Access denied: HOD role required' });
    }

    const hodUser = getOne('SELECT department FROM users WHERE id = ?', [req.user.id]);
    const hodDepartment = hodUser?.department;
    if (!hodDepartment) return res.status(403).json({ error: 'HOD department not configured' });

    const totalStudents = getOne('SELECT COUNT(*) as count FROM users WHERE role = "student" AND department = ?', [hodDepartment]).count;
    const pendingRequests = getOne('SELECT COUNT(*) as count FROM attendance_requests r JOIN users u ON r.studentId = u.id WHERE r.status = "pending" AND u.department = ?', [hodDepartment]).count;
    const totalApproved = getOne('SELECT COUNT(*) as count FROM attendance_requests r JOIN users u ON r.studentId = u.id WHERE r.status = "approved" AND u.department = ?', [hodDepartment]).count;
    const totalFaculty = getOne('SELECT COUNT(*) as count FROM users WHERE role = "faculty" AND department = ?', [hodDepartment]).count;

    res.json({ totalStudents, pendingRequests, totalApproved, totalFaculty });
  } catch (error) {
    console.error('Fetch HOD stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────
// Faculty Dashboard Endpoints
// ─────────────────────────────────────────

app.get('/api/faculty/attendance', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ error: 'Access denied: Faculty role required' });
    }

    // JOIN attendance_requests and attendance_request_lectures
    // Filter by facultyId and status = approved
    const attendance = getAll(`
      SELECT 
        l.id as lectureId, l.erpMarked,
        r.id as requestId, r.eventName, r.eventType, r.reason, r.status,
        l.lectureDate,
        s.name as subjectName, s.code as subjectCode,
        u.fullName as studentName, u.qid as studentQid
      FROM attendance_requests r
      JOIN attendance_request_lectures l ON r.id = l.requestId
      JOIN subjects s ON l.subjectId = s.id
      JOIN users u ON r.studentId = u.id
      WHERE l.facultyId = ? AND r.status = 'approved'
      ORDER BY l.lectureDate DESC, u.fullName ASC
    `, [req.user.id]);

    const requestIds = [...new Set(attendance.map(a => a.requestId))];
    if (requestIds.length > 0) {
      const placeholders = requestIds.map(() => '?').join(',');
      const participants = getAll(`SELECT requestId, name, qid, courseSecDeptOpt, yearOpt FROM attendance_participants WHERE requestId IN (${placeholders})`, requestIds);
      
      attendance.forEach(item => {
        item.participants = participants.filter(p => p.requestId === item.requestId);
      });
    }

    res.json(attendance);
  } catch (error) {
    console.error('Fetch faculty attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/faculty/attendance/mark-erp', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ error: 'Access denied: Faculty role required' });
    }

    const { lectureId, erpMarked } = req.body;
    
    // Verify faculty owns this lecture
    const isOwned = getOne('SELECT id FROM attendance_request_lectures WHERE id = ? AND facultyId = ?', [lectureId, req.user.id]);
    if (!isOwned) {
      return res.status(403).json({ error: 'Access denied: Not your lecture' });
    }

    runQuery('UPDATE attendance_request_lectures SET erpMarked = ? WHERE id = ?', [erpMarked ? 1 : 0, lectureId]);
    res.json({ message: 'ERP Status updated successfully' });
  } catch (error) {
    console.error('Mark ERP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/faculty/requests/:id', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ error: 'Access denied: Faculty role required' });
    }

    const requestId = req.params.id;
    // Ensure this request is linked to this faculty member (basic authorization)
    const isLinked = getOne(
      'SELECT id FROM attendance_request_lectures WHERE requestId = ? AND facultyId = ? LIMIT 1',
      [requestId, req.user.id]
    );

    if (!isLinked) {
      return res.status(403).json({ error: 'Access denied: You are not assigned to this request' });
    }

    const request = getOne(
      'SELECT r.*, u.fullName, u.qid FROM attendance_requests r JOIN users u ON r.studentId = u.id WHERE r.id = ?',
      [requestId]
    );

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const participants = getAll('SELECT * FROM attendance_participants WHERE requestId = ?', [requestId]);
    const missedLectures = getAll(
      `SELECT al.*, s.name as subjectName, s.code as subjectCode 
       FROM attendance_request_lectures al 
       JOIN subjects s ON al.subjectId = s.id 
       WHERE al.requestId = ?`,
      [requestId]
    );
    res.json({ ...request, participants, missedLectures });
  } catch (error) {
    console.error('Fetch faculty detailed request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────
// Start server
// ─────────────────────────────────────────
// ─────────────────────────────────────────
// DEBUG: Get all users (For Faculty Demo)
// ─────────────────────────────────────────
app.get('/api/debug/users', (req, res) => {
  try {
    const users = getAll('SELECT id, fullName, qid, email, role, department, createdAt FROM users ORDER BY createdAt DESC');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

async function start() {
  await initDatabase();

  app.listen(PORT, () => {
    console.log('');
    console.log(`🚀 Backend server running at http://localhost:${PORT}`);
    console.log('');
    console.log('📡 API endpoints:');
    console.log('   POST /api/register  — Register a new student');
    console.log('   POST /api/login     — Login (student/hod/faculty)');
    console.log('   GET  /api/me        — Get current user info');
    console.log('');
  });
}

start();
