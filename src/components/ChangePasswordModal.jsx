import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, Loader2, X } from 'lucide-react';

import API_URL from '../config';

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const resetState = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    setShowCurrent(false);
    setShowNew(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (newPassword !== confirmPassword) {
      return setError('New passwords do not match');
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to change password');
      } else {
        setSuccess('Password changed successfully!');
        setTimeout(() => {
          handleClose();
        }, 1500);
      }
    } catch (err) {
      setError('Server is not reachable.');
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        padding: '20px'
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          style={{
            background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '400px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{ 
            padding: '20px 24px', borderBottom: '1px solid #e2e8f0', 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: '#f8fafc'
          }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>
              Change Password
            </h3>
            <button 
              onClick={handleClose}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '24px' }}>
            {error && (
              <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, marginBottom: '20px' }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ background: '#f0fdf4', color: '#16a34a', padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, marginBottom: '20px' }}>
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div>
                <label style={labelStyle}>Current Password</label>
                <div style={inputWrapperStyle}>
                  <Lock size={16} style={iconStyle} />
                  <input 
                    type={showCurrent ? 'text' : 'password'} 
                    style={inputStyle} 
                    value={currentPassword} 
                    onChange={e => setCurrentPassword(e.target.value)} 
                    required 
                  />
                  <div onClick={() => setShowCurrent(!showCurrent)} style={{ cursor: 'pointer', color: '#94a3b8', padding: '2px' }}>
                    {showCurrent ? <Eye size={18} /> : <EyeOff size={18} />}
                  </div>
                </div>
              </div>

              <div>
                <label style={labelStyle}>New Password</label>
                <div style={inputWrapperStyle}>
                  <Lock size={16} style={iconStyle} />
                  <input 
                    type={showNew ? 'text' : 'password'} 
                    placeholder="Min 6 characters"
                    style={inputStyle} 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    required 
                    minLength={6}
                  />
                  <div onClick={() => setShowNew(!showNew)} style={{ cursor: 'pointer', color: '#94a3b8', padding: '2px' }}>
                    {showNew ? <Eye size={18} /> : <EyeOff size={18} />}
                  </div>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Confirm New Password</label>
                <div style={inputWrapperStyle}>
                  <Lock size={16} style={iconStyle} />
                  <input 
                    type={showNew ? 'text' : 'password'} 
                    placeholder="Must match new password"
                    style={inputStyle} 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    required 
                    minLength={6}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button 
                  type="button" 
                  onClick={handleClose}
                  style={{
                    padding: '10px 16px', background: 'transparent', border: '1px solid #e2e8f0', 
                    borderRadius: '8px', color: '#64748b', fontSize: '13px', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  style={{
                    padding: '10px 24px', background: '#6366f1', border: 'none', 
                    borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                >
                  {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Update Password'}
                </button>
              </div>

            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '8px' };
const inputWrapperStyle = { display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px' };
const iconStyle = { color: '#94a3b8', flexShrink: 0 };
const inputStyle = { flex: 1, border: 'none', outline: 'none', fontSize: '14px', color: '#1e293b', background: 'transparent' };

export default ChangePasswordModal;
