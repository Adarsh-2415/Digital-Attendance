import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Calendar, Clock, LogOut, User,
  Plus, X, Send, ClipboardList, Info, AlertCircle, CheckCircle2,
  Menu, ChevronLeft, CheckCircle, XCircle, FileText, Download, AlertTriangle, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ChangePasswordModal from '../components/ChangePasswordModal';

import API_URL from '../config';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  if (typeof dateStr === 'string' && dateStr.length === 10 && dateStr.includes('-')) {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return dateStr;
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${day}/${month}/${year}, ${time}`;
  }
  return dateStr;
};

const StudentDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [viewDetailsLoading, setViewDetailsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [myRequests, setMyRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDocView, setShowDocView] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    courseSecDept: '',
    yearSemester: '',
    eventName: '',
    eventDate: '',
    endDate: '',
    eventType: 'Technical',
    roleInEvent: 'Participant',
    reason: '',
    declarationAccepted: false,
  });

  const [participants, setParticipants] = useState([]);
  const [newParticipant, setNewParticipant] = useState({ name: '', qid: '', course: '', year: '' });
  
  const [facultySubjects, setFacultySubjects] = useState([]);
  const [hodData, setHodData] = useState(null);
  const [missedLectures, setMissedLectures] = useState([]);
  const [newLecture, setNewLecture] = useState({ subjectId: '', date: '' });
  const [proofFile, setProofFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchRequests();
    if (user.department) {
      fetchDynamicData(user.department);
    }
  }, []);

  const fetchDynamicData = async (department) => {
    try {
      // Fetch HOD
      const resHod = await fetch(`${API_URL}/data/hod?department=${encodeURIComponent(department)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resHod.ok) {
        const hod = await resHod.json();
        setHodData(hod);
      }

      // Fetch Faculty/Subjects
      const resFac = await fetch(`${API_URL}/data/faculty?department=${encodeURIComponent(department)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resFac.ok) {
        const facs = await resFac.json();
        setFacultySubjects(facs);
      }
    } catch (err) {
      console.error('Error fetching dynamic data:', err);
    }
  };

  const fetchRequests = async () => {
    setFetching(true);
    try {
      const res = await fetch(`${API_URL}/student/requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMyRequests(data);
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setFetching(false);
    }
  };

  const handleViewDetails = async (requestId) => {
    setViewDetailsLoading(true);
    try {
      const res = await fetch(`${API_URL}/student/requests/${requestId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedRequest(data);
      }
    } catch (err) {
      console.error('Error fetching details:', err);
    } finally {
      setViewDetailsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setShowSuccessScreen(false);
    setMessage({ type: '', text: '' });
    setFormData({
      courseSecDept: '',
      yearSemester: '',
      eventName: '',
      eventDate: '',
      endDate: '',
      eventType: 'Technical',
      roleInEvent: 'Participant',
      reason: '',
      declarationAccepted: false,
    });
    setParticipants([]);
    setNewParticipant({ name: '', qid: '', course: '', year: '' });
    setMissedLectures([]);
    setNewLecture({ subjectId: '', date: '' });
    setProofFile(null);
  };

  const handleAddParticipant = () => {
    if (newParticipant.name && newParticipant.qid && newParticipant.course && newParticipant.year) {
      setParticipants([...participants, { ...newParticipant, id: Date.now() }]);
      setNewParticipant({ name: '', qid: '', course: '', year: '' });
    }
  };

  const handleRemoveParticipant = (id) => {
    setParticipants(participants.filter(p => p.id !== id));
  };

  const handleAddLecture = () => {
    if (newLecture.subjectId && newLecture.date) {
      // Check for duplicates
      const isDuplicate = missedLectures.some(l => l.subjectId === newLecture.subjectId && l.date === newLecture.date);
      if (isDuplicate) {
        setMessage({ type: 'error', text: 'This lecture is already added for the selected date.' });
        return;
      }
      const subject = facultySubjects.find(s => s.subjectId === parseInt(newLecture.subjectId));
      setMissedLectures([...missedLectures, { ...newLecture, id: Date.now(), subjectName: subject?.subjectName, subjectCode: subject?.subjectCode }]);
      setNewLecture({ ...newLecture, subjectId: '' }); // Reset subject but keep date for convenience
      setMessage({ type: '', text: '' });
    }
  };

  const handleRemoveLecture = (id) => {
    setMissedLectures(missedLectures.filter(l => l.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.declarationAccepted) {
      setMessage({ type: 'error', text: 'You must accept the declaration to submit.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    let finalParticipants = [...participants];
    if (newParticipant.name && newParticipant.qid) {
      finalParticipants.push({ ...newParticipant, id: Date.now() });
    }

    if (!proofFile) {
      setMessage({ type: 'error', text: 'Please upload a proof of participation.' });
      setLoading(false);
      return;
    }
    
    const formDataObj = new FormData();
    formDataObj.append('courseSecDept', user.department);
    formDataObj.append('yearSemester', `Year ${user.year}, Sem ${user.semester}`);
    formDataObj.append('eventName', formData.eventName);
    formDataObj.append('eventDate', formData.eventDate);
    formDataObj.append('endDate', formData.endDate || '');
    formDataObj.append('eventType', formData.eventType);
    formDataObj.append('roleInEvent', formData.roleInEvent);
    formDataObj.append('reason', formData.reason);
    formDataObj.append('declarationAccepted', formData.declarationAccepted);
    formDataObj.append('participants', JSON.stringify(finalParticipants));
    formDataObj.append('missedLectures', JSON.stringify(missedLectures.map(l => ({ subjectId: l.subjectId, lectureDate: l.date }))));
    formDataObj.append('proof', proofFile);
    
    try {
      const res = await fetch(`${API_URL}/attendance-requests`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataObj,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit request');
      }

      setShowSuccessScreen(true);
      setParticipants([]);
      setNewParticipant({ name: '', qid: '', course: '', year: '' });
      fetchRequests();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const navigateToView = (viewId) => {
    setActiveView(viewId);
    setIsSidebarOpen(false);
  };

  const renderTrackerList = (list, title, showLimit = false) => {
    const displayList = showLimit ? list.slice(0, 5) : list;
    
    return (
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ background: '#eef2ff', padding: '10px', borderRadius: '12px' }}>
            <Clock size={20} color="#6366f1" />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>
            {title} {showLimit && list.length > 5 && <span style={{ fontSize: '14px', color: '#94a3b8' }}>(Showing latest 5)</span>}
          </h3>
        </div>

        {fetching ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Refreshing data...</div>
        ) : displayList.length === 0 ? (
          <div style={{ 
            background: '#fff', padding: '48px', borderRadius: '24px', textAlign: 'center',
            border: '1px dashed #e2e8f0'
          }}>
            <p style={{ color: '#64748b', fontSize: '16px', fontWeight: 500 }}>
              No requests found for this view.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
            {displayList.map((req) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(0,0,0,0.08)' }}
                onClick={() => handleViewDetails(req.id)}
                style={{
                  background: '#fff', padding: '24px', borderRadius: '24px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9',
                  display: 'flex', flexDirection: 'column', gap: '16px',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontSize: '17px', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>
                      {req.eventName}
                    </h4>
                    <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={13} />
                      {formatDate(req.eventDate)}
                    </div>
                  </div>
                  <div style={{
                    padding: '5px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 800,
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                    background: req.status === 'approved' ? '#f0fdf4' : req.status === 'rejected' ? '#fef2f2' : '#fffbeb',
                    color: req.status === 'approved' ? '#16a34a' : req.status === 'rejected' ? '#ef4444' : '#d97706',
                    border: `1px solid ${req.status === 'approved' ? '#bbf7d0' : req.status === 'rejected' ? '#fecaca' : '#fef3c7'}`
                  }}>
                    {req.status}
                  </div>
                </div>
                {req.status === 'rejected' && req.rejectionReason && (
                   <div style={{ fontSize: '12px', color: '#ef4444', background: '#fef2f2', padding: '10px', borderRadius: '8px', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <AlertTriangle size={14} /> <span>Reason: {req.rejectionReason.length > 50 ? req.rejectionReason.substring(0, 50) + '...' : req.rejectionReason}</span>
                   </div>
                )}
                <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '12px', fontSize: '13px', color: '#475569', lineHeight: 1.4, border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{req.eventType} Participation</span>
                  {req.status === 'approved' && <FileText size={16} color="#6366f1" />}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      
      {/* ───── SIDEBAR BACKDROP ───── */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 1900, cursor: 'pointer' }}
          />
        )}
      </AnimatePresence>

      {/* ───── SLIDING SIDEBAR ───── */}
      <AnimatePresence>
        <motion.div 
          initial={{ x: '-100%' }}
          animate={{ x: isSidebarOpen ? 0 : '-100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={{
            width: '280px', height: '100vh', background: 'linear-gradient(135deg, #1e293b, #0f172a)', 
            position: 'fixed', left: 0, top: 0,
            display: 'flex', flexDirection: 'column', padding: '40px 24px', color: '#fff', zIndex: 2000,
            boxShadow: isSidebarOpen ? '20px 0 50px rgba(0,0,0,0.3)' : 'none'
          }}
        >
          <button onClick={() => setIsSidebarOpen(false)} style={{ position: 'absolute', right: '-16px', top: '40px', background: '#6366f1', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><ChevronLeft size={20} /></button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '48px', padding: '0 12px' }}>
            <div style={{ background: '#6366f1', padding: '10px', borderRadius: '14px' }}><BookOpen size={22} color="#fff" /></div>
            <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>STUDENT</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'approved', label: 'Approved Attendance', icon: CheckCircle },
              { id: 'rejected', label: 'Rejected Attendance', icon: XCircle },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => navigateToView(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px',
                  borderRadius: '14px', border: 'none', background: activeView === item.id ? 'rgba(99,102,241,0.2)' : 'transparent',
                  color: activeView === item.id ? '#6366f1' : '#94a3b8', cursor: 'pointer',
                  textAlign: 'left', fontWeight: activeView === item.id ? 700 : 500, transition: 'all 0.2s'
                }}
              >
                <item.icon size={20} />
                <span style={{ fontSize: '14px' }}>{item.label}</span>
              </button>
            ))}
            <button
              onClick={() => { setShowChangePassword(true); setIsSidebarOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px',
                borderRadius: '14px', border: 'none', background: 'transparent',
                color: '#94a3b8', cursor: 'pointer',
                textAlign: 'left', fontWeight: 500, transition: 'all 0.2s'
              }}
            >
              <Lock size={20} />
              <span style={{ fontSize: '14px' }}>Change Password</span>
            </button>
          </div>

          <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 12px 20px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', fontWeight: 800 }}>{user.fullName?.charAt(0)}</div>
              <div><p style={{ fontSize: '14px', fontWeight: 700 }}>{user.fullName?.split(' ')[0]}</p><p style={{ fontSize: '11px', color: '#64748b' }}>Student</p></div>
            </div>
            <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', color: '#ef4444', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}><LogOut size={18} /> Sign Out</button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ───── TOP NAVBAR ───── */}
      <nav style={{
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 4px 25px rgba(99,102,241,0.2)', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button onClick={() => setIsSidebarOpen(true)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '10px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Menu size={24} /></button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
             <BookOpen size={20} color="#fff" />
             <span style={{ color: '#fff', fontSize: '20px', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>Student Hub</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.1)', padding: '6px 14px', borderRadius: '12px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={14} color="#6366f1" /></div>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: '13px' }}>{user.fullName}</span>
          </div>
          <button onClick={handleLogout} style={{ background: '#fff', border: 'none', color: '#ef4444', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>Logout</button>
        </div>
      </nav>

      {/* ───── MAIN CONTENT ───── */}
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        
        <AnimatePresence mode="wait">
          {activeView === 'dashboard' ? (
            <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                <div>
                  <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#1e293b', marginBottom: '8px', fontFamily: 'Outfit, sans-serif' }}>Welcome, {user.fullName?.split(' ')[0]}! 👋</h1>
                  <p style={{ fontSize: '16px', color: '#64748b', fontWeight: 500 }}>QID: <span style={{ color: '#6366f1', fontWeight: 700 }}>{user.qid}</span></p>
                </div>
                <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={() => setShowForm(true)} style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: '#fff', padding: '14px 28px', borderRadius: '14px', border: 'none', fontSize: '15px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 10px 20px -5px rgba(99,102,241,0.4)' }}>
                  <Plus size={20} /> Apply for Attendance
                </motion.button>
              </div>
              {renderTrackerList(myRequests, 'Latest Track Status', true)}
            </motion.div>
          ) : activeView === 'approved' ? (
            <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b', marginBottom: '32px', fontFamily: 'Outfit, sans-serif' }}>Approved Applications</h2>
              {renderTrackerList(myRequests.filter(r => r.status === 'approved'), 'My Approvals', false)}
            </motion.div>
          ) : (
            <motion.div key="rej" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b', marginBottom: '32px', fontFamily: 'Outfit, sans-serif' }}>Rejected Applications</h2>
              {renderTrackerList(myRequests.filter(r => r.status === 'rejected'), 'My Rejections', false)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ───── MODALS (Form & Details) ───── */}
      <AnimatePresence>
        {showForm && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', background: '#fff', borderRadius: '28px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '24px 32px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><h2 style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>Attendance Request</h2><p style={{ fontSize: '14px', opacity: 0.9, marginTop: '2px' }}>Submit details for event participation</p></div>
                <button onClick={handleCloseForm} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '8px', borderRadius: '12px', cursor: 'pointer' }}><X size={24} /></button>
              </div>
              <div style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>
                {showSuccessScreen ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', textAlign: 'center' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}><CheckCircle2 size={48} color="#16a34a" /></div>
                    <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b', marginBottom: '12px' }}>Submission Successful!</h3>
                    <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '32px' }}>Your request is now pending HOD approval.</p>
                    <button onClick={handleCloseForm} style={{ background: '#6366f1', color: '#fff', padding: '12px 32px', borderRadius: '12px', border: 'none', fontWeight: 700, fontSize: '16px', cursor: 'pointer' }}>Done</button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    {message.text && <div style={{ padding: '16px', borderRadius: '14px', marginBottom: '24px', background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', fontSize: '14px', fontWeight: 600 }}>{message.text}</div>}
                    <div style={{ marginBottom: '32px' }}><h4 style={sectionTitleStyle}>1. Reason & Duration</h4><div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div style={inputGroupStyle}><label style={labelStyle}>Reason</label><textarea rows="3" required style={{ ...inputStyle, resize: 'none' }} value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} /></div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}><div style={inputGroupStyle}><label style={labelStyle}>Start Date</label><input type="date" required style={inputStyle} value={formData.eventDate} onChange={e => setFormData({ ...formData, eventDate: e.target.value })} /></div><div style={inputGroupStyle}><label style={labelStyle}>End Date (Opt)</label><input type="date" style={inputStyle} value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} /></div></div>
                    </div></div>
                    <div style={{ marginBottom: '32px' }}>
                      <h4 style={sectionTitleStyle}>2. Event Details</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div style={{ ...inputGroupStyle, gridColumn: 'span 2' }}>
                          <label style={labelStyle}>Event Name</label>
                          <input type="text" required style={inputStyle} value={formData.eventName} onChange={e => setFormData({ ...formData, eventName: e.target.value })} />
                        </div>
                        <div style={inputGroupStyle}>
                          <label style={labelStyle}>Type</label>
                          <select style={inputStyle} value={formData.eventType} onChange={e => setFormData({ ...formData, eventType: e.target.value })}>
                            <option>Technical</option><option>Cultural</option><option>Sports</option>
                          </select>
                        </div>
                        <div style={inputGroupStyle}>
                          <label style={labelStyle}>Role</label>
                          <select style={inputStyle} value={formData.roleInEvent} onChange={e => setFormData({ ...formData, roleInEvent: e.target.value })}>
                            <option>Participant</option><option>Organizer</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: '32px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px', marginBottom: '20px' }}>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>3. Student & Approval Details</h4>
                        {hodData && (
                          <div style={{ background: '#f0fdf4', color: '#16a34a', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, border: '1px solid #bbf7d0' }}>
                            Approving HOD: {hodData.fullName}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div style={inputGroupStyle}>
                          <label style={labelStyle}>Department</label>
                          <input type="text" readOnly style={{ ...inputStyle, background: '#f8fafc', color: '#64748b' }} value={user.department || ''} />
                        </div>
                        <div style={inputGroupStyle}>
                          <label style={labelStyle}>Year / Semester</label>
                          <input type="text" readOnly style={{ ...inputStyle, background: '#f8fafc', color: '#64748b' }} value={`Year ${user.year || ''}, Sem ${user.semester || ''}`} />
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: '32px' }}>
                      <h4 style={sectionTitleStyle}>4. Additional Participants (Optional)</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <div style={inputGroupStyle}><label style={labelStyle}>Student Name</label><input type="text" id="p_name" style={inputStyle} placeholder="Full Name" value={newParticipant.name} onChange={e => setNewParticipant({ ...newParticipant, name: e.target.value })} /></div>
                        <div style={inputGroupStyle}><label style={labelStyle}>Student QID</label><input type="text" id="p_qid" style={inputStyle} placeholder="QID Number" value={newParticipant.qid} onChange={e => setNewParticipant({ ...newParticipant, qid: e.target.value })} /></div>
                        <div style={inputGroupStyle}><label style={labelStyle}>Course</label><input type="text" id="p_course" style={inputStyle} placeholder="e.g. B.Tech CSE" value={newParticipant.course} onChange={e => setNewParticipant({ ...newParticipant, course: e.target.value })} /></div>
                        <div style={inputGroupStyle}><label style={labelStyle}>Year</label><input type="text" id="p_year" style={inputStyle} placeholder="e.g. 1st Year" value={newParticipant.year} onChange={e => setNewParticipant({ ...newParticipant, year: e.target.value })} /></div>
                        <button type="button" onClick={handleAddParticipant} style={{ gridColumn: 'span 2', background: '#6366f1', color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', marginTop: '8px' }}>Add Participant</button>
                      </div>
                      
                      {participants.length > 0 && (
                        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {participants.map(p => (
                            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', background: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px' }}>
                              <div><span style={{ fontWeight: 700, fontSize: '14px' }}>{p.name}</span> <span style={{ color: '#64748b', fontSize: '12px', marginLeft: '8px' }}>QID: {p.qid}</span></div>
                              <button type="button" onClick={() => handleRemoveParticipant(p.id)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Remove</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ marginBottom: '32px' }}>
                      <h4 style={sectionTitleStyle}>5. Lectures Missed</h4>
                      <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          <div style={inputGroupStyle}>
                            <label style={labelStyle}>Lecture Date</label>
                            <input type="date" style={inputStyle} value={newLecture.date} onChange={e => setNewLecture({ ...newLecture, date: e.target.value })} />
                          </div>
                          <div style={inputGroupStyle}>
                            <label style={labelStyle}>Subject / Lecture</label>
                            <select style={inputStyle} value={newLecture.subjectId} onChange={e => setNewLecture({ ...newLecture, subjectId: e.target.value })}>
                              <option value="">Select Subject</option>
                              {facultySubjects.map(s => <option key={s.subjectId} value={s.subjectId}>{s.subjectCode} - {s.subjectName} ({s.facultyName})</option>)}
                            </select>
                          </div>
                        </div>
                        <button type="button" onClick={handleAddLecture} style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>Add Lecture Slot</button>
                      </div>

                      {missedLectures.length > 0 && (
                        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {missedLectures.map(l => (
                            <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', background: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px' }}>
                              <div>
                                <span style={{ fontWeight: 700, fontSize: '14px' }}>{l.subjectName}</span>
                                <span style={{ color: '#6366f1', fontSize: '12px', marginLeft: '12px', fontWeight: 600 }}>{formatDate(l.date)}</span>
                              </div>
                              <button type="button" onClick={() => handleRemoveLecture(l.id)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Remove</button>
                            </div>
                          ))}
                        </div>
                      )}
                      {missedLectures.length === 0 && (
                         <div style={{ marginTop: '12px', padding: '12px', background: '#fffbeb', borderRadius: '12px', border: '1px solid #fef3c7', display: 'flex', alignItems: 'center', gap: '8px', color: '#92400e', fontSize: '12px' }}>
                            <AlertCircle size={14} /> <span>Please add at least one lecture slot.</span>
                         </div>
                      )}
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                      <h4 style={sectionTitleStyle}>6. Proof of Participation</h4>
                      <div style={{ 
                        background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '2px dashed #e2e8f0',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center'
                      }}>
                        <div style={{ width: '48px', height: '48px', background: '#eef2ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                          <Plus size={24} />
                        </div>
                        <div>
                          <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                            {proofFile ? proofFile.name : 'Click to upload proof'}
                          </p>
                          <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                            {proofFile ? `(${(proofFile.size / 1024 / 1024).toFixed(2)} MB)` : 'JPG, PNG or PDF (Max 5MB)'}
                          </p>
                        </div>
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          style={{ display: 'none' }} 
                          accept="image/*,.pdf"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                alert("File size exceeds 5MB limit!");
                                return;
                              }
                              setProofFile(file);
                            }
                          }}
                        />
                        <button 
                          type="button" 
                          onClick={() => fileInputRef.current.click()}
                          style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#1e293b', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          {proofFile ? 'Change File' : 'Select File'}
                        </button>
                      </div>
                    </div>

                    <div style={{ background: '#fff9eb', border: '1px solid #fef3c7', padding: '20px', borderRadius: '16px', marginBottom: '32px' }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <input type="checkbox" required id="decl" checked={formData.declarationAccepted} onChange={e => setFormData({ ...formData, declarationAccepted: e.target.checked })} />
                        <label htmlFor="decl" style={{ fontSize: '12px', color: '#92400e', lineHeight: 1.6, fontWeight: 500, cursor: 'pointer' }}>
                          “I confirm that all the provided details are true and accurate, and that I have participated in the mentioned event. I understand that submitting false information or incorrect participant details may lead to strict disciplinary action against me as per college rules.”
                        </label>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}><button type="button" onClick={handleCloseForm} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#fff', fontWeight: 700 }}>Cancel</button><button type="submit" disabled={loading} style={{ flex: 2, padding: '16px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: '#fff', fontWeight: 700 }}>{loading ? 'Submitting...' : 'Submit Request'}</button></div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ───── DETAILS & DOCUMENT VIEW MODAL ───── */}
      <AnimatePresence>
        {selectedRequest && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }}>
            
            {showDocView ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ width: '100%', maxWidth: '900px', maxHeight: '95vh', background: '#334155', borderRadius: '28px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 40px 100px -20px rgba(0,0,0,0.5)' }}>
                <div className="no-print" style={{ padding: '16px 32px', background: '#1e293b', borderBottom: '1px solid #475569', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#94a3b8' }}><FileText size={20} /><span style={{ fontSize: '14px', fontWeight: 600 }}>Official Approved Document</span></div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={handlePrint} style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}><Download size={16} /> Export / Print</button>
                    <button onClick={() => { setShowDocView(false); }} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '10px', borderRadius: '10px', cursor: 'pointer' }}><X size={20} /></button>
                  </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '40px', display: 'flex', justifyContent: 'center', background: '#475569' }}>
                   <div id="printable-doc" style={{ width: '100%', maxWidth: '800px', background: '#fff', padding: '30px 45px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', minHeight: '900px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ textAlign: 'center', borderBottom: '2px solid #1e293b', paddingBottom: '10px', marginBottom: '15px' }}>
                      <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#1e293b', fontFamily: 'Outfit, sans-serif', marginBottom: '2px' }}>Quantum University</h1>
                      <p style={{ fontSize: '14px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ACADEMIC ATTENDANCE APPROVAL LETTER</p>
                      <div style={{ marginTop: '8px', fontSize: '11px', color: '#1e293b', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                        <span><strong>Ref No:</strong> AUT/2026/{selectedRequest.id.toString().padStart(4, '0')}</span>
                        <span><strong>Date:</strong> {formatDate(new Date())}</span>
                      </div>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                        Subject: Request for Attendance Consideration – Event Participation
                      </h3>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <p style={{ fontSize: '13px', color: '#1e293b', lineHeight: 1.4 }}>
                        To,<br />
                        <strong>The Head of Department</strong><br />
                        Computer Science & Engineering Department
                      </p>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', marginBottom: '4px' }}>Request Statement</h3>
                      <p style={{ fontSize: '13px', color: '#1e293b', lineHeight: 1.5 }}>
                        I hereby request attendance consideration for the following student(s) who participated in the event mentioned below. Their participation required their absence during scheduled academic lectures.
                      </p>
                    </div>

                    <div style={{ marginBottom: '15px', padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', marginBottom: '6px' }}>Event & Lecture Details</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
                        <p style={{ margin: 0 }}><strong>• Event:</strong> {selectedRequest.eventName} ({selectedRequest.eventType})</p>
                        <p style={{ margin: 0 }}><strong>• Period:</strong> {formatDate(selectedRequest.eventDate)} {selectedRequest.endDate ? `– ${formatDate(selectedRequest.endDate)}` : ''}</p>
                        <div style={{ marginTop: '6px', borderTop: '1px dashed #cbd5e1', paddingTop: '6px' }}>
                          <p style={{ margin: '0 0 4px 0', fontWeight: 800, color: '#6366f1' }}>Missed Lectures:</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {selectedRequest.missedLectures?.map((l, idx) => (
                              <span key={idx} style={{ background: '#fff', padding: '2px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '11px' }}>
                                {formatDate(l.lectureDate)}: <strong>{l.subjectCode}</strong>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', marginBottom: '6px' }}>Student Details</h3>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc' }}>
                            <th style={{ padding: '6px', border: '1px solid #e2e8f0', textAlign: 'left' }}>Sr. No.</th>
                            <th style={{ padding: '6px', border: '1px solid #e2e8f0', textAlign: 'left' }}>Student Name</th>
                            <th style={{ padding: '6px', border: '1px solid #e2e8f0', textAlign: 'left' }}>QID</th>
                            <th style={{ padding: '6px', border: '1px solid #e2e8f0', textAlign: 'left' }}>Branch</th>
                            <th style={{ padding: '6px', border: '1px solid #e2e8f0', textAlign: 'left' }}>Year</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={{ padding: '6px', border: '1px solid #e2e8f0' }}>1</td>
                            <td style={{ padding: '6px', border: '1px solid #e2e8f0' }}>{selectedRequest.fullName}</td>
                            <td style={{ padding: '6px', border: '1px solid #e2e8f0' }}>{selectedRequest.qid}</td>
                            <td style={{ padding: '6px', border: '1px solid #e2e8f0' }}>{selectedRequest.courseSecDept}</td>
                            <td style={{ padding: '6px', border: '1px solid #e2e8f0' }}>{selectedRequest.yearSemester}</td>
                          </tr>
                          {selectedRequest.participants?.map((p, idx) => (
                            <tr key={p.id}>
                              <td style={{ padding: '6px', border: '1px solid #e2e8f0' }}>{idx + 2}</td>
                              <td style={{ padding: '6px', border: '1px solid #e2e8f0' }}>{p.name}</td>
                              <td style={{ padding: '6px', border: '1px solid #e2e8f0' }}>{p.qid}</td>
                              <td style={{ padding: '6px', border: '1px solid #e2e8f0' }}>{p.courseSecDeptOpt || '-'}</td>
                              <td style={{ padding: '6px', border: '1px solid #e2e8f0' }}>{p.yearOpt || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <h3 style={{ fontSize: '12px', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', marginBottom: '6px' }}>Reason for Attendance Request</h3>
                      <p style={{ fontSize: '12px', color: '#334155', lineHeight: 1.4, background: '#f8fafc', padding: '10px', borderRadius: '4px', borderLeft: '4px solid #1e293b' }}>
                        The above-mentioned student(s) actively participated in the event, which required their absence from regular classes. Kindly consider granting attendance for the mentioned period.
                      </p>
                    </div>

                    
                    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '2px solid #1e293b' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <p style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>Approval Section (Digital Verification)</p>
                          <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9', minWidth: '280px' }}>
                            <p style={{ fontSize: '12px', color: '#1e293b', marginBottom: '2px' }}><strong>Status:</strong> <span style={{ color: selectedRequest.status === 'approved' ? '#16a34a' : '#ef4444', fontWeight: 800 }}>{selectedRequest.status.toUpperCase()}</span></p>
                            {selectedRequest.status !== 'pending' && (
                              <>
                                <p style={{ fontSize: '12px', color: '#1e293b', marginBottom: '2px' }}><strong>Approved By (HOD Name):</strong> {selectedRequest.processedBy || "Head of Department"}</p>
                                <p style={{ fontSize: '12px', color: '#1e293b', marginBottom: '2px' }}><strong>Date & Time:</strong> {selectedRequest.updatedAt ? formatDateTime(selectedRequest.updatedAt) : 'Digitally Signed'}</p>
                              </>
                            )}
                            <p style={{ fontSize: '11px', color: '#6366f1', fontWeight: 800, marginTop: '4px' }}>Authorized University Document</p>
                          </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                           <div style={{ 
                             border: '3px double #16a34a',
                             color: '#16a34a',
                             padding: '4px 16px', borderRadius: '4px', transform: 'rotate(-5deg)',
                             fontWeight: 900, fontSize: '16px', textTransform: 'uppercase',
                             opacity: selectedRequest.status === 'approved' ? 1 : 0
                           }}>
                             APPROVED
                           </div>
                           <p style={{ fontSize: '8px', marginTop: '4px', color: '#94a3b8', fontWeight: 700 }}>STUDENT COPY</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', background: '#fff', borderRadius: '28px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '24px 32px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>Request Details</h2></div>
                  <button onClick={() => setSelectedRequest(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '8px', borderRadius: '12px' }}><X size={20} /></button>
                </div>
                <div style={{ padding: '32px', overflowY: 'auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                    <DetailRow label="Event Name" value={selectedRequest.eventName} />
                    <DetailRow label="Current Status" value={selectedRequest.status.toUpperCase()} />
                    <DetailRow label="Event Date" value={formatDate(selectedRequest.eventDate)} />
                    <DetailRow label="Your Reason" value={selectedRequest.reason} />
                  </div>

                  <div style={{ marginBottom: '32px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px' }}>Lectures Missed</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedRequest.missedLectures?.map((l, idx) => (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>{l.subjectName} ({l.subjectCode})</span>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#6366f1' }}>{formatDate(l.lectureDate)}</span>
                          </div>
                          {selectedRequest.status === 'approved' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: l.erpMarked ? '#10b981' : '#f59e0b', background: l.erpMarked ? '#ecfdf5' : '#fffbeb', padding: '6px 10px', borderRadius: '6px', width: 'fit-content', border: `1px solid ${l.erpMarked ? '#a7f3d0' : '#fde68a'}` }}>
                              {l.erpMarked ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                              {l.erpMarked ? 'Marked Present in ERP' : 'Pending ERP Update'}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedRequest.status === 'rejected' && selectedRequest.rejectionReason && (
                    <div style={{ padding: '20px', background: '#fff1f2', borderRadius: '16px', border: '1px solid #fecdd3', marginBottom: '32px' }}>
                      <p style={{ fontSize: '11px', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><AlertTriangle size={14} /> Higher Authority Feedback</p>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: '#9f1239', lineHeight: 1.5 }}>Reason for Rejection: {selectedRequest.rejectionReason}</p>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    {selectedRequest.status === 'approved' && (
                      <button 
                        onClick={() => setShowDocView(true)} 
                        style={{ padding: '12px 24px', background: '#6366f1', color: '#fff', borderRadius: '12px', border: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                      >
                        <FileText size={18} /> Official Letter
                      </button>
                    )}
                    <button onClick={() => setSelectedRequest(null)} style={{ padding: '12px 32px', background: '#f1f5f9', color: '#475569', borderRadius: '12px', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Close</button>
                  </div>
                </div>
              </motion.div>
            )}

          </div>
        )}
      </AnimatePresence>

      <ChangePasswordModal 
        isOpen={showChangePassword} 
        onClose={() => setShowChangePassword(false)} 
      />

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          #printable-doc, #printable-doc * { visibility: visible; }
          #printable-doc { position: absolute; left: 0; top: 0; width: 100% !important; max-width: none !important; margin: 0 !important; padding: 40px !important; box-shadow: none !important; }
          .no-print { display: none !important; }
        }
      ` }} />
    </div>
  );
};

const DetailRow = ({ label, value }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>{label}</span>
    <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{value || '-'}</span>
  </div>
);

const sectionTitleStyle = { fontSize: '13px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', marginBottom: '16px' };
const inputGroupStyle = { display: 'flex', flexDirection: 'column', gap: '8px' };
const labelStyle = { fontSize: '13px', fontWeight: 600, color: '#1e293b' };
const inputStyle = { padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '14px', background: '#f8fafc', outline: 'none' };

export default StudentDashboard;
