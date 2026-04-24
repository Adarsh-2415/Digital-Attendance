import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, User, Lock, Mail, IdCard, Eye, EyeOff, Loader2, WifiOff, RefreshCw } from 'lucide-react';

import API_URL from '../config';

const AuthForm = () => {
  const navigate = useNavigate();
  const [authView, setAuthView] = useState('login'); // 'login', 'register', 'forgot', 'reset'
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showRegisterPass, setShowRegisterPass] = useState(false);
  const [showResetPass, setShowResetPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [serverDown, setServerDown] = useState(false);
  const [checkingServer, setCheckingServer] = useState(true);

  const checkServerHealth = useCallback(async () => {
    setCheckingServer(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${API_URL}/login`, {
        method: 'HEAD',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      setServerDown(false);
    } catch (err) {
      setServerDown(true);
    }
    setCheckingServer(false);
  }, []);

  useEffect(() => {
    checkServerHealth();
  }, [checkServerHealth]);

  // Form fields
  const [loginQid, setLoginQid] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regQid, setRegQid] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  
  // Reset Password fields
  const [resetEmail, setResetEmail] = useState('');
  const [resetQid, setResetQid] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const redirectToDashboard = (role) => {
    switch (role) {
      case 'student': navigate('/student/dashboard'); break;
      case 'hod': navigate('/hod/dashboard'); break;
      case 'faculty': navigate('/faculty/dashboard'); break;
      default: navigate('/');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qid: loginQid, password: loginPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Save token and user to localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect based on role
      redirectToDashboard(data.user.role);

    } catch (err) {
      setError('Server is not reachable. Make sure the backend is running.');
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: regName, qid: regQid, email: regEmail, password: regPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      // Save token and user to localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect to student dashboard
      redirectToDashboard('student');

    } catch (err) {
      setError('Server is not reachable. Make sure the backend is running.');
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qid: resetQid, email: resetEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to send OTP');
      } else {
        setSuccess('OTP sent successfully to your email!');
        setAuthView('reset'); // Move to step 2
      }
    } catch (err) {
      setError('Server is not reachable.');
    }
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qid: resetQid, otp: resetOtp, newPassword, confirmPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to reset password');
      } else {
        setSuccess('Password reset successfully! Please log in.');
        setAuthView('login');
        setResetQid('');
        setResetEmail('');
        setResetOtp('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError('Server is not reachable.');
    }
    setLoading(false);
  };

  const formVariants = {
    hidden: { opacity: 0, x: 30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.45, ease: 'easeOut' } },
    exit: { opacity: 0, x: -30, transition: { duration: 0.3, ease: 'easeIn' } },
  };

  const leftTextVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
    exit: { opacity: 0, y: -25, transition: { duration: 0.3 } },
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '920px',
        minHeight: '520px',
        display: 'flex',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 30px 60px -12px rgba(0,0,0,0.3)',
        position: 'relative',
        zIndex: 10,
      }}
    >
      {/* ───── LEFT PANEL ───── */}
      <div
        style={{
          width: '42%',
          background: 'linear-gradient(160deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
          padding: '48px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: '-60px', left: '-60px', width: '200px', height: '200px', borderRadius: '50%', border: '30px solid rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: '-40px', right: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', top: '40%', left: '60%', width: '100px', height: '100px', borderRadius: '50%', border: '20px solid rgba(255,255,255,0.05)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '48px', position: 'relative', zIndex: 2 }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'rgba(255,255,255,0.7)' }} />
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            Attendance
          </span>
        </div>

        <div style={{ position: 'relative', zIndex: 2 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={authView}
              variants={leftTextVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '48px', fontWeight: 700, color: '#fff', lineHeight: 1.1, marginBottom: '16px' }}>
                {authView === 'login' ? 'Welcome\nBack' : authView === 'register' ? 'Sign Up' : 'Password\nRecovery'}
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', fontWeight: 500, lineHeight: 1.7, maxWidth: '260px' }}>
                {authView === 'login'
                  ? 'Sign in to access your dashboard and manage your attendance records.'
                  : authView === 'register'
                  ? 'Create your account and start tracking attendance digitally.'
                  : 'Securely reset your password using the OTP sent to your registered email.'}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {(authView === 'login' || authView === 'register') && (
          <div
            style={{
              position: 'absolute', top: '50%', right: '-22px', transform: 'translateY(-50%)',
              width: '44px', height: '44px', borderRadius: '50%', background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(0,0,0,0.15)', zIndex: 30, cursor: 'pointer', color: '#6366f1',
            }}
            onClick={() => { setAuthView(authView === 'login' ? 'register' : 'login'); setError(''); setSuccess(''); }}
          >
            <ArrowRight size={20} />
          </div>
        )}
      </div>

      {/* ───── RIGHT PANEL ───── */}
      <div
        style={{
          width: '58%',
          background: '#ffffff',
          padding: '40px 48px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Toggle tabs */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0', marginBottom: '32px' }}>
          <button
            onClick={() => { setAuthView('register'); setError(''); }}
            style={{
              padding: '8px 20px', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
              border: '1px solid #e2e8f0', borderRight: 'none', borderRadius: '6px 0 0 6px', cursor: 'pointer',
              transition: 'all 0.3s', background: authView === 'register' ? '#4f46e5' : '#fff', color: authView === 'register' ? '#fff' : '#94a3b8',
            }}
          >
            Sign Up
          </button>
          <button
            onClick={() => { setAuthView('login'); setError(''); }}
            style={{
              padding: '8px 20px', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
              border: '1px solid #e2e8f0', borderRadius: '0 6px 6px 0', cursor: 'pointer',
              transition: 'all 0.3s', background: authView === 'login' ? '#4f46e5' : '#fff', color: authView === 'login' ? '#fff' : '#94a3b8',
            }}
          >
            Login
          </button>
        </div>

        {/* Server Down Banner */}
        {serverDown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              background: 'linear-gradient(135deg, #fef2f2, #fff1f2)',
              border: '1px solid #fecaca',
              borderLeft: '4px solid #ef4444',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)',
            }}
          >
            <div style={{
              width: '38px', height: '38px', borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              animation: 'pulseIcon 2s ease-in-out infinite',
            }}>
              <WifiOff size={18} style={{ color: '#ef4444' }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#dc2626', fontSize: '14px', fontWeight: 700, margin: '0 0 4px 0' }}>
                Server Not Reachable
              </p>
              <p style={{ color: '#9ca3af', fontSize: '12px', fontWeight: 500, margin: 0, lineHeight: 1.5 }}>
                Make sure the backend server is running on <span style={{ color: '#6366f1', fontWeight: 600 }}>localhost:5000</span>
              </p>
            </div>
            <button
              onClick={checkServerHealth}
              disabled={checkingServer}
              style={{
                background: 'none', border: '1px solid #fecaca', borderRadius: '8px',
                padding: '6px 12px', cursor: checkingServer ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
                color: '#dc2626', fontSize: '11px', fontWeight: 700,
                letterSpacing: '0.5px', textTransform: 'uppercase',
                transition: 'all 0.3s',
                flexShrink: 0,
              }}
            >
              <RefreshCw size={14} style={{ animation: checkingServer ? 'spin 1s linear infinite' : 'none' }} />
              {checkingServer ? '' : 'Retry'}
            </button>
          </motion.div>
        )}

        {/* Checking server indicator (initial load) */}
        {checkingServer && !serverDown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 16px', marginBottom: '16px',
              background: '#f8fafc', border: '1px solid #e2e8f0',
              borderRadius: '10px', fontSize: '13px', fontWeight: 500, color: '#64748b',
            }}
          >
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: '#6366f1' }} />
            Checking server connection...
          </motion.div>
        )}

        {/* Error / Success Message */}
        {error && !serverDown && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '10px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>
            {success}
          </div>
        )}

        {/* Form content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <AnimatePresence mode="wait">
            {authView === 'login' ? (
              <motion.form
                key="login"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onSubmit={handleLogin}
                style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
              >
                <div>
                  <label style={labelStyle}>QID (Unique ID)</label>
                  <div style={inputWrapperStyle}>
                    <IdCard size={16} style={iconStyle} />
                    <input type="number" placeholder="Enter your QID" style={inputStyle} value={loginQid} onChange={e => setLoginQid(e.target.value)} required />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Password</label>
                  <div style={inputWrapperStyle}>
                    <Lock size={16} style={iconStyle} />
                    <input type={showLoginPass ? 'text' : 'password'} placeholder="Enter your password" style={inputStyle} value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
                    <div onClick={() => setShowLoginPass(!showLoginPass)} style={{ cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', padding: '2px' }}>
                      {showLoginPass ? <Eye size={18} /> : <EyeOff size={18} />}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <span onClick={() => { setAuthView('forgot'); setError(''); setSuccess(''); }} style={{ fontSize: '12px', color: '#6366f1', cursor: 'pointer', fontWeight: 600 }}>Forgot Password?</span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                  style={{
                    width: 'fit-content', padding: '12px 40px', marginTop: '8px',
                    background: loading ? '#a5b4fc' : 'linear-gradient(135deg, #6366f1, #a855f7)',
                    color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                    letterSpacing: '1.5px', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 8px 20px -4px rgba(99,102,241,0.4)',
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}
                >
                  {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Signing in...</> : 'Login'}
                </motion.button>
              </motion.form>
            ) : authView === 'register' ? (
              <motion.form
                key="register"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onSubmit={handleRegister}
                style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}
              >
                <div>
                  <label style={labelStyle}>Full Name</label>
                  <div style={inputWrapperStyle}>
                    <User size={16} style={iconStyle} />
                    <input type="text" placeholder="Enter your full name" style={inputStyle} value={regName} onChange={e => setRegName(e.target.value)} required />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>QID</label>
                  <div style={inputWrapperStyle}>
                    <IdCard size={16} style={iconStyle} />
                    <input type="text" placeholder="Enter your QID" style={inputStyle} value={regQid} onChange={e => setRegQid(e.target.value)} required />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Email</label>
                  <div style={inputWrapperStyle}>
                    <Mail size={16} style={iconStyle} />
                    <input type="email" placeholder="Enter your email" style={inputStyle} value={regEmail} onChange={e => setRegEmail(e.target.value)} required />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Password</label>
                  <div style={inputWrapperStyle}>
                    <Lock size={16} style={iconStyle} />
                    <input type={showRegisterPass ? 'text' : 'password'} placeholder="Create a password" style={inputStyle} value={regPassword} onChange={e => setRegPassword(e.target.value)} required />
                    <div onClick={() => setShowRegisterPass(!showRegisterPass)} style={{ cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', padding: '2px' }}>
                      {showRegisterPass ? <Eye size={18} /> : <EyeOff size={18} />}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '4px' }}>
                  <input type="checkbox" required style={{ accentColor: '#6366f1', width: '14px', height: '14px' }} />
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    I agree to all statements in <span style={{ color: '#6366f1', textDecoration: 'underline', cursor: 'pointer' }}>terms of service</span>
                  </span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                  style={{
                    width: 'fit-content', padding: '12px 40px', marginTop: '4px',
                    background: loading ? '#a5b4fc' : 'linear-gradient(135deg, #6366f1, #a855f7)',
                    color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                    letterSpacing: '1.5px', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 8px 20px -4px rgba(99,102,241,0.4)',
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}
                >
                  {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Creating...</> : 'Sign Up'}
                </motion.button>
              </motion.form>
            ) : authView === 'forgot' ? (
              <motion.form
                key="forgot"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onSubmit={handleForgotPassword}
                style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
              >
                <div>
                  <label style={labelStyle}>QID (Unique ID)</label>
                  <div style={inputWrapperStyle}>
                    <IdCard size={16} style={iconStyle} />
                    <input type="number" placeholder="Enter your QID" style={inputStyle} value={resetQid} onChange={e => setResetQid(e.target.value)} required />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Registered Email</label>
                  <div style={inputWrapperStyle}>
                    <Mail size={16} style={iconStyle} />
                    <input type="email" placeholder="Enter your email" style={inputStyle} value={resetEmail} onChange={e => setResetEmail(e.target.value)} required />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading}
                    style={{
                      padding: '12px 32px',
                      background: loading ? '#a5b4fc' : 'linear-gradient(135deg, #6366f1, #a855f7)',
                      color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                      letterSpacing: '1.5px', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer',
                      boxShadow: '0 8px 20px -4px rgba(99,102,241,0.4)',
                      display: 'flex', alignItems: 'center', gap: '8px',
                    }}
                  >
                    {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Sending...</> : 'Send OTP'}
                  </motion.button>
                  
                  <span onClick={() => { setAuthView('login'); setError(''); setSuccess(''); }} style={{ fontSize: '13px', color: '#64748b', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}>
                    Back to Login
                  </span>
                </div>
              </motion.form>
            ) : (
              <motion.form
                key="reset"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onSubmit={handleResetPassword}
                style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
              >
                <div>
                  <label style={labelStyle}>Enter 6-Digit OTP</label>
                  <div style={inputWrapperStyle}>
                    <Lock size={16} style={iconStyle} />
                    <input type="text" placeholder="e.g. 123456" style={inputStyle} value={resetOtp} onChange={e => setResetOtp(e.target.value)} required maxLength={6} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>New Password</label>
                  <div style={inputWrapperStyle}>
                    <Lock size={16} style={iconStyle} />
                    <input type={showResetPass ? 'text' : 'password'} placeholder="At least 6 characters" style={inputStyle} value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
                    <div onClick={() => setShowResetPass(!showResetPass)} style={{ cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', padding: '2px' }}>
                      {showResetPass ? <Eye size={18} /> : <EyeOff size={18} />}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label style={labelStyle}>Confirm New Password</label>
                  <div style={inputWrapperStyle}>
                    <Lock size={16} style={iconStyle} />
                    <input type={showResetPass ? 'text' : 'password'} placeholder="Must match new password" style={inputStyle} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                  style={{
                    width: 'fit-content', padding: '12px 32px', marginTop: '8px',
                    background: loading ? '#a5b4fc' : 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                    letterSpacing: '1.5px', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 8px 20px -4px rgba(16, 185, 129, 0.4)',
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}
                >
                  {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Resetting...</> : 'Reset Password'}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Spinner and pulse animations */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulseIcon {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.3); }
          50% { transform: scale(1.05); box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
        }
      `}</style>
    </div>
  );
};

const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 700, color: '#6366f1', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: '6px' };
const inputWrapperStyle = { display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' };
const iconStyle = { color: '#cbd5e1', flexShrink: 0 };
const inputStyle = { flex: 1, border: 'none', outline: 'none', fontSize: '14px', fontWeight: 500, color: '#1e293b', fontFamily: 'Inter, sans-serif', background: 'transparent' };

export default AuthForm;
