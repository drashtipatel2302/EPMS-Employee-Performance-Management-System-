import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';

const Portal = ({ children }) => ReactDOM.createPortal(children, document.body);

import Layout from '../../components/Layout';
import { Card, SectionHeader, StatCard } from '../../components/UI';
import Loader from '../../components/Loader';
import { getAuthHeaders } from '../../services/api';

// ─── helpers ────────────────────────────────────────────────────────────────
const apiFetch = async (path, method = 'GET', body = null) => {
  const opts = { method, headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res  = await fetch(path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : '—';
const fmtDT   = d => d ? new Date(d).toLocaleString ('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit', hour12:true }) : '—';

const isOverdue = t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED';

const PRIORITY = {
  HIGH:   { color:'#EF4444', bg:'rgba(239,68,68,0.12)',   label:'High'   },
  MEDIUM: { color:'#F59E0B', bg:'rgba(245,158,11,0.12)',  label:'Medium' },
  LOW:    { color:'#43E8AC', bg:'rgba(67,232,172,0.12)',  label:'Low'    },
};
const STATUS = {
  PENDING:     { color:'#8B90A7', bg:'rgba(139,144,167,0.12)', label:'Pending',     dot:'#8B90A7' },
  IN_PROGRESS: { color:'#6C63FF', bg:'rgba(108,99,255,0.12)',  label:'In Progress', dot:'#6C63FF' },
  COMPLETED:   { color:'#43E8AC', bg:'rgba(67,232,172,0.18)',  label:'Completed',   dot:'#43E8AC' },
};

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3200); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{
      position:'fixed', bottom:28, right:28, zIndex:9999,
      padding:'12px 20px', borderRadius:12, fontWeight:600, fontSize:13,
      background: type === 'error' ? '#EF4444' : '#43E8AC', color:'#fff',
      boxShadow:'0 8px 32px rgba(0,0,0,0.18)',
    }}>
      {type === 'error' ? '⚠️' : '✅'} {msg}
    </div>
  );
}

