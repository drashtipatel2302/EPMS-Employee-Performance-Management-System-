import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

const Portal = ({ children }) => ReactDOM.createPortal(children, document.body);

import Layout from '../../components/Layout';
import { Card, SectionHeader, StatCard } from '../../components/UI';
import Loader from '../../components/Loader';
import { getAuthHeaders } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const STATUS_STYLE = {
  NOT_STARTED:     { bg: 'rgba(156,163,175,0.15)', color: '#6B7280',  label: 'Not Started'     },
  IN_PROGRESS:     { bg: 'rgba(108,99,255,0.12)',  color: '#6C63FF',  label: 'In Progress'     },
  NEAR_COMPLETION: { bg: 'rgba(67,232,172,0.12)',  color: '#10B981',  label: 'Near Completion' },
  COMPLETED:       { bg: 'rgba(67,232,172,0.20)',  color: '#059669',  label: 'Completed'       },
  ON_HOLD:         { bg: 'rgba(255,181,71,0.15)',  color: '#F59E0B',  label: 'On Hold'         },
  BEHIND_SCHEDULE: { bg: 'rgba(255,101,132,0.15)', color: '#EF4444',  label: 'Behind Schedule' },
};

const progressColor = p => p >= 80 ? '#43E8AC' : p >= 40 ? '#6C63FF' : '#FFB547';
const fmtDate  = d => d ? new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : '—';
const fmtDT    = d => d ? new Date(d).toLocaleString('en-IN',  { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit', hour12:true }) : '—';

// ── Update Modal ──────────────────────────────────────────────────────────────
function UpdateModal({ project, onClose, onSaved }) {
  const [form, setForm] = useState({
    progress:    project.progress || 0,
    status:      project.status   || 'IN_PROGRESS',
    note:        '',
    blockers:    '',
    hoursLogged: '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.note.trim()) { setErr('Please add a progress note.'); return; }
    setSaving(true); setErr('');
    try {
      const res = await fetch(`/api/projects/${project._id}/update`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, progress: Number(form.progress), hoursLogged: Number(form.hoursLogged) || 0 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onSaved(data.project);
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const INP = { width: '100%', padding: '10px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' };
  const LBL = { fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 };

  return ReactDOM.createPortal(
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
      <div style={{ background:'var(--bg-surface)', borderRadius:16, width:'100%', maxWidth:520, boxShadow:'0 20px 60px rgba(0,0,0,0.25)', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ fontWeight:800, fontSize:17, color:'var(--text-primary)' }}>Update Project</div>
            <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:3 }}>{project.name}</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'var(--text-muted)', lineHeight:1, padding:4 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:16, maxHeight:'70vh', overflowY:'auto' }}>

          {/* Progress slider */}
          <div>
            <label style={LBL}>Progress: <span style={{ color: progressColor(form.progress), fontWeight:800 }}>{form.progress}%</span></label>
            <input type="range" min={0} max={100} step={5} value={form.progress}
              onChange={e => set('progress', e.target.value)}
              style={{ width:'100%', accentColor:'#6C63FF' }}
            />
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--text-muted)', marginTop:2 }}>
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </div>

          {/* Status */}
          <div>
            <label style={LBL}>Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} style={INP}>
              {Object.entries(STATUS_STYLE).map(([k,v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          {/* Hours logged */}
          <div>
            <label style={LBL}>Hours Logged Today</label>
            <input type="number" min={0} max={24} step={0.5} placeholder="e.g. 3.5"
              value={form.hoursLogged} onChange={e => set('hoursLogged', e.target.value)}
              style={INP}
            />
          </div>

          {/* Progress note */}
          <div>
            <label style={LBL}>Progress Note <span style={{ color:'#EF4444' }}>*</span></label>
            <textarea rows={3} placeholder="What did you work on? What was completed?"
              value={form.note} onChange={e => set('note', e.target.value)}
              style={{ ...INP, resize:'vertical', lineHeight:1.6 }}
            />
          </div>

          {/* Blockers */}
          <div>
            <label style={LBL}>Blockers / Issues <span style={{ color:'var(--text-muted)', fontWeight:400, textTransform:'none' }}>(optional)</span></label>
            <textarea rows={2} placeholder="Any blockers or issues? Leave blank if none."
              value={form.blockers} onChange={e => set('blockers', e.target.value)}
              style={{ ...INP, resize:'vertical', lineHeight:1.6 }}
            />
          </div>

          {err && (
            <div style={{ padding:'10px 14px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, color:'#EF4444', fontSize:12 }}>
              ⚡ {err}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'16px 24px', borderTop:'1px solid var(--border)', display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'9px 20px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-elevated)', color:'var(--text-secondary)', fontWeight:600, fontSize:13, cursor:'pointer' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving} style={{ padding:'9px 24px', borderRadius:8, border:'none', background: saving ? '#c7d2fe' : 'linear-gradient(90deg,#6C63FF,#8B85FF)', color:'#fff', fontWeight:700, fontSize:13, cursor: saving ? 'wait' : 'pointer' }}>
            {saving ? 'Submitting...' : 'Submit Update'}
          </button>
        </div>
      </div>
    </div>
  , document.body);
}

// ── Update History Timeline ───────────────────────────────────────────────────
function UpdateHistory({ updates }) {
  const [open, setOpen] = useState(false);
  if (!updates?.length) return (
    <div style={{ fontSize:12, color:'var(--text-muted)', padding:'8px 0' }}>No updates submitted yet.</div>
  );

  const sorted = [...updates].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div>
      <button onClick={() => setOpen(o => !o)} style={{ fontSize:12, fontWeight:700, color:'#6C63FF', background:'none', border:'none', cursor:'pointer', padding:0, display:'flex', alignItems:'center', gap:5 }}>
        {open ? '▲' : '▼'} {updates.length} update{updates.length !== 1 ? 's' : ''} logged
      </button>
      {open && (
        <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:8 }}>
          {sorted.map((u, i) => {
            const st = STATUS_STYLE[u.status] || STATUS_STYLE.NOT_STARTED;
            return (
              <div key={i} style={{ padding:'10px 14px', background:'var(--bg-elevated)', borderRadius:10, border:'1px solid var(--border)', borderLeft:`3px solid ${progressColor(u.progress)}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:12, fontWeight:700, color: progressColor(u.progress) }}>{u.progress}%</span>
                    <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:st.bg, color:st.color, fontWeight:600 }}>{st.label}</span>
                    {u.hoursLogged > 0 && <span style={{ fontSize:11, color:'var(--text-muted)', display:'inline-flex', alignItems:'center', gap:3 }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> {u.hoursLogged}h logged</span>}
                  </div>
                  <span style={{ fontSize:11, color:'var(--text-muted)' }}>{fmtDT(u.createdAt)}</span>
                </div>
                {u.note && <div style={{ fontSize:12, color:'var(--text-primary)', marginBottom: u.blockers ? 4 : 0, display:'flex', alignItems:'center', gap:4 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> {u.note}</div>}
                {u.blockers && (
                  <div style={{ fontSize:12, color:'#EF4444', marginTop:3, display:'flex', alignItems:'center', gap:4 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> <strong>Blocker:</strong> {u.blockers}</div>
                )}
                <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>by {u.updatedBy?.name || 'Team member'}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MyProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [filter, setFilter]     = useState('ALL');
  const [updating, setUpdating] = useState(null); // project being updated
  const [toast, setToast]       = useState('');

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchProjects = () => {
    fetch('/api/projects/my', { headers: getAuthHeaders() })
      .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.message); return d; })
      .then(setProjects)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(); }, []);

  if (loading) return <Layout><Loader /></Layout>;

  const FILTERS = ['ALL','IN_PROGRESS','NOT_STARTED','NEAR_COMPLETION','COMPLETED','ON_HOLD','BEHIND_SCHEDULE'];
  const visible  = filter === 'ALL' ? projects : projects.filter(p => p.status === filter);

  return (
    <Layout>
      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:20, right:24, zIndex:9999, background:'#1a1a2e', color:'#fff', padding:'12px 20px', borderRadius:10, fontSize:13, fontWeight:600, boxShadow:'0 8px 24px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}

      {/* Update modal */}
      {updating && (
        <UpdateModal
          project={updating}
          onClose={() => setUpdating(null)}
          onSaved={updated => {
            setProjects(ps => ps.map(p => p._id === updated._id ? updated : p));
            setUpdating(null);
            showToast('Update submitted! Your manager can see it.');
          }}
        />
      )}

      <div style={{ maxWidth:1100 }}>
        {/* Header */}
        <div style={{ marginBottom:22 }}>
          <div style={{ fontSize:24, fontWeight:800, color:'var(--role-color, #10b981)', marginBottom:4 }}>My Projects</div>
          <div style={{ fontSize:13, color:'var(--text-secondary)' }}>Track and update progress on your assigned projects</div>
        </div>

        {error && (
          <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:10, padding:'14px 18px', color:'#EF4444', fontSize:13, marginBottom:20, display:'flex', alignItems:'center', gap:8 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> {error}</div>
        )}

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
          <StatCard label="Total"       value={projects.length}                                                                                              color="#6C63FF" delay={0.05} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>} />
          <StatCard label="In Progress" value={projects.filter(p=>p.status==='IN_PROGRESS').length}                                                          color="#FFB547" delay={0.08} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>} />
          <StatCard label="Completed"   value={projects.filter(p=>p.status==='COMPLETED').length}                                                            color="#43E8AC" delay={0.11} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>} />
          <StatCard label="Overdue"     value={projects.filter(p=>p.dueDate && new Date(p.dueDate)<new Date() && p.status!=='COMPLETED').length}             color="#FF6584" delay={0.14} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>} />
        </div>

        {/* Filters */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
          {FILTERS.map(f => (
            <button key={f} onClick={()=>setFilter(f)} style={{
              padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:600,
              cursor:'pointer', border:'none', transition:'all 0.15s',
              background: filter===f ? '#6C63FF' : 'var(--bg-elevated)',
              color:       filter===f ? '#fff'    : 'var(--text-secondary)',
            }}>
              {f==='ALL' ? 'All' : STATUS_STYLE[f]?.label}
              {f!=='ALL' && <span style={{ marginLeft:5, opacity:0.7 }}>({projects.filter(p=>p.status===f).length})</span>}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {visible.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text-muted)' }}>
            <div style={{ marginBottom:12, display:'flex', justifyContent:'center' }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" style={{color:'var(--text-muted)'}}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg></div>
            <div style={{ fontWeight:600, fontSize:16, marginBottom:6, color:'var(--text-primary)' }}>
              {filter==='ALL' ? 'No projects assigned yet' : `No ${STATUS_STYLE[filter]?.label} projects`}
            </div>
            <div style={{ fontSize:13 }}>{filter==='ALL' ? 'Your manager will assign you to projects.' : 'Try a different filter.'}</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            {visible.map(p => {
              const st  = STATUS_STYLE[p.status] || STATUS_STYLE.NOT_STARTED;
              const pc  = progressColor(p.progress || 0);
              const isOverdue = p.dueDate && new Date(p.dueDate) < new Date() && p.status !== 'COMPLETED';
              const myUpdates = (p.updates||[]).filter(u => u.updatedBy?._id === user?.id || u.updatedBy === user?.id);

              return (
                <Card key={p._id}>
                  <div style={{ display:'flex', gap:20 }}>

                    {/* Left: project info */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                        <div style={{ fontWeight:800, fontSize:17, color:'var(--text-primary)' }}>{p.name}</div>
                        <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0, marginLeft:12 }}>
                          <span style={{ padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700, background:st.bg, color:st.color }}>{st.label}</span>
                          {isOverdue && <span style={{ padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:'rgba(239,68,68,0.12)', color:'#EF4444' }}>OVERDUE</span>}
                        </div>
                      </div>

                      {p.description && <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:14, lineHeight:1.6 }}>{p.description}</div>}

                      {/* Progress bar */}
                      <div style={{ marginBottom:14 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                          <span style={{ fontSize:12, color:'var(--text-secondary)' }}>Overall Progress</span>
                          <span style={{ fontSize:14, fontWeight:800, color:pc }}>{p.progress||0}%</span>
                        </div>
                        <div style={{ height:10, background:'var(--bg-elevated)', borderRadius:99, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${p.progress||0}%`, background:`linear-gradient(90deg,${pc},${pc}cc)`, borderRadius:99, transition:'width 0.5s ease' }}/>
                        </div>
                      </div>

                      {/* Meta */}
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:14 }}>
                        <div style={{ padding:'8px 12px', background:'var(--bg-elevated)', borderRadius:9 }}>
                          <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:0.5 }}>Manager</div>
                          <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', marginTop:3, display:'flex', alignItems:'center', gap:5 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> {p.manager?.name||'—'}</div>
                        </div>
                        <div style={{ padding:'8px 12px', background:'var(--bg-elevated)', borderRadius:9 }}>
                          <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:0.5 }}>Start Date</div>
                          <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', marginTop:3, display:'flex', alignItems:'center', gap:5 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> {fmtDate(p.startDate)}</div>
                        </div>
                        <div style={{ padding:'8px 12px', background:'var(--bg-elevated)', borderRadius:9, border: isOverdue ? '1px solid rgba(239,68,68,0.3)' : 'none' }}>
                          <div style={{ fontSize:10, color: isOverdue ? '#EF4444' : 'var(--text-muted)', textTransform:'uppercase', letterSpacing:0.5 }}>Due Date</div>
                          <div style={{ fontSize:13, fontWeight:600, color: isOverdue ? '#EF4444' : 'var(--text-primary)', marginTop:3, display:'flex', alignItems:'center', gap:5 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> {fmtDate(p.dueDate)}</div>
                        </div>
                      </div>

                      {/* Team */}
                      {p.teamMembers?.length > 0 && (
                        <div style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:14 }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline',marginRight:4,verticalAlign:'middle'}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> <strong>Team:</strong> {p.teamMembers.map(m=>m.name).join(', ')}
                        </div>
                      )}

                      {/* Update history */}
                      <div style={{ borderTop:'1px solid var(--border)', paddingTop:12 }}>
                        <UpdateHistory updates={p.updates} />
                      </div>
                    </div>

                    {/* Right: update button */}
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', justifyContent:'flex-start', gap:10, flexShrink:0 }}>
                      <button
                        onClick={() => setUpdating(p)}
                        style={{
                          padding:'10px 20px', borderRadius:10, border:'none',
                          background:'linear-gradient(135deg,#6C63FF,#8B85FF)',
                          color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer',
                          boxShadow:'0 4px 14px rgba(108,99,255,0.35)', whiteSpace:'nowrap',
                        }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:6,display:'inline',verticalAlign:'middle'}}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Update Progress
                      </button>
                      <div style={{ fontSize:11, color:'var(--text-muted)', textAlign:'right' }}>
                        {(p.updates||[]).length} update{(p.updates||[]).length!==1?'s':''} total
                      </div>
                    </div>
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
