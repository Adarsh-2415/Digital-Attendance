import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Book, MapPin, Calendar, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

import API_URL from '../config';

const departments = [
  'Department of bachelors of Computer applications (BCA)',
  'Department of bachelors of technology(B.Tech)'
];

const StudentProfileSetup = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [formData, setFormData] = useState({
    department: '',
    section: '',
    year: '',
    semester: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.department || !formData.section || !formData.year || !formData.semester) {
      setError('Please fill in all the details to continue.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/student/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        // Update local storage user
        const updatedUser = { 
          ...user, 
          ...formData,
          profileCompleted: 1 
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Redirect to dashboard
        navigate('/student/dashboard');
      } else {
        setError(data.error || 'Failed to update profile.');
      }
    } catch (err) {
      setError('An error occurred while updating your profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '20px', fontFamily: 'Inter, sans-serif' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: '500px', background: '#fff', borderRadius: '24px', padding: '40px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#eef2ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <User size={32} />
          </div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#1e293b' }}>Complete Your Profile</h1>
          <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '15px' }}>Let's get your academic details set up before you access the dashboard.</p>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', borderRadius: '12px', fontSize: '14px', fontWeight: 600, marginBottom: '24px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Department / Course</label>
            <div style={{ position: 'relative' }}>
              <Book size={18} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '15px' }} />
              <select 
                name="department"
                value={formData.department}
                onChange={handleChange}
                style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '15px', color: '#1e293b', outline: 'none', appearance: 'none', background: '#fff' }}
              >
                <option value="">Select your department</option>
                {departments.map((dep, idx) => (
                  <option key={idx} value={dep}>{dep}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Section</label>
            <div style={{ position: 'relative' }}>
              <MapPin size={18} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '15px' }} />
              <input 
                type="text"
                name="section"
                placeholder="e.g., A, B, C"
                value={formData.section}
                onChange={handleChange}
                style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '15px', color: '#1e293b', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Year</label>
              <div style={{ position: 'relative' }}>
                <Calendar size={18} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '15px' }} />
                <select 
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '15px', color: '#1e293b', outline: 'none', appearance: 'none', background: '#fff' }}
                >
                  <option value="">Select</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Semester</label>
              <div style={{ position: 'relative' }}>
                <Clock size={18} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '15px' }} />
                <select 
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '15px', color: '#1e293b', outline: 'none', appearance: 'none', background: '#fff' }}
                >
                  <option value="">Select</option>
                  <option value="1">1st Sem</option>
                  <option value="2">2nd Sem</option>
                  <option value="3">3rd Sem</option>
                  <option value="4">4th Sem</option>
                  <option value="5">5th Sem</option>
                  <option value="6">6th Sem</option>
                  <option value="7">7th Sem</option>
                  <option value="8">8th Sem</option>
                </select>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              background: '#6366f1', color: '#fff', border: 'none', padding: '16px', 
              borderRadius: '14px', fontSize: '16px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '12px', transition: 'background 0.2s', opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Saving Profile...' : 'Save & Continue'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default StudentProfileSetup;
