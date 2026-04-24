import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthForm from './components/AuthForm';
import StudentDashboard from './pages/StudentDashboard';
import StudentProfileSetup from './pages/StudentProfileSetup';
import HodDashboard from './pages/HodDashboard';
import FacultyDashboard from './pages/FacultyDashboard';

// Protected Route — checks if user is logged in and has the correct role
const ProtectedRoute = ({ children, allowedRole, requireProfile = false }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) return <Navigate to="/" replace />;
  if (allowedRole && user.role !== allowedRole) return <Navigate to="/" replace />;

  if (requireProfile && allowedRole === 'student' && !user.profileCompleted) {
    return <Navigate to="/student/profile-setup" replace />;
  }

  return children;
};

// Login Page wrapper with background
const LoginPage = () => {
  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 40%, #a855f7 70%, #c084fc 100%)',
        position: 'relative',
        overflow: 'hidden',
        padding: '24px',
      }}
    >
      <style>{`
        @keyframes floatBubble1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -20px) scale(1.05); }
          50% { transform: translate(-10px, -40px) scale(1); }
          75% { transform: translate(20px, -10px) scale(0.97); }
        }
        @keyframes floatBubble2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(-25px, 15px) scale(1.03); }
          50% { transform: translate(15px, 30px) scale(0.98); }
          75% { transform: translate(-20px, 10px) scale(1.02); }
        }
        @keyframes floatBubble3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          33% { transform: translate(-45%, -55%) scale(1.06); }
          66% { transform: translate(-55%, -48%) scale(0.96); }
        }
        @keyframes floatBubble4 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-15px, 25px); }
        }
      `}</style>

      <div style={{ position: 'absolute', top: '-120px', left: '-120px', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', animation: 'floatBubble1 8s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', bottom: '-150px', right: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', animation: 'floatBubble2 10s ease-in-out infinite', animationDelay: '1s' }} />
      <div style={{ position: 'absolute', top: '50%', left: '60%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', animation: 'floatBubble3 12s ease-in-out infinite', animationDelay: '2s' }} />
      <div style={{ position: 'absolute', top: '20%', right: '15%', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', animation: 'floatBubble4 7s ease-in-out infinite', animationDelay: '3s' }} />

      <AuthForm />
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Login / Register Page */}
        <Route path="/" element={<LoginPage />} />

        {/* Protected Dashboard Routes */}
        <Route path="/student/profile-setup" element={
          <ProtectedRoute allowedRole="student">
            <StudentProfileSetup />
          </ProtectedRoute>
        } />
        
        <Route path="/student/dashboard" element={
          <ProtectedRoute allowedRole="student" requireProfile={true}>
            <StudentDashboard />
          </ProtectedRoute>
        } />

        <Route path="/hod/dashboard" element={
          <ProtectedRoute allowedRole="hod">
            <HodDashboard />
          </ProtectedRoute>
        } />

        <Route path="/faculty/dashboard" element={
          <ProtectedRoute allowedRole="faculty">
            <FacultyDashboard />
          </ProtectedRoute>
        } />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
