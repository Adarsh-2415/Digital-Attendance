# 🎓 Digital Attendance Management System

A secure, efficient, and transparent online attendance management system designed for college event participation. 

## 🚀 Getting Started

I have simplified the setup process so you don't have to start the frontend and backend separately. 

### 1. Start Both Frontend & Backend
Run the following command in the **root directory**:

```bash
npm run dev
```

This will automatically launch:
- **Frontend (Vite):** http://localhost:5173
- **Backend (Node/Express):** http://localhost:5000

### 2. Seeding the Database (First-time setup only)
If you haven't already, you can create the official HOD and Faculty accounts by running:

```bash
cd backend
npm run seed
```

---

## 🔑 Login Credentials

### 🏛️ HOD (Head of Department)
- **Email:** `hod@attendance.com`
- **Password:** `hod123`

### 👨‍🏫 Faculty
- **Email:** `faculty@attendance.com`
- **Password:** `faculty123`

### 🎓 Student
- Use the **Sign Up** tab in the app to create your own student account.

---

## 🛠️ Features Added for Reliability
- **Concurrent Startup:** One command starts the full stack.
- **Root Health Check:** Visiting `http://localhost:5000/` now confirms the server status.
- **Smart UI Alerts:** The login page now proactively detects if the backend is down and shows a "Server Not Reachable" warning with a retry button.

Enjoy building! 🚀
