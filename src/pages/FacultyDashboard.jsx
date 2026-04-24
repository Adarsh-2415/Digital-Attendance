import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, BookOpen, Calendar, 
  LogOut, User, GraduationCap, Download, Search, 
  Filter, CheckCircle, Clock, FileText, AlertCircle, X, Lock, ExternalLink, Menu, ChevronLeft
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

const FacultyDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDocView, setShowDocView] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [teamModalData, setTeamModalData] = useState(null);
  const [activeMenu, setActiveMenu] = useState('new');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/faculty/attendance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAttendance(data);
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = async (requestId) => {
    try {
      const res = await fetch(`${API_URL}/faculty/requests/${requestId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedRequest(data);
        setShowDocView(true);
      }
    } catch (err) {
      console.error('Error fetching request details:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };


  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleMarkERP = async (lectureId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      const res = await fetch(`${API_URL}/faculty/attendance/mark-erp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ lectureId, erpMarked: newStatus })
      });
      if (res.ok) {
        setAttendance(attendance.map(item => item.lectureId === lectureId ? { ...item, erpMarked: newStatus } : item));
      }
    } catch (err) {
      console.error('Error marking ERP:', err);
    }
  };

  const exportToCSV = () => {
    if (attendance.length === 0) return;
    
    const headers = ['Student Name', 'QID', 'Subject', 'Subject Code', 'Lecture Date', 'Event Name', 'Status'];
    const csvData = attendance.map(row => [
      row.studentName,
      row.studentQid,
      row.subjectName,
      row.subjectCode,
      row.lectureDate,
      row.eventName,
      row.status
    ]);
    
    const csvContent = [headers, ...csvData].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Attendance_Export_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredData = attendance.filter(item => {
    const matchesSearch = item.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.studentQid.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = dateFilter ? item.lectureDate === dateFilter : true;
    const matchesSubject = subjectFilter ? item.subjectName === subjectFilter : true;
    
    // Filter based on ERP status and active menu
    const matchesMenu = activeMenu === 'marked' ? !!item.erpMarked : !item.erpMarked;
    
    return matchesSearch && matchesDate && matchesSubject && matchesMenu;
  });

  const uniqueSubjects = [...new Set(attendance.map(item => item.subjectName))];

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
        <motion.aside 
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
          <button onClick={() => setIsSidebarOpen(false)} style={{ position: 'absolute', right: '-16px', top: '40px', background: '#059669', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><ChevronLeft size={20} /></button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '48px', padding: '0 12px' }}>
            <div style={{ background: '#059669', padding: '10px', borderRadius: '14px' }}><GraduationCap size={22} color="#fff" /></div>
            <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>FACULTY HUB</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', padding: '0 12px 8px' }}>Menu</p>
            
            <button 
              onClick={() => { setActiveMenu('new'); setIsSidebarOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px',
                borderRadius: '14px', border: 'none', background: activeMenu === 'new' ? 'rgba(5, 150, 105, 0.2)' : 'transparent',
                color: activeMenu === 'new' ? '#10b981' : '#94a3b8', cursor: 'pointer',
                textAlign: 'left', fontWeight: activeMenu === 'new' ? 700 : 500, transition: 'all 0.2s', position: 'relative'
              }}
            >
              <LayoutDashboard size={20} />
              <span style={{ fontSize: '14px' }}>New Approvals</span>
              {attendance.filter(a => !a.erpMarked).length > 0 && (
                <span style={{ position: 'absolute', right: '18px', background: '#059669', color: '#fff', fontSize: '10px', fontWeight: 900, padding: '2px 8px', borderRadius: '20px' }}>
                  {attendance.filter(a => !a.erpMarked).length}
                </span>
              )}
            </button>

            <button 
              onClick={() => { setActiveMenu('marked'); setIsSidebarOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px',
                borderRadius: '14px', border: 'none', background: activeMenu === 'marked' ? 'rgba(5, 150, 105, 0.2)' : 'transparent',
                color: activeMenu === 'marked' ? '#10b981' : '#94a3b8', cursor: 'pointer',
                textAlign: 'left', fontWeight: activeMenu === 'marked' ? 700 : 500, transition: 'all 0.2s'
              }}
            >
              <CheckCircle size={20} />
              <span style={{ fontSize: '14px' }}>Marked Attendance</span>
            </button>

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
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(5, 150, 105, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', fontWeight: 800 }}>{user.fullName?.charAt(0)}</div>
              <div><p style={{ fontSize: '14px', fontWeight: 700 }}>{user.fullName?.split(' ')[0]}</p><p style={{ fontSize: '11px', color: '#64748b' }}>Faculty</p></div>
            </div>
            <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', color: '#ef4444', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}><LogOut size={18} /> Sign Out</button>
          </div>
        </motion.aside>
      </AnimatePresence>

      {/* Main Content Wrapper */}
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Navbar */}
        <nav style={{
          background: 'linear-gradient(135deg, #059669, #047857)',
          padding: '16px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 20px rgba(5,150,105,0.3)',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button onClick={() => setIsSidebarOpen(true)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '10px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Menu size={24} /></button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <GraduationCap size={24} color="#fff" />
              <span style={{ color: '#fff', fontSize: '20px', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>
                Faculty Hub
              </span>
            </div>
          </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.1)', padding: '6px 14px', borderRadius: '12px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={14} color="#059669" />
            </div>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: '13px' }}>{user.fullName}</span>
          </div>
          <button onClick={handleLogout} style={{
            background: '#fff',
            border: 'none',
            color: '#ef4444',
            padding: '8px 16px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 700,
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
          }}>
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div style={{ padding: '40px', maxWidth: '1300px', margin: '0 auto' }}>
        {/* Welcome Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#1e293b', marginBottom: '8px', fontFamily: 'Outfit, sans-serif' }}>
              {activeMenu === 'marked' ? 'Marked Attendance ✅' : 'New Approvals 📋'}
            </h1>
            <p style={{ fontSize: '16px', color: '#64748b', fontWeight: 500 }}>
              {activeMenu === 'marked' 
                ? 'Reviewing records that have been marked in the ERP.' 
                : 'Viewing approved student participation for your specific lectures.'}
            </p>
          </div>
          <button 
            onClick={() => window.open('https://qums.quantumuniversity.edu.in/', '_blank')}
            style={{ 
              background: '#fff', border: '1px solid #e2e8f0', color: '#1e293b', 
              padding: '12px 24px', borderRadius: '14px', fontSize: '14px', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
            }}
          >
            <ExternalLink size={18} /> College ERP Login
          </button>
        </div>

        {/* Filters Bar */}
        <div style={{ 
          background: '#fff', padding: '20px', borderRadius: '20px', marginBottom: '32px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9',
          display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center'
        }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
            <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
            <input 
              type="text" 
              placeholder="Search by Name or QID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '12px 12px 12px 48px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Filter size={18} color="#64748b" />
            <select 
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '14px', minWidth: '180px' }}
            >
              <option value="">All Subjects</option>
              {uniqueSubjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
            </select>
            <input 
              type="date" 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{ padding: '11px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '14px' }}
            />
          </div>
        </div>

        {/* Data Table */}
        <div style={{ background: '#fff', borderRadius: '24px', overflow: 'hidden', border: '1px solid #f1f5f9', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
          {loading ? (
            <div style={{ padding: '100px', textAlign: 'center', color: '#94a3b8' }}>
              <Clock size={40} style={{ marginBottom: '16px', opacity: 0.3 }} />
              <p>Loading attendance data...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div style={{ padding: '100px', textAlign: 'center', color: '#94a3b8' }}>
              <AlertCircle size={40} style={{ marginBottom: '16px', opacity: 0.3 }} />
              <p>No attendance records found for the current selection.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                  <th style={{ padding: '20px 24px', fontSize: '13px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Student Detail</th>
                  <th style={{ padding: '20px 24px', fontSize: '13px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Subject</th>
                  <th style={{ padding: '20px 24px', fontSize: '13px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Date Missed</th>
                  <th style={{ padding: '20px 24px', fontSize: '13px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Event Title</th>
                  <th style={{ padding: '20px 24px', fontSize: '13px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Participating Team</th>
                  <th style={{ padding: '20px 24px', fontSize: '13px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Doc</th>
                  <th style={{ padding: '20px 24px', fontSize: '13px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>ERP Status</th>
                  <th style={{ padding: '20px 24px', fontSize: '13px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Action Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, idx) => (
                  <motion.tr 
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    style={{ borderBottom: '1px solid #f1f5f9' }}
                  >
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                          {item.studentName.charAt(0)}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: '15px' }}>{item.studentName}</p>
                          <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>QID: {item.studentQid}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <p style={{ margin: 0, fontWeight: 600, color: '#334155', fontSize: '14px' }}>{item.subjectName}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>{item.subjectCode}</p>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '14px', fontWeight: 500 }}>
                        <Calendar size={14} color="#94a3b8" />
                        {formatDate(item.lectureDate)}
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6366f1', background: '#eef2ff', padding: '4px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, width: 'fit-content' }}>
                        <BookOpen size={14} />
                        {item.eventName}
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      {item.participants && item.participants.length > 0 ? (
                        <button 
                          onClick={() => setTeamModalData(item)}
                          style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600 }}
                        >
                          <Users size={14} /> View ({item.participants.length + 1})
                        </button>
                      ) : (
                        <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>N/A</span>
                      )}
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <button 
                        onClick={() => handleViewDocument(item.requestId)}
                        style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#6366f1', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600 }}
                      >
                        <FileText size={14} /> View
                      </button>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input 
                          type="checkbox" 
                          checked={!!item.erpMarked} 
                          onChange={() => handleMarkERP(item.lectureId, item.erpMarked)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#10b981' }}
                        />
                        <span style={{ fontSize: '12px', fontWeight: 700, color: item.erpMarked ? '#10b981' : '#94a3b8' }}>
                          {item.erpMarked ? 'Marked' : 'Pending'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '13px', fontWeight: 700 }}>
                          <CheckCircle size={14} /> Approved
                        </div>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, paddingLeft: '18px' }}>(By HOD)</span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ───── DOCUMENT VIEW MODAL ───── */}
      <AnimatePresence>
        {selectedRequest && showDocView && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ width: '100%', maxWidth: '900px', maxHeight: '95vh', background: '#334155', borderRadius: '28px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 40px 100px -20px rgba(0,0,0,0.5)' }}>
              <div className="no-print" style={{ padding: '16px 32px', background: '#1e293b', borderBottom: '1px solid #475569', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#94a3b8' }}><FileText size={20} /><span style={{ fontSize: '14px', fontWeight: 600 }}>Official Approved Document</span></div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={handlePrint} style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}><Download size={16} /> Export / Print</button>
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
                          <p style={{ fontSize: '12px', color: '#1e293b', marginBottom: '2px' }}><strong>Approved By (HOD Name):</strong> {selectedRequest.processedBy || "Head of Department"}</p>
                          <p style={{ fontSize: '12px', color: '#1e293b', marginBottom: '2px' }}><strong>Date & Time:</strong> {selectedRequest.updatedAt ? formatDateTime(selectedRequest.updatedAt) : 'Digitally Signed'}</p>
                          <p style={{ fontSize: '11px', color: '#6366f1', fontWeight: 800, marginTop: '4px' }}>Authorized University Document</p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                         <div style={{ 
                           border: '3px double #16a34a',
                           color: '#16a34a',
                           padding: '4px 16px', borderRadius: '4px', transform: 'rotate(-5deg)',
                           fontWeight: 900, fontSize: '16px', textTransform: 'uppercase'
                         }}>
                           APPROVED
                         </div>
                         <p style={{ fontSize: '8px', marginTop: '4px', color: '#94a3b8', fontWeight: 700 }}>VERIFIED DIGITAL STAMP</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ───── TEAM VIEW MODAL ───── */}
      <AnimatePresence>
        {teamModalData && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ width: '100%', maxWidth: '400px', background: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
              <div style={{ padding: '20px 24px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={18} color="#6366f1" /> Participating Team</h3>
                <button onClick={() => setTeamModalData(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
              </div>
              <div style={{ padding: '24px', maxHeight: '400px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Primary Applicant */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>{teamModalData.studentName.charAt(0)}</div>
                    <div>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                        {teamModalData.studentName} 
                        <span style={{ fontSize: '10px', background: '#16a34a', color: '#fff', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px', textTransform: 'uppercase', fontWeight: 800 }}>Applicant</span>
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>QID: {teamModalData.studentQid}</p>
                    </div>
                  </div>

                  {/* Additional Participants */}
                  {teamModalData.participants?.map((p, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eef2ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>{p.name.charAt(0)}</div>
                      <div>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>{p.name}</p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>QID: {p.qid}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
      <ChangePasswordModal 
        isOpen={showChangePassword} 
        onClose={() => setShowChangePassword(false)} 
      />
    </div>
  );
};

export default FacultyDashboard;
