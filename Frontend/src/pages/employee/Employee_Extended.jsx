import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';

const Portal = ({ children }) => ReactDOM.createPortal(children, document.body);

import Layout from '../../components/Layout';
import { Card, SectionHeader, Badge, Button, StatCard } from '../../components/UI';
import Loader from '../../components/Loader';
import { getAuthHeaders } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// ─── Shared helpers ────────────────────────────────────────────────────────────
const apiFetch = async (path, method = 'GET', body = null) => {
  const opts = { method, headers: getAuthHeaders() };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

const inp = {
  padding: '9px 12px', background: 'var(--bg-elevated)',
  border: '1px solid var(--border)', borderRadius: 8,
  color: 'var(--text-primary)', fontSize: 13,
  outline: 'none', width: '100%', fontFamily: 'inherit',
};

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
      padding: '12px 20px', borderRadius: 12, fontWeight: 600, fontSize: 13,
      background: type === 'error' ? '#FF6584' : '#43E8AC', color: '#fff',
      boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    }}>
      {type === 'error' ? '⚠️' : '✅'} {msg}
    </div>
  );
}

// ─── VIEW ANNOUNCEMENTS ───────────────────────────────────────────────────────
export function ViewAnnouncements() {
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [toast, setToast]   = useState(null);

  const load = useCallback(() => {
    apiFetch('/api/announcements/my')
      .then(d => setItems(d.announcements || []))
      .catch(e => setToast({ msg: e.message, type: 'error' }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id) => {
    try {
      await apiFetch(`/api/announcements/${id}/read`, 'PUT');
      setItems(prev => prev.map(a => a._id === id ? { ...a, isRead: true } : a));
    } catch {}
  };

  const CAT_COLORS = { GENERAL: '#6C63FF', HR: '#FF6584', POLICY: '#FFB547', EVENT: '#43E8AC', URGENT: '#FF6584', TRAINING: '#8B85FF' };
  const categories = ['all', ...new Set(items.map(a => a.category).filter(Boolean))];
  const filtered   = filter === 'all' ? items : items.filter(a => a.category === filter);
  const unreadCount = items.filter(a => !a.isRead).length;

  return (
    <Layout>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <div style={{ maxWidth: 820 }}>
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 24, color: 'var(--role-color, #10b981)' }}>Announcements</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Company-wide news and updates</p>
          </div>
          {unreadCount > 0 && (
            <div style={{ padding: '6px 14px', borderRadius: 20, background: 'rgba(255,101,132,0.12)', color: '#FF6584', fontSize: 12, fontWeight: 700 }}>
              {unreadCount} unread
            </div>
          )}
        </div>

        {/* Category filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {categories.map(f => {
            const c = CAT_COLORS[f] || '#6C63FF';
            return (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: filter === f ? c : 'var(--bg-elevated)',
                color:      filter === f ? '#fff' : 'var(--text-secondary)',
                border:     `1px solid ${filter === f ? c : 'var(--border)'}`,
                textTransform: 'capitalize', transition: 'all 0.15s',
              }}>{f}</button>
            );
          })}
        </div>

        {loading ? <Loader /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.length === 0 ? (
              <Card><div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)', fontSize: 13 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📢</div>No announcements yet.
              </div></Card>
            ) : filtered.map(a => {
              const c = CAT_COLORS[a.category] || '#6C63FF';
              return (
                <Card key={a._id} style={{ borderLeft: `4px solid ${c}`, opacity: a.isRead ? 0.82 : 1, position: 'relative' }}>
                  {!a.isRead && (
                    <div style={{ position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: '50%', background: '#FF6584' }} />
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${c}15`, color: c }}>{a.category}</span>
                      <span style={{
                        padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                        background: a.priority === 'HIGH' ? 'rgba(255,101,132,0.12)' : a.priority === 'LOW' ? 'rgba(67,232,172,0.12)' : 'rgba(255,181,71,0.12)',
                        color:      a.priority === 'HIGH' ? '#FF6584'               : a.priority === 'LOW' ? '#43E8AC'               : '#FFB547',
                      }}>{a.priority}</span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(a.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', marginBottom: 6 }}>{a.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{a.content}</div>
                  <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>— {a.postedBy?.name}</div>
                    {!a.isRead && (
                      <button
                        onClick={() => markRead(a._id)}
                        style={{
                          padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                          background: 'rgba(67,232,172,0.1)', color: '#43E8AC',
                          border: '1px solid rgba(67,232,172,0.28)', transition: 'all 0.15s',
                        }}
                      >Mark as read ✓</button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

// ─── DAILY WORK REPORT ────────────────────────────────────────────────────────
export function DailyWorkReport() {
  const [reports, setReports]       = useState([]);
  const [todayReport, setTodayReport] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updating, setUpdating]     = useState(false);
  const [form, setForm]             = useState({ tasksCompleted: '', tasksInProgress: '', blockers: '', hoursWorked: 8, mood: 'GOOD', notes: '' });
  const [updateForm, setUpdateForm] = useState({ tasksCompleted: '', tasksInProgress: '', blockers: '', hoursWorked: 8, mood: 'GOOD', notes: '' });
  const [showUpdatePanel, setShowUpdatePanel] = useState(false);
  const [toast, setToast]           = useState(null);
  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const MOODS = [
    { key: 'GREAT',      label: 'Great',      color: '#43E8AC', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg> },
    { key: 'GOOD',       label: 'Good',       color: '#6C63FF', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 1.5 4 1.5 4-1.5 4-1.5"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg> },
    { key: 'NEUTRAL',    label: 'Neutral',    color: '#FFB547', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="8" y1="15" x2="16" y2="15"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg> },
    { key: 'STRESSED',   label: 'Stressed',   color: '#FF6584', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg> },
    { key: 'STRUGGLING', label: 'Struggling', color: '#FF6584', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg> },
  ];

  const EMPTY_FORM = { tasksCompleted: '', tasksInProgress: '', blockers: '', hoursWorked: 8, mood: 'GOOD', notes: '' };

  const load = useCallback(() => {
    Promise.all([
      apiFetch('/api/daily-reports/today'),
      apiFetch('/api/daily-reports/my'),
    ]).then(([t, r]) => {
      const today = t?.report || null;
      setTodayReport(today);
      setReports(r?.reports || []);
      if (today) {
        setUpdateForm({
          tasksCompleted:  today.tasksCompleted   || '',
          tasksInProgress: today.tasksInProgress  || '',
          blockers:        today.blockers         || '',
          hoursWorked:     today.hoursWorked      || 8,
          mood:            today.mood             || 'GOOD',
          notes:           today.notes            || '',
        });
        setShowUpdatePanel(true);
      } else {
        setShowUpdatePanel(false);
      }
    }).catch(e => showToast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.tasksCompleted.trim()) { showToast('Please describe tasks completed', 'error'); return; }
    setSubmitting(true);
    try {
      await apiFetch('/api/daily-reports', 'POST', form);
      showToast('Report submitted!');
      setForm(EMPTY_FORM);
      load(); // load() will set showUpdatePanel=true, hiding submit card
    } catch (e) { showToast(e.message, 'error'); }
    setSubmitting(false);
  };

  const update = async () => {
    if (!updateForm.tasksCompleted.trim()) { showToast('Please describe tasks completed', 'error'); return; }
    setUpdating(true);
    try {
      await apiFetch('/api/daily-reports', 'POST', updateForm);
      showToast('Report updated!');
      load();
    } catch (e) { showToast(e.message, 'error'); }
    setUpdating(false);
  };

  const today = new Date().toISOString().slice(0, 10);

  // Compact inline label style
  const lbl = { fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 };
  const ta  = { ...inp, resize: 'none', fontSize: 12, padding: '6px 8px' };

  const MoodRow = ({ data, onChange }) => (
    <div style={{ display: 'flex', gap: 4 }}>
      {MOODS.map(m => (
        <button key={m.key} onClick={() => onChange(f => ({ ...f, mood: m.key }))} style={{
          flex: 1, padding: '5px 2px', borderRadius: 6, cursor: 'pointer', fontSize: 10, fontWeight: 600,
          background: data.mood === m.key ? `${m.color}18` : 'var(--bg-elevated)',
          color: data.mood === m.key ? m.color : 'var(--text-muted)',
          border: `1px solid ${data.mood === m.key ? m.color : 'var(--border)'}`,
          transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
        }}>
          <span style={{ color: data.mood === m.key ? m.color : 'var(--text-muted)' }}>{m.icon}</span>
          <span style={{ display: window.innerWidth < 1200 ? 'none' : 'inline' }}>{m.label}</span>
        </button>
      ))}
    </div>
  );

  return (
    <Layout>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <div style={{ maxWidth: 1200 }}>

        {/* Page header */}
        <div style={{ marginBottom: 14, display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <h2 style={{ fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 22, color: 'var(--role-color, #10b981)', margin: 0 }}>Work Report</h2>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>— {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>

        {/* Main 3-column grid: Submit | Update | Past Reports */}
        <div style={{ display: 'grid', gridTemplateColumns: showUpdatePanel ? '1fr 1fr 0.85fr' : '1fr 0.85fr', gap: 14, alignItems: 'start' }}>

          {/* ── SUBMIT CARD — always visible, disabled once submitted ── */}
          <Card style={{ padding: 16, opacity: showUpdatePanel ? 0.55 : 1, transition: 'opacity 0.3s' }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Today's Report</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{today}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <label style={lbl}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#43E8AC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Tasks Completed <span style={{ color: '#FF6584' }}>*</span>
                </label>
                <textarea style={ta} rows={2} placeholder="What did you complete today?" value={form.tasksCompleted} onChange={e => setForm(f => ({ ...f, tasksCompleted: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={lbl}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6C63FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                    In Progress
                  </label>
                  <textarea style={ta} rows={2} placeholder="Still working on? (optional)" value={form.tasksInProgress} onChange={e => setForm(f => ({ ...f, tasksInProgress: e.target.value }))} />
                </div>
                <div>
                  <label style={lbl}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFB547" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    Blockers
                  </label>
                  <textarea style={ta} rows={2} placeholder="Any blockers? (optional)" value={form.blockers} onChange={e => setForm(f => ({ ...f, blockers: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={lbl}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6C63FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Hours Worked
                  </label>
                  <input type="number" min={0} max={24} step={0.5} style={{ ...ta, padding: '6px 8px' }} value={form.hoursWorked} onChange={e => setForm(f => ({ ...f, hoursWorked: Number(e.target.value) }))} />
                </div>
                <div>
                  <label style={lbl}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8B90A7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    Notes
                  </label>
                  <input type="text" style={{ ...ta, padding: '6px 8px' }} placeholder="Optional" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
              <div>
                <label style={{ ...lbl, marginBottom: 5 }}>How was your day?</label>
                <MoodRow data={form} onChange={setForm} />
              </div>
              <button onClick={submit} disabled={submitting || showUpdatePanel} style={{
                width: '100%', padding: '9px', borderRadius: 7, fontWeight: 700, fontSize: 13,
                background: (submitting || showUpdatePanel) ? 'var(--bg-elevated)' : 'linear-gradient(90deg, #6C63FF, #8B85FF)',
                color: (submitting || showUpdatePanel) ? 'var(--text-muted)' : '#fff',
                border: 'none', cursor: (submitting || showUpdatePanel) ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-body)', transition: 'opacity 0.2s', marginTop: 2,
              }}>
                {submitting ? 'Submitting…' : showUpdatePanel ? '✓ Already Submitted' : 'Submit Report →'}
              </button>
            </div>
          </Card>

          {/* ── UPDATE CARD — only when today report exists ── */}
          {showUpdatePanel && (
            <Card style={{ padding: 16 }}>
              <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Update Today's Report</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{today}</div>
                </div>
                <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: 'rgba(67,232,172,0.12)', color: '#43E8AC', fontWeight: 700 }}>✓ Submitted</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <label style={lbl}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#43E8AC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Tasks Completed <span style={{ color: '#FF6584' }}>*</span>
                  </label>
                  <textarea style={ta} rows={2} placeholder="What did you complete today?" value={updateForm.tasksCompleted} onChange={e => setUpdateForm(f => ({ ...f, tasksCompleted: e.target.value }))} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={lbl}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6C63FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                      In Progress
                    </label>
                    <textarea style={ta} rows={2} placeholder="Still working on? (optional)" value={updateForm.tasksInProgress} onChange={e => setUpdateForm(f => ({ ...f, tasksInProgress: e.target.value }))} />
                  </div>
                  <div>
                    <label style={lbl}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFB547" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      Blockers
                    </label>
                    <textarea style={ta} rows={2} placeholder="Any blockers? (optional)" value={updateForm.blockers} onChange={e => setUpdateForm(f => ({ ...f, blockers: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={lbl}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6C63FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      Hours Worked
                    </label>
                    <input type="number" min={0} max={24} step={0.5} style={{ ...ta, padding: '6px 8px' }} value={updateForm.hoursWorked} onChange={e => setUpdateForm(f => ({ ...f, hoursWorked: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label style={lbl}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8B90A7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      Notes
                    </label>
                    <input type="text" style={{ ...ta, padding: '6px 8px' }} placeholder="Optional" value={updateForm.notes} onChange={e => setUpdateForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label style={{ ...lbl, marginBottom: 5 }}>How was your day?</label>
                  <MoodRow data={updateForm} onChange={setUpdateForm} />
                </div>
                <button onClick={update} disabled={updating} style={{
                  width: '100%', padding: '9px', borderRadius: 7, fontWeight: 700, fontSize: 13,
                  background: updating ? 'var(--bg-elevated)' : 'linear-gradient(90deg, #43E8AC, #2dca8d)',
                  color: updating ? 'var(--text-muted)' : '#fff',
                  border: 'none', cursor: updating ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-body)', transition: 'opacity 0.2s', marginTop: 2,
                }}>
                  {updating ? 'Updating…' : 'Update Report →'}
                </button>
              </div>
            </Card>
          )}

          {/* ── PAST REPORTS ── */}
          <Card style={{ padding: 16 }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Past Reports</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Recent submissions</div>
            </div>
            {loading ? <Loader /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {reports.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 12 }}>No reports yet.</div>
                ) : reports.slice(0, 6).map(r => {
                  const mood = MOODS.find(m => m.key === r.mood) || MOODS[1];
                  return (
                    <div key={r._id} style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-primary)' }}>
                            {new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}
                          </span>
                          <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 20, background: `${mood.color}15`, color: mood.color, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            {mood.icon}{mood.label}
                          </span>
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{r.hoursWorked}h</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.tasksCompleted}</div>
                      {r.tasksInProgress && <div style={{ fontSize: 10, color: '#6C63FF', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>↻ {r.tasksInProgress}</div>}
                      {r.blockers && <div style={{ fontSize: 10, color: '#FFB547', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>⚠ {r.blockers}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

        </div>
      </div>
    </Layout>
  );
}

// ─── GRIEVANCES ───────────────────────────────────────────────────────────────
export function MyGrievances() {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm]             = useState({ subject: '', description: '', priority: 'MEDIUM' });
  const [toast, setToast]           = useState(null);
  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const load = useCallback(() => {
    apiFetch('/api/grievances/my')
      .then(d => setGrievances(Array.isArray(d) ? d : (d?.grievances || [])))
      .catch(e => showToast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.subject.trim() || !form.description.trim()) {
      showToast('Subject and description are required', 'error'); return;
    }
    setSubmitting(true);
    try {
      await apiFetch('/api/grievances', 'POST', form);
      showToast('Grievance submitted successfully');
      setForm({ subject: '', description: '', priority: 'MEDIUM' });
      load();
    } catch (e) { showToast(e.message, 'error'); }
    setSubmitting(false);
  };

  const STATUS_STYLE = {
    PENDING:      { bg: 'rgba(108,99,255,0.12)', color: '#8B85FF'  },
    UNDER_REVIEW: { bg: 'rgba(255,181,71,0.15)', color: '#FFB547'  },
    RESOLVED:     { bg: 'rgba(67,232,172,0.12)', color: '#43E8AC'  },
    CLOSED:       { bg: 'rgba(139,144,167,0.12)',color: '#8B90A7'  },
  };
  const PSTYLE = {
    HIGH:   { bg: 'rgba(255,101,132,0.12)', color: '#FF6584' },
    MEDIUM: { bg: 'rgba(255,181,71,0.12)',  color: '#FFB547' },
    LOW:    { bg: 'rgba(67,232,172,0.12)',  color: '#43E8AC' },
  };

  return (
    <Layout>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <div style={{ maxWidth: 960 }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 24, color: 'var(--role-color, #10b981)' }}>Grievances</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Submit and track your workplace grievances</p>
        </div>

        <div style={{ padding: '10px 16px', background: 'rgba(108,99,255,0.07)', border: '1px solid rgba(108,99,255,0.15)', borderRadius: 10, marginBottom: 24, fontSize: 13, color: 'var(--text-secondary)' }}>
          🔒 All grievances are handled confidentially by the HR team.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 20 }}>
          {/* Submit Form */}
          <Card>
            <SectionHeader title="Submit Grievance" subtitle="Describe your concern" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Subject <span style={{ color: '#FF6584' }}>*</span></label>
                <input type="text" style={inp} placeholder="Brief title for your grievance" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Description <span style={{ color: '#FF6584' }}>*</span></label>
                <textarea style={{ ...inp, resize: 'vertical' }} rows={5} placeholder="Describe the issue in detail. Be as specific as possible…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Priority</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['LOW', 'MEDIUM', 'HIGH'].map(p => (
                    <button key={p} onClick={() => setForm(f => ({ ...f, priority: p }))} style={{
                      flex: 1, padding: '8px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                      background: form.priority === p ? `${PSTYLE[p].color}18` : 'var(--bg-elevated)',
                      color:      form.priority === p ? PSTYLE[p].color : 'var(--text-muted)',
                      border:     `1px solid ${form.priority === p ? PSTYLE[p].color : 'var(--border)'}`,
                      transition: 'all 0.15s',
                    }}>{p}</button>
                  ))}
                </div>
              </div>
              <button
                onClick={submit}
                disabled={submitting}
                style={{
                  padding: '11px', borderRadius: 8, fontWeight: 700, fontSize: 14,
                  background: submitting ? 'var(--bg-elevated)' : 'linear-gradient(90deg, #6C63FF, #8B85FF)',
                  color: submitting ? 'var(--text-muted)' : '#fff',
                  border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-body)', transition: 'opacity 0.2s',
                }}
              >
                {submitting ? 'Submitting…' : 'Submit Grievance →'}
              </button>
            </div>
          </Card>

          {/* My Grievances */}
          <Card>
            <SectionHeader title="My Grievances" subtitle={`${grievances.length} submitted`} />
            {loading ? <Loader /> : grievances.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📨</div>No grievances submitted yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 460, overflowY: 'auto', paddingRight: 4 }}>
                {grievances.map(g => {
                  const ss = STATUS_STYLE[g.status] || STATUS_STYLE.PENDING;
                  const ps = PSTYLE[g.priority]     || PSTYLE.MEDIUM;
                  return (
                    <div key={g._id} style={{ padding: '14px', borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', flex: 1, marginRight: 10 }}>{g.subject}</span>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: ps.bg, color: ps.color }}>{g.priority}</span>
                          <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: ss.bg, color: ss.color }}>{g.status?.replace('_', ' ')}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 6 }}>{g.description}</div>
                      {g.resolution && (
                        <div style={{ fontSize: 12, padding: '6px 10px', background: 'rgba(67,232,172,0.08)', borderRadius: 6, borderLeft: '2px solid #43E8AC', color: '#2dca8d', marginBottom: 4 }}>
                          ✅ Resolution: {g.resolution}
                        </div>
                      )}
                      {g.notes && (
                        <div style={{ fontSize: 12, padding: '6px 10px', background: 'rgba(255,181,71,0.08)', borderRadius: 6, borderLeft: '2px solid #FFB547', color: '#cc9420' }}>
                          📝 HR Note: {g.notes}
                        </div>
                      )}
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
                        Submitted {new Date(g.createdAt).toLocaleDateString('en-IN')}
                        {g.resolvedAt && <> · Resolved {new Date(g.resolvedAt).toLocaleDateString('en-IN')}</>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
}

// ─── TRAINING RECORDS ─────────────────────────────────────────────────────────
export function MyTraining() {
  const [records, setRecords]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('ALL');
  const [error, setError]       = useState(null);
  const [updating, setUpdating] = useState(null); // record being updated
  const [upForm, setUpForm]     = useState({ employeeStatus: '', employeeNote: '' });
  const [upSaving, setUpSaving] = useState(false);
  const [upSuccess, setUpSuccess] = useState('');

  const load = () => {
    apiFetch('/api/training/my')
      .then(d => setRecords(d.records || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleOpenUpdate = (r) => {
    setUpForm({ employeeStatus: r.employeeStatus || 'NOT_STARTED', employeeNote: r.employeeNote || '' });
    setUpdating(r);
    setUpSuccess('');
  };

  const handleSaveUpdate = async () => {
    if (!upForm.employeeStatus) return;
    setUpSaving(true);
    try {
      await apiFetch(`/api/training/my/${updating._id}`, 'PUT', upForm);
      setUpSuccess('Progress updated! HR has been notified.');
      setUpdating(null);
      load();
    } catch(e) { setError(e.message); }
    finally { setUpSaving(false); }
  };

  const STATUS_STYLE = {
    UPCOMING:    { bg: 'rgba(108,99,255,0.12)', color: '#8B85FF', label: 'Upcoming'    },
    IN_PROGRESS: { bg: 'rgba(255,181,71,0.15)', color: '#FFB547', label: 'In Progress' },
    COMPLETED:   { bg: 'rgba(67,232,172,0.12)', color: '#43E8AC', label: 'Completed'   },
    CANCELLED:   { bg: 'rgba(139,144,167,0.12)',color: '#8B90A7', label: 'Cancelled'   },
  };

  const filters = ['ALL', 'UPCOMING', 'IN_PROGRESS', 'COMPLETED'];
  const filtered = filter === 'ALL' ? records : records.filter(r => r.status === filter);

  const total      = records.length;
  const completed  = records.filter(r => r.status === 'COMPLETED').length;
  const inProgress = records.filter(r => r.status === 'IN_PROGRESS').length;
  const avgScore   = records.filter(r => r.score).length
    ? Math.round(records.filter(r => r.score).reduce((s, r) => s + r.score, 0) / records.filter(r => r.score).length)
    : null;

  return (
    <Layout>
      <div style={{ maxWidth: 900 }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 24, color: 'var(--role-color, #10b981)' }}>Training Records</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Your assigned courses and learning progress</p>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(255,101,132,0.1)', border: '1px solid rgba(255,101,132,0.2)', borderRadius: 10, marginBottom: 20, fontSize: 13, color: '#FF6584' }}>⚠️ {error}</div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          <StatCard label="Total Courses"  value={total}       icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>} color="#6C63FF" delay={0.05} />
          <StatCard label="In Progress"    value={inProgress}  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>} color="#FFB547" delay={0.08} />
          <StatCard label="Completed"      value={completed}   icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>} color="#43E8AC" delay={0.11} />
          <StatCard label="Avg Score"      value={avgScore ? `${avgScore}%` : '—'} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>} color="#FF6584" delay={0.14} />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: filter === f ? '#6C63FF' : 'var(--bg-elevated)',
              color:      filter === f ? '#fff'    : 'var(--text-secondary)',
              border: `1px solid ${filter === f ? '#6C63FF' : 'var(--border)'}`,
              textTransform: 'capitalize', transition: 'all 0.15s',
            }}>{f === 'ALL' ? 'All' : f.replace('_', ' ')}</button>
          ))}
        </div>

        {loading ? <Loader /> : filtered.length === 0 ? (
          <Card>
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', fontSize: 13 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
              No training records found.
            </div>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(r => {
              const ss = STATUS_STYLE[r.status] || STATUS_STYLE.UPCOMING;
              const startDate = new Date(r.startDate);
              const endDate   = new Date(r.endDate);
              const totalDays = Math.ceil((endDate - startDate) / 86400000);
              const progressDays = r.status === 'COMPLETED' ? totalDays : Math.max(0, Math.ceil((new Date() - startDate) / 86400000));
              const pct = r.status === 'COMPLETED' ? 100 : Math.min(100, Math.round((progressDays / totalDays) * 100));

              const empStatusStyle = {
                NOT_STARTED: { color:'#8B90A7', label:'Not Started' },
                IN_PROGRESS:  { color:'#FFB547', label:'In Progress' },
                COMPLETED:    { color:'#43E8AC', label:'Completed'   },
                NEEDS_HELP:   { color:'#FF6584', label:'Needs Help'  },
              };
              const empSt = empStatusStyle[r.employeeStatus] || empStatusStyle.NOT_STARTED;
              return (
                <Card key={r._id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{r.course}</div>
                        <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: ss.bg, color: ss.color }}>{ss.label}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> {r.provider}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> {r.category}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> {startDate.toLocaleDateString('en-IN')} – {endDate.toLocaleDateString('en-IN')}</span>
                        {r.score && <span style={{ color: '#FFB547', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFB547" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Score: {r.score}%</span>}
                      </div>
                      {/* Progress Bar */}
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                          <span>Progress</span>
                          <span>{pct}%</span>
                        </div>
                        <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: ss.color, borderRadius: 3, transition: 'width 0.5s ease' }} />
                        </div>
                      </div>

                      {/* My progress update */}
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: r.employeeNote || r.hrFeedback ? 10 : 0, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>My Status:</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: empSt.color, padding: '2px 8px', borderRadius: 20, background: `${empSt.color}18` }}>{empSt.label}</span>
                        {r.employeeUpdatedAt && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Updated {new Date(r.employeeUpdatedAt).toLocaleDateString('en-IN')}</span>}
                      </div>

                      {r.employeeNote && (
                        <div style={{ marginBottom: 8, padding: '8px 12px', background: 'rgba(108,99,255,0.07)', borderRadius: 6, fontSize: 12, color: 'var(--text-secondary)', borderLeft: '3px solid #6C63FF' }}>
                          <span style={{ fontWeight: 600, color: '#6C63FF' }}>My Note: </span>{r.employeeNote}
                        </div>
                      )}

                      {/* HR Feedback */}
                      {r.hrFeedback && (
                        <div style={{ marginBottom: 8, padding: '8px 12px', background: 'rgba(67,232,172,0.07)', borderRadius: 6, fontSize: 12, color: 'var(--text-secondary)', borderLeft: '3px solid #43E8AC' }}>
                          <span style={{ fontWeight: 600, color: '#43E8AC' }}>HR Feedback: </span>{r.hrFeedback}
                          {r.hrRespondedAt && <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 8 }}>— {new Date(r.hrRespondedAt).toLocaleDateString('en-IN')}</span>}
                        </div>
                      )}

                      {r.notes && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.notes}</div>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {r.status === 'COMPLETED' && (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(67,232,172,0.12)', border: '2px solid #43E8AC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#43E8AC' }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
                          {r.certificate && <div style={{ fontSize: 10, color: '#43E8AC', marginTop: 4, fontWeight: 600 }}>Certified</div>}
                        </div>
                      )}
                      {r.status !== 'COMPLETED' && (
                        <button onClick={() => handleOpenUpdate(r)} style={{
                          padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                          background: 'linear-gradient(135deg,#6C63FF,#8B85FF)', color: '#fff',
                          fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap',
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Update Progress</button>
                      )}
                    </div>
                  </div>

                  {/* Update Progress Modal inline */}
                  {updating?._id === r._id && (
                    <div style={{ marginTop: 14, padding: 14, background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border)' }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', marginBottom: 10 }}>Update Your Progress</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                        <div>
                          <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Status</label>
                          <select value={upForm.employeeStatus} onChange={e => setUpForm(f => ({ ...f, employeeStatus: e.target.value }))}
                            style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}>
                            <option value="NOT_STARTED">Not Started</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="NEEDS_HELP">Needs Help</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Note to HR</label>
                          <input value={upForm.employeeNote} onChange={e => setUpForm(f => ({ ...f, employeeNote: e.target.value }))}
                            placeholder="e.g. Completed module 2, stuck on module 3..."
                            style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                      </div>
                      {upSuccess && <div style={{ fontSize: 12, color: '#43E8AC', marginBottom: 8 }}>✓ {upSuccess}</div>}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={handleSaveUpdate} disabled={upSaving} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: '#6C63FF', color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                          {upSaving ? 'Saving...' : 'Send to HR'}
                        </button>
                        <button onClick={() => setUpdating(null)} style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

// ─── MY PROFILE ──────────────────────────────────────────────────────────────
export function MyProfile() {
  const { user: authUser } = useAuth();
  const [profile, setProfile]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [editing, setEditing]         = useState(false);
  const [showPwModal, setShowPwModal] = useState(false);
  const [form, setForm]               = useState({});
  const [pwForm, setPwForm]           = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [toast, setToast]             = useState(null);

  // OTP state for change-password
  const [pwStep, setPwStep]       = useState('form');   // 'form' | 'otp'
  const [pwOtp, setPwOtp]         = useState('      ');
  const [otpSent, setOtpSent]     = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [pwOtpError, setPwOtpError] = useState('');

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  useEffect(() => {
    apiFetch('/api/employee/profile')
      .then(u => {
        setProfile(u);
        setForm({ name: u.name || '', phone: u.phone || '', address: u.address || '', emergencyContact: u.emergencyContact || '', bio: u.bio || '' });
      })
      .catch(e => showToast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await apiFetch('/api/employee/profile', 'PUT', form);
      setProfile(res.user || res);
      setEditing(false);
      showToast('Profile updated!');
    } catch (e) { showToast(e.message, 'error'); }
    setSaving(false);
  };

  const changePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) { showToast('Passwords do not match', 'error'); return; }
    if (pwForm.newPassword.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
    if (!otpSent) {
      // Step 1: validate form then send OTP
      if (!pwForm.currentPassword) { showToast('Please enter your current password', 'error'); return; }
      setOtpLoading(true);
      try {
        await apiFetch('/api/employee/change-password/send-otp', 'POST', {});
        setPwStep('otp');
        setPwOtp('      ');
        setPwOtpError('');
        setOtpSent(true);
      } catch (e) { showToast(e.message, 'error'); }
      setOtpLoading(false);
    }
  };

  const confirmChangePassword = async () => {
    const cleanOtp = pwOtp.trim();
    if (cleanOtp.length < 6) { setPwOtpError('Please enter the complete 6-digit OTP.'); return; }
    setSaving(true);
    try {
      await apiFetch('/api/employee/change-password', 'PUT', {
        otp: cleanOtp,
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      showToast('Password changed successfully!');
      setShowPwModal(false);
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwStep('form');
      setPwOtp('      ');
      setOtpSent(false);
      setPwOtpError('');
    } catch (e) { setPwOtpError(e.message); }
    setSaving(false);
  };

  const ROLE_COLOR = { EMPLOYEE: '#43E8AC', HR: '#FF6584', MANAGER: '#38BDF8', SUPER_ADMIN: '#6C63FF' };

  if (loading) return <Layout><Loader /></Layout>;

  const u = profile;
  const initials = u?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'ME';
  const roleColor = ROLE_COLOR[u?.role] || '#6C63FF';

  return (
    <Layout>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Password Modal */}
      {showPwModal && (
        <Portal>
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--r-lg)', padding: 28, width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>

            {/* Step indicator */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
              {[1, 2].map(n => (
                <div key={n} style={{ height: 3, flex: 1, borderRadius: 4, background: (pwStep === 'form' ? 1 : 2) >= n ? '#6C63FF' : 'var(--border)', transition: 'background 0.3s' }} />
              ))}
            </div>

            {pwStep === 'form' ? (
              <>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 6 }}>🔑 Change Password</div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 18 }}>Enter your current and new password, then we'll send an OTP to verify.</p>
                {[
                  { key: 'currentPassword', label: 'Current Password', placeholder: 'Enter current password' },
                  { key: 'newPassword',     label: 'New Password',     placeholder: 'At least 6 characters' },
                  { key: 'confirmPassword', label: 'Confirm Password', placeholder: 'Repeat new password' },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{f.label}</label>
                    <input type="password" style={inp} placeholder={f.placeholder} value={pwForm[f.key]} onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))} />
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                  <button onClick={() => { setShowPwModal(false); setPwStep('form'); setOtpSent(false); }} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                  <button onClick={changePassword} disabled={otpLoading} style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: 'linear-gradient(90deg, #6C63FF, #8B85FF)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font-body)' }}>
                    {otpLoading ? 'Sending OTP…' : 'Send OTP →'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 6 }}>📲 Enter OTP</div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>A 6-digit code has been sent to your registered email.</p>
                {pwOtpError && (
                  <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 8, padding: '8px 12px', color: '#f43f5e', fontSize: 12, marginBottom: 12 }}>
                    ⚠️ {pwOtpError}
                  </div>
                )}
                {/* Mini OTP boxes */}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '20px 0' }}>
                  {[0,1,2,3,4,5].map(i => {
                    const inputsRef = [];
                    return (
                      <input
                        key={i}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={(pwOtp[i] || '').trim()}
                        onChange={e => {
                          const ch = e.target.value.replace(/\D/g,'').slice(-1);
                          const arr = (pwOtp + '      ').slice(0,6).split('');
                          arr[i] = ch;
                          setPwOtp(arr.join(''));
                          if (ch) {
                            const next = e.target.parentElement.children[i+1];
                            if (next) next.focus();
                          }
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Backspace' && !e.target.value && i > 0) {
                            const prev = e.target.parentElement.children[i-1];
                            if (prev) prev.focus();
                          }
                        }}
                        onPaste={e => {
                          const p = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);
                          setPwOtp(p.padEnd(6,' ').slice(0,6));
                          e.preventDefault();
                        }}
                        style={{
                          width: 44, height: 52, textAlign: 'center', fontSize: 20, fontWeight: 700,
                          border: (pwOtp[i]||'').trim() ? '2px solid #6C63FF' : '1.5px solid var(--border)',
                          borderRadius: 8,
                          background: (pwOtp[i]||'').trim() ? 'rgba(108,99,255,0.07)' : 'var(--bg-elevated)',
                          color: 'var(--text-primary)', outline: 'none', caretColor: 'transparent',
                        }}
                      />
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => { setPwStep('form'); setPwOtpError(''); setOtpSent(false); }} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>← Back</button>
                  <button onClick={confirmChangePassword} disabled={saving} style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: 'linear-gradient(90deg, #6C63FF, #8B85FF)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font-body)' }}>
                    {saving ? 'Verifying…' : 'Confirm Change'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        </Portal>
      )}

      <div style={{ maxWidth: 860 }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 24, color: 'var(--role-color, #10b981)' }}>My Profile</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>View and update your personal information</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
          {/* Profile Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card style={{ textAlign: 'center' }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: `linear-gradient(135deg, ${roleColor}, ${roleColor}99)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 700, color: '#fff',
                margin: '0 auto 14px',
                boxShadow: `0 8px 24px ${roleColor}40`,
              }}>{initials}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>{u?.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{u?.designation}</div>
              <div style={{ marginTop: 8, display: 'inline-block', padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${roleColor}18`, color: roleColor }}>
                {u?.role?.replace('_', ' ')}
              </div>
              {u?.bio && (
                <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5,  }}>"{u.bio}"</div>
              )}
            </Card>

            <Card style={{ padding: '16px 18px' }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Quick Info</div>
              {[
                { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, label: 'Department',  value: u?.department },
                { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,                                                                                                                                                                                                  label: 'Employee ID', value: u?.employeeId || '—' },
                { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,                                                                                                                                                                label: 'Email',       value: u?.email },
                { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,                                                                                                                          label: 'Joined',      value: u?.joiningDate ? new Date(u.joiningDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' }) : '—' },
                { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,                                                                                                                                                                                               label: 'Status',      value: u?.isActive ? 'Active' : 'Inactive' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                  <span style={{ color: 'var(--text-secondary)', marginTop: 1, flexShrink: 0 }}>{item.icon}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </Card>
          </div>

          {/* Edit Panel */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <SectionHeader title="Personal Information" subtitle="Keep your details up to date" />
              {!editing ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setShowPwModal(true)} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                    🔑 Password
                  </button>
                  <button onClick={() => setEditing(true)} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', background: 'linear-gradient(90deg, #6C63FF, #8B85FF)', color: '#fff', fontFamily: 'var(--font-body)' }}>
                    ✏️ Edit
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setEditing(false)} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>Cancel</button>
                  <button onClick={save} disabled={saving} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', background: '#43E8AC', color: '#fff', fontFamily: 'var(--font-body)' }}>
                    {saving ? 'Saving…' : '✓ Save'}
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { key: 'name',             label: 'Full Name',         type: 'text',  placeholder: 'Your full name' },
                { key: 'phone',            label: 'Phone Number',      type: 'tel',   placeholder: '+91 XXXXX XXXXX' },
                { key: 'address',          label: 'Address',           type: 'text',  placeholder: 'Your address' },
                { key: 'emergencyContact', label: 'Emergency Contact', type: 'text',  placeholder: 'Name & phone' },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{field.label}</label>
                  {editing ? (
                    <input
                      type={field.type}
                      style={inp}
                      placeholder={field.placeholder}
                      value={form[field.key]}
                      onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    />
                  ) : (
                    <div style={{ padding: '9px 12px', background: 'var(--bg-elevated)', borderRadius: 8, fontSize: 13, color: form[field.key] ? 'var(--text-primary)' : 'var(--text-muted)', border: '1px solid var(--border)' }}>
                      {form[field.key] || <span style={{  }}>Not set</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Bio - full width */}
            <div style={{ marginTop: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Bio / About Me</label>
              {editing ? (
                <textarea style={{ ...inp, resize: 'vertical' }} rows={3} placeholder="A short bio about yourself…" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
              ) : (
                <div style={{ padding: '9px 12px', background: 'var(--bg-elevated)', borderRadius: 8, fontSize: 13, color: form.bio ? 'var(--text-secondary)' : 'var(--text-muted)', border: '1px solid var(--border)', minHeight: 60 }}>
                  {form.bio || <span style={{  }}>No bio added yet.</span>}
                </div>
              )}
            </div>

            {/* Read-only fields */}
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>System Information (Read-only)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Email',       value: u?.email },
                  { label: 'Role',        value: u?.role?.replace('_', ' ') },
                  { label: 'Department',  value: u?.department },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{f.label}</div>
                    <div style={{ padding: '8px 10px', background: 'var(--bg-elevated)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)', border: '1px solid var(--border)', opacity: 0.75 }}>{f.value || '—'}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

// Legacy exports for backward compatibility
export { ViewAnnouncements as MyAnnouncements };
export { MyGrievances as Grievances };
export { MyTraining as Training };
