import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, ClipboardList, CheckCircle, XCircle, Clock, 
  Menu, LogOut, ChevronLeft, Bell, Search, Filter,
  FileText, Download, X, RotateCcw, AlertTriangle, Send, Eye, Lock
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

const HodDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ totalStudents: 0, pendingRequests: 0, totalApproved: 0, totalFaculty: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDocView, setShowDocView] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Rejection State
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [requestToBeRejected, setRequestToBeRejected] = useState(null);
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showToast, setShowToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    if (showToast.show) {
      const timer = setTimeout(() => {
        setShowToast({ ...showToast, show: false });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [reqRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/hod/requests`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/hod/stats`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (reqRes.ok && statsRes.ok) {
        setRequests(await reqRes.json());
        setStats(await statsRes.json());
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewRequest = async (id, isDocView = false) => {
    // Clear old data immediately to show loading state
    setSelectedRequest(null);
    try {
      const res = await fetch(`${API_URL}/hod/requests/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedRequest(data);
        setShowDocView(isDocView);
      }
    } catch (err) {
      console.error('Error fetching request details:', err);
    }
  };

  const handleUpdateStatus = async (id, status, reason = '') => {
    if (status === 'rejected' && !reason) {
      setRequestToBeRejected(id);
      setShowRejectionModal(true);
      return;
    }

    setIsSubmittingStatus(true);
    try {
      const res = await fetch(`${API_URL}/hod/requests/${id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status, rejectionReason: reason })
      });
      
      if (res.ok) {
        fetchDashboardData();
        if (selectedRequest && selectedRequest.id === id) {
          // Refresh selected request details
          const detailRes = await fetch(`${API_URL}/hod/requests/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (detailRes.ok) setSelectedRequest(await detailRes.json());
        }
        setShowRejectionModal(false);
        setRejectionReason('');
        setRequestToBeRejected(null);
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setIsSubmittingStatus(false);
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

  const renderRequestList = (list, title, showLimit = false, customMessage = 'No applications match this view.') => {
    const filteredList = list.filter(r => 
      r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.qid.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const displayList = showLimit ? filteredList.slice(0, 5) : filteredList;
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>
              {title} {showLimit && filteredList.length > 5 && <span style={{ fontSize: '14px', color: '#94a3b8' }}>(Showing latest 5)</span>}
            </h3>
          </div>
          <button 
            onClick={fetchDashboardData}
            style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '10px 20px', borderRadius: '12px', color: '#64748b', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <RotateCcw size={16} /> Sync
          </button>
        </div>

        {displayList.length === 0 ? (
          <div style={{ background: '#fff', padding: '60px', borderRadius: '32px', textAlign: 'center', border: '1px dashed #e2e8f0' }}>
            <p style={{ color: '#94a3b8', fontSize: '16px', fontWeight: 500 }}>{customMessage}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {displayList.map((req) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}
                onClick={() => handleViewRequest(req.id, false)}
                style={{
                  background: '#fff', padding: '20px 24px', borderRadius: '20px',
                  display: 'grid', gridTemplateColumns: '44px 1.5fr 1fr 1fr auto auto', alignItems: 'center', gap: '28px',
                  cursor: 'pointer', border: '1px solid #f1f5f9', transition: 'all 0.2s'
                }}
              >
                <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', fontWeight: 800 }}>{req.fullName.charAt(0)}</div>
                <div><p style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>{req.fullName}</p><p style={{ fontSize: '12px', color: '#64748b' }}>QID: {req.qid}</p></div>
                <div><p style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Event</p><p style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>{req.eventName}</p></div>
                <div><p style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Date</p><p style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>{formatDate(req.eventDate)}</p></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px', width: 'fit-content',
                    fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px',
                    color: req.status === 'approved' ? '#10b981' : req.status === 'rejected' ? '#ef4444' : '#f59e0b',
                    background: req.status === 'approved' ? '#f0fdf4' : req.status === 'rejected' ? '#fef2f2' : '#fffbeb',
                    padding: '4px 10px', borderRadius: '6px'
                  }}>
                    {req.status === 'approved' ? <CheckCircle size={10} /> : req.status === 'rejected' ? <XCircle size={10} /> : <Clock size={10} />}
                    {req.status}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', flexShrink: 0 }}>
                   <div className="tooltip-target" style={{ position: 'relative' }}>
                     <button 
                       onClick={(e) => { e.stopPropagation(); handleViewRequest(req.id, false); }} 
                       style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#1e293b', padding: '10px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                     >
                       <Eye size={18} />
                     </button>
                     <span className="tooltip-box">Quick View</span>
                   </div>
 
                   <div className="tooltip-target" style={{ position: 'relative' }}>
                     <button 
                       onClick={(e) => { e.stopPropagation(); handleViewRequest(req.id, true); }} 
                       style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', padding: '10px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                     >
                       <FileText size={18} />
                     </button>
                     <span className="tooltip-box">Official Doc</span>
                   </div>
 
                   {req.status === 'pending' && (
                     <>
                        {/* 3. Approve Button */}
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleUpdateStatus(req.id, 'approved');
                            setShowToast({ show: true, message: 'Success: You have approved this attendance request!', type: 'success' });
                          }} 
                          style={{ background: '#fff', border: '1.5px solid #10b981', color: '#10b981', padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          Approve
                        </button>
 
                        {/* 4. Reject Button */}
                        <button 
                          onClick={(e) => { e.stopPropagation(); setRequestToBeRejected(req.id); setShowRejectionModal(true); }} 
                          style={{ background: '#fff', border: '1.5px solid #ef4444', color: '#ef4444', padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          Reject
                        </button>
                     </>
                   )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex' }}>
      
      {/* ───── SIDEBAR ───── */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 1000 }}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={{ x: '-100%' }}
        animate={{ x: isSidebarOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        style={{
          width: '300px', height: '100vh', background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          position: 'fixed', left: 0, top: 0, zIndex: 1001, padding: '40px 24px', color: '#fff',
          display: 'flex', flexDirection: 'column', boxShadow: '20px 0 50px rgba(0,0,0,0.2)'
        }}
      >
        <button onClick={() => setIsSidebarOpen(false)} style={{ position: 'absolute', right: '-16px', top: '40px', background: '#6366f1', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft size={20} /></button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '48px', padding: '0 12px' }}>
           <div style={{ background: '#6366f1', padding: '10px', borderRadius: '14px' }}><ClipboardList size={22} color="#fff" /></div>
           <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px', fontFamily: 'Outfit, sans-serif' }}>DIGITAL PANEL</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {[
            { id: 'dashboard', label: 'Overview', icon: Users },
            { id: 'all', label: 'Attendance Requests', icon: ClipboardList, badge: pendingCount },
            { id: 'approved', label: 'Approved Attendance', icon: CheckCircle },
            { id: 'rejected', label: 'Rejected Attendance', icon: XCircle }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveView(item.id); setIsSidebarOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px', borderRadius: '14px',
                border: 'none', background: activeView === item.id ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                color: activeView === item.id ? '#6366f1' : '#94a3b8', cursor: 'pointer', textAlign: 'left',
                fontWeight: activeView === item.id ? 700 : 500, transition: 'all 0.2s', position: 'relative'
              }}
            >
              <item.icon size={20} />
              <span style={{ fontSize: '14px' }}>{item.label}</span>
              {item.badge > 0 && (
                <span style={{ position: 'absolute', right: '18px', background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 900, padding: '2px 8px', borderRadius: '20px' }}>{item.badge}</span>
              )}
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

        <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
           <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', color: '#ef4444', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
             <LogOut size={18} /> Sign Out
           </button>
        </div>
      </motion.aside>

      {/* ───── MAIN CONTENT ───── */}
      <main style={{ flex: 1, padding: '40px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button onClick={() => setIsSidebarOpen(true)} style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '14px', cursor: 'pointer', color: '#1e293b' }}><Menu size={24} /></button>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>Control Center</h1>
              <p style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>Welcome back, <span style={{ color: '#6366f1', fontWeight: 700 }}>{user.fullName}</span></p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
             <div style={{ position: 'relative' }}>
               <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
               <input 
                 type="text" 
                 placeholder="Search student..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '12px 12px 12px 48px', width: '300px', fontSize: '14px', fontWeight: 500 }}
               />
             </div>
             <button onClick={handleLogout} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>Logout</button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeView === 'dashboard' ? (
            <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '48px' }}>
                {[
                  { label: 'Pending Queue', value: stats.pendingRequests, icon: Clock, color: '#f59e0b', bg: '#fffbeb' },
                  { label: 'Total Approved', value: stats.totalApproved, icon: CheckCircle, color: '#10b981', bg: '#f0fdf4' },
                  { label: 'Students Enrolled', value: stats.totalStudents, icon: Users, color: '#6366f1', bg: '#eef2ff' },
                  { label: 'Faculty Members', value: stats.totalFaculty, icon: ClipboardList, color: '#ec4899', bg: '#fdf2f8' }
                ].map((stat, i) => (
                  <div key={i} style={{ background: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                    <div style={{ width: '40px', height: '40px', background: stat.bg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: stat.color }}><stat.icon size={20} /></div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>{stat.label}</p>
                    <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b' }}>{stat.value}</h2>
                  </div>
                ))}
              </div>
              {renderRequestList(
                requests.filter(r => r.status === 'pending'), 
                'New Submissions', 
                true,
                'There are no new submissions to review!'
              )}
            </motion.div>
          ) : activeView === 'all' ? (
            <motion.div key="all" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {renderRequestList(requests, 'All Applications', false)}
            </motion.div>
          ) : activeView === 'approved' ? (
            <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {renderRequestList(requests.filter(r => r.status === 'approved'), 'Approved Repository', false)}
            </motion.div>
          ) : (
            <motion.div key="rej" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {renderRequestList(requests.filter(r => r.status === 'rejected'), 'Rejected Repository', false)}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ───── MODALS (Doc & Details) ───── */}
      <AnimatePresence>
        {selectedRequest && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }}>
            {showDocView ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ width: '100%', maxWidth: '900px', maxHeight: '95vh', background: '#334155', borderRadius: '28px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 40px 100px -20px rgba(0,0,0,0.5)' }}>
                <div className="no-print" style={{ padding: '16px 32px', background: '#1e293b', borderBottom: '1px solid #475569', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#94a3b8' }}><FileText size={20} /><span style={{ fontSize: '14px', fontWeight: 600 }}>Official Document View</span></div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={handlePrint} style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}><Download size={16} /> Export PDF</button>
                    <button onClick={() => { setSelectedRequest(null); setShowDocView(false); }} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '10px', borderRadius: '10px', cursor: 'pointer' }}><X size={20} /></button>
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
                                <p style={{ fontSize: '12px', color: '#1e293b', marginBottom: '2px' }}><strong>Approved By (HOD Name):</strong> {selectedRequest.processedBy || user.fullName}</p>
                                <p style={{ fontSize: '12px', color: '#1e293b', marginBottom: '2px' }}><strong>Date & Time:</strong> {selectedRequest.updatedAt ? formatDateTime(selectedRequest.updatedAt) : formatDateTime(new Date())}</p>
                              </>
                            )}
                            <p style={{ fontSize: '11px', color: '#6366f1', fontWeight: 800, marginTop: '4px' }}>Authorized University Document</p>
                          </div>
                        </div>
                        <div style={{ textAlign: 'center', opacity: selectedRequest.status !== 'pending' ? 1 : 0 }}>
                           <div style={{ 
                             border: `3px double ${selectedRequest.status === 'approved' ? '#16a34a' : '#ef4444'}`,
                             color: selectedRequest.status === 'approved' ? '#16a34a' : '#ef4444',
                             padding: '4px 16px', borderRadius: '4px', transform: 'rotate(-5deg)',
                             fontWeight: 900, fontSize: '16px', textTransform: 'uppercase'
                           }}>
                             {selectedRequest.status}
                           </div>
                           <p style={{ fontSize: '8px', marginTop: '4px', color: '#94a3b8', fontWeight: 700 }}>VERIFIED DIGITAL STAMP</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key={selectedRequest.id} initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', background: '#fff', borderRadius: '28px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '24px 32px', background: 'linear-gradient(135deg, #1e293b, #334155)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif' }}>Application Review</h2><p style={{ fontSize: '14px', opacity: 0.9, marginTop: '4px' }}>Reviewing details for {selectedRequest.fullName}</p></div>
                  <button onClick={() => setSelectedRequest(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '8px', borderRadius: '12px', cursor: 'pointer' }}><X size={20} /></button>
                </div>
                <div style={{ padding: '32px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* 1. Reason & Duration */}
                    <div>
                      <h4 style={sectionTitleStyle}>Reason & Duration</h4>
                      <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                          <p style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Purpose of Attendance</p>
                          <p style={{ fontSize: '14px', color: '#1e293b', lineHeight: 1.6, margin: 0 }}>{selectedRequest.reason}</p>
                        </div>
                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                          <DetailRow label="Attendance Duration" value={`${formatDate(selectedRequest.eventDate)} ${selectedRequest.endDate ? `to ${formatDate(selectedRequest.endDate)}` : ''}`} />
                        </div>
                      </div>
                    </div>

                    {/* 2. Event Details */}
                    <div>
                      <h4 style={sectionTitleStyle}>Event Details</h4>
                      <div style={{ gridTemplateColumns: '1fr 1fr', display: 'grid', gap: '20px', background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                        <DetailRow label="Event Name" value={selectedRequest.eventName} />
                        <DetailRow label="Event Date" value={formatDate(selectedRequest.eventDate)} />
                        <DetailRow label="Application Status" value={selectedRequest.status.toUpperCase()} />
                        <DetailRow label="Submission Date" value={selectedRequest.createdAt ? formatDate(selectedRequest.createdAt) : formatDate(new Date())} />
                      </div>
                    </div>

                    {/* NEW: Missed Lectures Section */}
                    <div>
                      <h4 style={sectionTitleStyle}>Missed Lectures ({selectedRequest.missedLectures?.length || 0})</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {selectedRequest.missedLectures?.map((l, idx) => (
                          <div key={idx} style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>{l.subjectName}</span>
                              <span style={{ fontSize: '11px', color: '#64748b' }}>Code: {l.subjectCode}</span>
                            </div>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#6366f1' }}>{formatDate(l.lectureDate)}</span>
                          </div>
                        ))}
                      </div>
                    </div>


                    {/* NEW: Proof of Participation Section */}
                    <div>
                      <h4 style={sectionTitleStyle}>Proof of Participation</h4>
                      <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', background: '#eef2ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                              <FileText size={20} />
                            </div>
                            <div>
                              <p style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', margin: 0 }}>Participation Proof</p>
                              <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
                                {selectedRequest.fileSize ? `Size: ${(selectedRequest.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Size unknown'}
                              </p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '10px' }}>
                             <a 
                               href={`${API_URL.replace('/api', '')}/${selectedRequest.proofPath}`} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#1e293b', padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
                             >
                               <Eye size={16} /> View
                             </a>
                             <a 
                               href={`${API_URL.replace('/api', '')}/${selectedRequest.proofPath}`} 
                               download 
                               style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
                             >
                               <Download size={16} /> Download
                             </a>
                          </div>
                        </div>
                        
                        {/* Image Preview if it's an image */}
                        {selectedRequest.proofPath && (selectedRequest.proofPath.toLowerCase().endsWith('.jpg') || selectedRequest.proofPath.toLowerCase().endsWith('.jpeg') || selectedRequest.proofPath.toLowerCase().endsWith('.png')) && (
                          <div style={{ marginTop: '16px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                            <img 
                              src={`${API_URL.replace('/api', '')}/${selectedRequest.proofPath}`} 
                              alt="Proof Preview" 
                              style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', background: '#fff' }} 
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 3. Student Details */}
                    <div>
                      <h4 style={sectionTitleStyle}>Student Details</h4>
                      <div style={{ gridTemplateColumns: '1fr 1fr', display: 'grid', gap: '20px', background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                        <DetailRow label="Full Name" value={selectedRequest.fullName} />
                        <DetailRow label="QID / Unique ID" value={selectedRequest.qid} />
                        <DetailRow label="Course / Department" value={selectedRequest.courseSecDept} />
                        <DetailRow label="Year / Semester" value={selectedRequest.yearSemester} />
                      </div>
                    </div>

                    {/* 4. Participant List */}
                    {selectedRequest.participants?.length > 0 && (
                      <div>
                        <h4 style={sectionTitleStyle}>Additional Participants ({selectedRequest.participants.length})</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                          {selectedRequest.participants.map(p => (
                            <div key={p.id} style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{p.name}</span>
                                <span style={{ fontSize: '11px', color: '#64748b' }}>{p.courseSecDeptOpt || 'Department Member'}</span>
                              </div>
                              <span style={{ fontSize: '13px', fontWeight: 700, color: '#6366f1', background: 'rgba(99, 102, 241, 0.1)', padding: '4px 10px', borderRadius: '6px' }}>{p.qid}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedRequest.status === 'rejected' && selectedRequest.rejectionReason && (
                    <div style={{ padding: '20px', background: '#fff1f2', borderRadius: '16px', border: '1px solid #fecdd3' }}>
                      <p style={{ fontSize: '11px', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><AlertTriangle size={14} /> HOD Rejection Reason</p>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: '#9f1239', lineHeight: 1.5 }}>{selectedRequest.rejectionReason}</p>
                    </div>
                  )}

                </div>
                <div style={{ padding: '24px 32px', borderTop: '1px solid #f1f5f9', background: '#fcfcfd', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  {selectedRequest.status === 'approved' && <button onClick={() => setShowDocView(true)} style={{ padding: '12px 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={18} /> Official Letter</button>}
                  <button onClick={() => setSelectedRequest(null)} style={{ padding: '12px 24px', background: '#fff', color: '#64748b', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 700, cursor: 'pointer' }}>Close</button>
                  {selectedRequest.status === 'pending' && (
                    <>
                      <button onClick={() => { handleUpdateStatus(selectedRequest.id, 'rejected'); setShowToast({ show: true, message: 'Request has been rejected.', type: 'error' }); }} style={{ padding: '12px 24px', background: '#fff', color: '#ef4444', border: '1.5px solid #ef4444', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>Reject</button>
                      <button onClick={() => { handleUpdateStatus(selectedRequest.id, 'approved'); setShowToast({ show: true, message: 'Success: You have approved this attendance request!', type: 'success' }); }} style={{ padding: '12px 24px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>Approve</button>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>

      {/* ───── REJECTION REASON MODAL ───── */}
      <AnimatePresence>
        {showRejectionModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ width: '100%', maxWidth: '450px', background: '#fff', borderRadius: '28px', padding: '32px', boxShadow: '0 40px 100px -20px rgba(0,0,0,0.3)' }}>
              <div style={{ width: '56px', height: '56px', background: '#fff1f2', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', marginBottom: '24px' }}><AlertTriangle size={28} /></div>
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#1e293b', marginBottom: '8px', fontFamily: 'Outfit, sans-serif' }}>Reason for Rejection</h3>
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px', lineHeight: 1.5 }}>Please provide a specific reason for rejecting this attendance request. The student will see this message.</p>
              <textarea 
                autoFocus
                rows="4"
                placeholder="Ex: Event dates overlap with Midterm Exams..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1.5px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', fontWeight: 500, outline: 'none', resize: 'none', marginBottom: '24px', fontFamily: 'inherit' }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                <button 
                  onClick={() => { setShowRejectionModal(false); setRejectionReason(''); }}
                  style={{ padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  disabled={!rejectionReason.trim() || isSubmittingStatus}
                  onClick={() => handleUpdateStatus(requestToBeRejected, 'rejected', rejectionReason)}
                  style={{ 
                    padding: '14px', borderRadius: '14px', border: 'none', background: '#ef4444', color: '#fff', 
                    fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    opacity: (!rejectionReason.trim() || isSubmittingStatus) ? 0.6 : 1
                  }}
                >
                  {isSubmittingStatus ? 'Processing...' : <><Send size={18} /> Confirm Rejection</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ───── CUSTOM TOAST ───── */}
      <AnimatePresence>
        {showToast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2 } }}
            style={{
              position: 'fixed', bottom: '40px', right: '40px', zIndex: 3000,
              padding: '16px 24px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '14px',
              background: showToast.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              backdropFilter: 'blur(12px)', border: `1px solid ${showToast.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)', minWidth: '320px'
            }}
          >
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: showToast.type === 'success' ? '#10b981' : '#ef4444', color: '#fff'
            }}>
              {showToast.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '2px' }}>
                {showToast.type === 'success' ? 'Action Completed' : 'Notification'}
              </p>
              <p style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>{showToast.message}</p>
            </div>
            <button 
              onClick={() => setShowToast({ ...showToast, show: false })}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
            >
              <X size={16} />
            </button>
            <motion.div 
              style={{ position: 'absolute', bottom: 0, left: 0, height: '4px', background: showToast.type === 'success' ? '#10b981' : '#ef4444', borderRadius: '0 0 0 20px' }}
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 4, ease: 'linear' }}
            />
          </motion.div>
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
        
        .tooltip-target {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .tooltip-box {
          position: absolute;
          bottom: 110%;
          left: 50%;
          transform: translateX(-50%) translateY(5px);
          background: #1e293b;
          color: #fff;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
          opacity: 0;
          visibility: hidden;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          z-index: 100;
        }
        .tooltip-target:hover .tooltip-box {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(0);
        }
        .tooltip-box::after {
          content: "";
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 6px solid transparent;
          border-top-color: #1e293b;
        }
      ` }} />
    </div>
  );
};

const DetailRow = ({ label, value }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
    <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{value || '-'}</span>
  </div>
);

const sectionTitleStyle = { fontSize: '13px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' };

export default HodDashboard;