// ─── Update Modal ─────────────────────────────────────────────────────────────
function UpdateModal({ task, onClose, onSaved }) {
  const [status, setStatus]   = useState(task.status);
  const [note,   setNote]     = useState('');
  const [hours,  setHours]    = useState(task.actualHours || '');
  const [compNote, setCompNote] = useState(task.completionNote || '');
  const [saving, setSaving]   = useState(false);
  const [err,    setErr]      = useState('');

  const pri = PRIORITY[task.priority] || PRIORITY.MEDIUM;
  const st  = STATUS[status] || STATUS.PENDING;

  const handleSubmit = async () => {
    setSaving(true); setErr('');
    try {
      const body = { status };
      if (note.trim())   body.note = note.trim();
      if (hours)         body.actualHours = hours;
      if (compNote.trim()) body.completionNote = compNote.trim();
      const data = await apiFetch(`/api/employee/tasks/${task._id}/status`, 'PUT', body);
      onSaved(data.task);
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const INP = {
    width:'100%', padding:'10px 12px',
    background:'var(--bg-elevated)', border:'1px solid var(--border)',
    borderRadius:8, color:'var(--text-primary)', fontSize:13, outline:'none',
    boxSizing:'border-box',
  };
  const LBL = { fontSize:11, fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 };

  return ReactDOM.createPortal(
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
      <div style={{ background:'var(--bg-surface)', borderRadius:16, width:'100%', maxWidth:540, boxShadow:'0 20px 60px rgba(0,0,0,0.25)', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:800, fontSize:17, color:'var(--text-primary)', marginBottom:4 }}>Update Task</div>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)', marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{task.title}</div>
            <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
              {task.project && <span style={{ fontSize:11, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:3 }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> {task.project}</span>}
              <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:pri.bg, color:pri.color, fontWeight:700 }}>{pri.label}</span>
              {isOverdue(task) && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:'rgba(239,68,68,0.12)', color:'#EF4444', fontWeight:700 }}>OVERDUE</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'var(--text-muted)', padding:4, flexShrink:0 }}>✕</button>
        </div>

        <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:16, maxHeight:'65vh', overflowY:'auto' }}>

          {/* Status */}
          <div>
            <label style={LBL}>Update Status</label>
            <div style={{ display:'flex', gap:8 }}>
              {Object.entries(STATUS).map(([k,v]) => (
                <button key={k} onClick={() => setStatus(k)} style={{
                  flex:1, padding:'10px 6px', borderRadius:10, border:`2px solid ${status===k ? v.color : 'var(--border)'}`,
                  background: status===k ? v.bg : 'var(--bg-elevated)',
                  color: status===k ? v.color : 'var(--text-secondary)',
                  fontWeight:700, fontSize:12, cursor:'pointer', transition:'all 0.15s',
                }}>{v.label}</button>
              ))}
            </div>
          </div>

          {/* Actual hours */}
          <div>
            <label style={LBL}>Actual Hours Spent</label>
            <input type="number" min={0} step={0.5} placeholder={`Estimated: ${task.estimatedHours || '—'}h`}
              value={hours} onChange={e => setHours(e.target.value)} style={INP} />
          </div>

          {/* Update note */}
          <div>
            <label style={LBL}>Add a Note / Update <span style={{ color:'var(--text-muted)', fontWeight:400, textTransform:'none' }}>(optional)</span></label>
            <textarea rows={3} placeholder="What did you work on? Any progress or issues?"
              value={note} onChange={e => setNote(e.target.value)}
              style={{ ...INP, resize:'vertical', lineHeight:1.6 }} />
          </div>

          {/* Completion note (show when marking completed) */}
          {status === 'COMPLETED' && (
            <div style={{ padding:'12px 14px', background:'rgba(67,232,172,0.06)', border:'1px solid rgba(67,232,172,0.25)', borderRadius:10 }}>
              <label style={{ ...LBL, color:'#059669' }}>Completion Summary</label>
              <textarea rows={2} placeholder="Brief summary of what was delivered..."
                value={compNote} onChange={e => setCompNote(e.target.value)}
                style={{ ...INP, resize:'vertical', lineHeight:1.6 }} />
            </div>
          )}

          {err && (
            <div style={{ padding:'10px 14px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, color:'#EF4444', fontSize:12 }}>
              ⚠️ {err}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'16px 24px', borderTop:'1px solid var(--border)', display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'9px 20px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-elevated)', color:'var(--text-secondary)', fontWeight:600, fontSize:13, cursor:'pointer' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving} style={{ padding:'9px 24px', borderRadius:8, border:'none', background: saving ? '#c7d2fe' : 'linear-gradient(90deg,#6C63FF,#8B85FF)', color:'#fff', fontWeight:700, fontSize:13, cursor: saving ? 'wait' : 'pointer' }}>
            {saving ? '⏳ Saving...' : '✅ Save Update'}
          </button>
        </div>
      </div>
    </div>
  , document.body);
}

// ─── Task Detail Expanded View ────────────────────────────────────────────────
function TaskDetail({ task }) {
  const pri = PRIORITY[task.priority] || PRIORITY.MEDIUM;

  return (
    <div style={{ marginTop:10, paddingTop:12, borderTop:'1px dashed var(--border)', display:'flex', flexDirection:'column', gap:10 }}>

      {/* Full description */}
      {task.description && (
        <div style={{ fontSize:13, color:'var(--text-primary)', lineHeight:1.7, padding:'10px 14px', background:'var(--bg-elevated)', borderRadius:9, borderLeft:'3px solid var(--accent)' }}>
          {task.description}
        </div>
      )}

      {/* Meta grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
        {[
          { label:'Project',      value: task.project || '—',                 color:'#6C63FF', bg:'rgba(108,99,255,0.07)', border:'rgba(108,99,255,0.18)', icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> },
          { label:'Assigned by',  value: task.assignedBy?.name || '—',        color:'#FFB547', bg:'rgba(255,181,71,0.07)',  border:'rgba(255,181,71,0.2)',  icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
          { label:'Due Date',     value: fmtDate(task.dueDate),               color: isOverdue(task) ? '#EF4444' : '#43E8AC', bg: isOverdue(task) ? 'rgba(239,68,68,0.07)' : 'rgba(67,232,172,0.07)', border: isOverdue(task) ? 'rgba(239,68,68,0.22)' : 'rgba(67,232,172,0.18)', icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
          { label:'Priority',     value: pri.label,                           color: pri.color, bg:`${pri.color}12`, border:`${pri.color}30`, icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
          { label:'Est. Hours',   value: task.estimatedHours ? `${task.estimatedHours}h` : '—', color:'#8B90A7', bg:'rgba(139,144,167,0.07)', border:'rgba(139,144,167,0.18)', icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
          { label:'Actual Hours', value: task.actualHours ? `${task.actualHours}h` : 'Not set', color:'#6C63FF', bg:'rgba(108,99,255,0.07)', border:'rgba(108,99,255,0.18)', icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
        ].map(m => (
          <div key={m.label} style={{ padding:'10px 13px', background: m.bg, borderRadius:9, border:`1px solid ${m.border}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color: m.color, fontWeight:700, textTransform:'uppercase', letterSpacing:0.5, marginBottom:5 }}>
              <span style={{ color: m.color }}>{m.icon}</span>{m.label}
            </div>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Completion note */}
      {task.completionNote && (
        <div style={{ fontSize:12, padding:'10px 14px', background:'rgba(67,232,172,0.06)', borderRadius:9, borderLeft:'3px solid #43E8AC', color:'var(--text-primary)' }}>
          <div style={{ fontWeight:700, fontSize:11, color:'#059669', marginBottom:4, textTransform:'uppercase' }}>Completion Summary</div>
          {task.completionNote}
        </div>
      )}

      {/* Notes thread */}
      {task.notes?.length > 0 && (
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:8 }}>
            Update History ({task.notes.length})
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:7, maxHeight:220, overflowY:'auto' }}>
            {[...task.notes].sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)).map((n,i) => (
              <div key={i} style={{ padding:'9px 12px', background:'var(--bg-elevated)', borderRadius:9, borderLeft:`3px solid ${n.role==='EMPLOYEE' ? '#6C63FF' : '#FFB547'}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:'var(--text-primary)' }}>
                    {n.author?.name || 'Unknown'}
                    <span style={{ marginLeft:6, fontSize:10, padding:'1px 6px', borderRadius:20, background: n.role==='EMPLOYEE' ? 'rgba(108,99,255,0.12)' : 'rgba(255,181,71,0.12)', color: n.role==='EMPLOYEE' ? '#6C63FF' : '#F59E0B' }}>
                      {n.role==='EMPLOYEE' ? 'You' : 'Manager'}
                    </span>
                  </span>
                  <span style={{ fontSize:10, color:'var(--text-muted)' }}>{fmtDT(n.createdAt)}</span>
                </div>
                <div style={{ fontSize:12, color:'var(--text-primary)', lineHeight:1.5 }}>{n.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MyTasks() {
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('ALL');
  const [updating, setUpdating] = useState(null);   // task being updated in modal
  const [expanded, setExpanded] = useState(null);   // task id with details open
  const [toast,    setToast]    = useState(null);

  const showToast = (msg, type='success') => setToast({ msg, type });

  const load = useCallback(() => {
    setLoading(true);
    apiFetch('/api/employee/tasks')
      .then(setData)
      .catch(e => showToast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = (data?.tasks || []).filter(t => filter === 'ALL' || t.status === filter);

  return (
    <Layout>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {updating && (
        <UpdateModal
          task={updating}
          onClose={() => setUpdating(null)}
          onSaved={updated => {
            setData(d => {
              if (!d) return d;
              const tasks = d.tasks.map(t => t._id === updated._id ? updated : t);
              const summary = {
                pending:    tasks.filter(t => t.status === 'PENDING').length,
                inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
                completed:  tasks.filter(t => t.status === 'COMPLETED').length,
              };
              return { ...d, tasks, summary };
            });
            setUpdating(null);
            showToast('Task updated successfully!');
          }}
        />
      )}

      <div style={{ maxWidth:960 }}>
        {/* Page header */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontWeight:800, fontSize:24, color:'var(--role-color, #10b981)', marginBottom:4 }}>My Tasks</div>
          <div style={{ fontSize:13, color:'var(--text-secondary)' }}>View all your assigned tasks and update progress</div>
        </div>

        {/* Stats */}
        {data && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
            <StatCard label="Total"       value={data.total}              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>} color="#6C63FF" delay={0.05} />
            <StatCard label="Pending"     value={data.summary.pending}    icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} color="#8B90A7" delay={0.08} />
            <StatCard label="In Progress" value={data.summary.inProgress} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>} color="#FFB547" delay={0.11} />
            <StatCard label="Completed"   value={data.summary.completed}  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>} color="#43E8AC" delay={0.14} />
          </div>
        )}

        <Card>
          <SectionHeader title="Task List" subtitle="Click a task to see full details and update progress" />

          {/* Filters */}
          <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
            {[
              { key:'ALL', label:`All (${data?.total||0})` },
              { key:'PENDING',     label:`Pending (${data?.summary?.pending||0})` },
              { key:'IN_PROGRESS', label:`In Progress (${data?.summary?.inProgress||0})` },
              { key:'COMPLETED',   label:`Completed (${data?.summary?.completed||0})` },
            ].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{
                padding:'7px 16px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer',
                background: filter===f.key ? '#6C63FF' : 'var(--bg-elevated)',
                color:      filter===f.key ? '#fff'    : 'var(--text-secondary)',
                border:`1px solid ${filter===f.key ? '#6C63FF' : 'var(--border)'}`,
                transition:'all 0.15s',
              }}>{f.label}</button>
            ))}
          </div>

          {loading ? <Loader /> : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {filtered.map(t => {
                const pri = PRIORITY[t.priority] || PRIORITY.MEDIUM;
                const st  = STATUS[t.status]     || STATUS.PENDING;
                const due = isOverdue(t);
                const isOpen = expanded === t._id;

                return (
                  <div key={t._id} style={{
                    borderRadius:12, border:`1px solid ${due ? 'rgba(239,68,68,0.3)' : st.color+'30'}`,
                    background: t.status==='COMPLETED' ? 'rgba(67,232,172,0.03)' : 'var(--bg-elevated)',
                    overflow:'hidden', transition:'all 0.2s',
                  }}>
                    {/* ── Main row ── */}
                    <div style={{ padding:'14px 16px', display:'flex', alignItems:'flex-start', gap:14, cursor:'pointer' }}
                      onClick={() => setExpanded(isOpen ? null : t._id)}>

                      {/* Priority dot */}
                      <div style={{ width:10, height:10, borderRadius:'50%', background:pri.color, flexShrink:0, marginTop:4 }} />

                      {/* Content */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10, flexWrap:'wrap', marginBottom:5 }}>
                          <div style={{ fontWeight:700, fontSize:14, color:'var(--text-primary)', textDecoration: t.status==='COMPLETED' ? 'line-through' : 'none' }}>
                            {t.title}
                          </div>
                          <div style={{ display:'flex', gap:6, alignItems:'center', flexShrink:0, flexWrap:'wrap' }}>
                            <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:pri.bg, color:pri.color, fontWeight:700 }}>{pri.label}</span>
                            <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:st.bg,  color:st.color,  fontWeight:700 }}>{st.label}</span>
                            {due && <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:'rgba(239,68,68,0.12)', color:'#EF4444', fontWeight:700 }}>OVERDUE</span>}
                            {t.notes?.length > 0 && <span style={{ fontSize:11, color:'#6C63FF', display:'flex', alignItems:'center', gap:3 }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> {t.notes.length}</span>}
                          </div>
                        </div>

                        {/* Quick meta */}
                        <div style={{ display:'flex', gap:14, flexWrap:'wrap', fontSize:11, color:'var(--text-muted)', alignItems:'center' }}>
                          <span style={{ display:'flex', alignItems:'center', gap:3 }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> {t.assignedBy?.name}</span>
                          {t.project && <span style={{ display:'flex', alignItems:'center', gap:3 }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> {t.project}</span>}
                          <span style={{ display:'flex', alignItems:'center', gap:3, color: due ? '#EF4444' : 'inherit' }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Due: {fmtDate(t.dueDate)}</span>
                          {t.estimatedHours && <span style={{ display:'flex', alignItems:'center', gap:3 }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Est. {t.estimatedHours}h</span>}
                          {t.actualHours    && <span style={{ display:'flex', alignItems:'center', gap:3 }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Actual: {t.actualHours}h</span>}
                        </div>
                      </div>

                      {/* Chevron */}
                      <div style={{ fontSize:12, color:'var(--text-muted)', flexShrink:0, marginTop:3 }}>{isOpen ? '▲' : '▼'}</div>
                    </div>

                    {/* ── Expanded detail ── */}
                    {isOpen && (
                      <div style={{ padding:'0 16px 16px' }}>
                        <TaskDetail task={t} />
                        <button
                          onClick={() => setUpdating(t)}
                          style={{
                            marginTop:14, padding:'10px 22px', borderRadius:10, border:'none',
                            background:'linear-gradient(135deg,#6C63FF,#8B85FF)',
                            color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer',
                            boxShadow:'0 4px 14px rgba(108,99,255,0.3)',
                            display:'flex', alignItems:'center', gap:7,
                          }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          Update This Task
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {filtered.length === 0 && (
                <div style={{ textAlign:'center', padding:56, color:'var(--text-muted)', fontSize:13 }}>
                  <div style={{ display:'flex', justifyContent:'center', marginBottom:10, opacity:0.4 }}><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
                  No tasks found for this filter.
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
