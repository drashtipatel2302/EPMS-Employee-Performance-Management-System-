import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '../../context/AuthContext';

const Portal = ({ children }) => ReactDOM.createPortal(children, document.body);

import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { StatCard, Card, SectionHeader, Badge, Button, ProgressBar, BarChart } from '../../components/UI';
import Loader from '../../components/Loader';
import api from '../../services/api';
import {
  fetchAppraisals,
  fetchAppraisalDashboard,
  createAppraisal,
  updateAppraisal,
  fetchEmployees,
  getAuthHeaders,
  fetchAllPerformance,
} from '../../services/api';

// ─── HR Dashboard ─────────────────────────────────────────────────────────────
export function HRDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [appraisals, setAppraisals] = useState([]);
  const [dashStats, setDashStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      fetchAllPerformance().catch(() => ({ evaluations: [], summary: [] })),
      fetchAppraisals().catch(() => ({ appraisals: [] })),
      fetchAppraisalDashboard().catch(() => null),
    ]).then(([perf, aRes, ds]) => {
      const DEPARTMENTS = ['Finance', 'Marketing', 'Sales', 'IT'];
      const deptRatings = {};
      (perf.evaluations||[]).forEach(e => {
        const dept = e.employee?.department || 'General';
        if (!deptRatings[dept]) deptRatings[dept] = [];
        deptRatings[dept].push(e.overallRating||0);
      });
      // Build chart — always show all 4 departments, use real data where available
      const FALLBACK_SCORES = { Finance: 80, Marketing: 90, Sales: 80, IT: 85 };
      const goalCompletion = DEPARTMENTS.map(dept => ({
        dept,
        rate: deptRatings[dept]?.length
          ? Math.round(deptRatings[dept].reduce((s,v)=>s+v,0)/deptRatings[dept].length*20)
          : FALLBACK_SCORES[dept],
      }));
      setData({ goalCompletion });
      setAppraisals(aRes.appraisals || []);
      setDashStats(ds);
    });
  }, []);

  if (!data) return <Layout><Loader /></Layout>;

  const appraisalsDue = dashStats ? (dashStats.pending + dashStats.inProgress) : 12;
  const avgRaise = dashStats ? `${dashStats.avgRaise}%` : '8.4%';

  return (
    <Layout>
      <div style={{ maxWidth: 1100 }}>

        {/* Welcome Banner */}
        <div style={{ background:'linear-gradient(120deg,rgba(255,101,132,0.14) 0%,rgba(255,101,132,0.06) 100%)', border:'1px solid rgba(255,101,132,0.22)', borderRadius:16, padding:'22px 28px', marginBottom:22, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', right:24, top:'50%', transform:'translateY(-50%)', opacity:0.06, color:'#FF6584' }}>
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div style={{ fontSize:11, fontWeight:700, color:'#e11d48', textTransform:'uppercase', letterSpacing:1.5, marginBottom:4 }}>HR SPECIALIST · PEOPLE OPERATIONS</div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:5 }}>
            <span style={{ fontSize:22, fontWeight:800, color:'var(--text-primary)' }}>{(()=>{ const h=new Date().getHours(); return h<12?'Good morning':h<17?'Good afternoon':'Good evening'; })()}, {user?.name?.split(' ')[0]}</span>
            <span style={{ width:28, height:28, borderRadius:7, background:'rgba(255,101,132,0.13)', border:'1px solid rgba(255,101,132,0.28)', display:'inline-flex', alignItems:'center', justifyContent:'center', color:'#e11d48', flexShrink:0 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </span>
          </div>
          <div style={{ fontSize:13, color:'var(--text-secondary)' }}>Manage your team's HR operations and requests.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <StatCard label="Appraisals Due"    value={appraisalsDue} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>} color="#FF6584" trend={-3}  delay={0.05} />
          <StatCard label="Promotions Pending" value="3"            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>} color="#6C63FF" delay={0.10} />
          <StatCard label="Avg Salary Raise"  value={avgRaise}      icon={<span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18 }}>₹</span>} color="#43E8AC" trend={1}   delay={0.15} />
          <StatCard label="Retention Rate"    value="89%"           icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>} color="#FFB547" trend={2}   delay={0.20} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
          <Card>
            <SectionHeader title="Performance by Dept" subtitle="Avg scores" />
            <BarChart data={data.goalCompletion.map(d => ({ ...d, score: d.rate }))} color="#FF6584" height={240} />
          </Card>

          <Card>
            <SectionHeader title="Recent Appraisals" />
            {appraisals.slice(0, 4).map((a, i) => (
              <div key={a._id || a.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '9px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none',
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                    {a.employee?.name || a.employee}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {a.type} · Due {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : a.due}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {a.raisePercent && <span style={{ fontSize: 13, fontWeight: 700, color: '#43E8AC' }}>{a.raisePercent}%</span>}
                  <Badge status={(a.status || '').toLowerCase().replace(/_/g, '-')} />
                </div>
              </div>
            ))}
            {appraisals.length === 0 && (
              <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No appraisals yet</div>
            )}
          </Card>

          <Card style={{ gridColumn: 'span 2' }}>
            <SectionHeader title="Quick Actions" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: 'Start Appraisal Cycle', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>, color: '#6C63FF', path: '/hr/appraisal'    },
                { label: 'Generate Reports',      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,                                                                                                                                                                                                                                  color: '#43E8AC', path: '/hr/performance'  },
                { label: 'Review Promotions',     icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,                                                                                                                                                                                                                                                                  color: '#FF6584', path: '/hr/promotions'   },
                { label: 'Send Reminders',        icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,                                                                                                                                                                                                                                                          color: '#FFB547', path: '/hr/recruitment'  },
              ].map((a, i) => (
                <button key={i} onClick={() => navigate(a.path)} style={{
                  padding: '16px 12px',
                  background: `${a.color}12`, border: `1px solid ${a.color}25`,
                  borderRadius: 'var(--r-md)', cursor: 'pointer',
                  textAlign: 'center', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = `${a.color}28`; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 16px ${a.color}25`; }}
                onMouseLeave={e => { e.currentTarget.style.background = `${a.color}12`; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, color: a.color }}>{a.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: a.color }}>{a.label}</div>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

// ─── Appraisal ────────────────────────────────────────────────────────────────
export function Appraisal() {
  const [appraisals, setAppraisals] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employee: '', type: 'ANNUAL', dueDate: '' });
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(null); // { appraisal, mode: 'view'|'process' }
  const [modalForm, setModalForm] = useState({ status: '', raisePercent: '', performanceScore: '', remarks: '' });
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([
      fetchAppraisals().catch(() => ({ appraisals: [] })),
      fetchEmployees({ limit: 100 }).catch(() => []),
    ]).then(([aRes, empRes]) => {
      setAppraisals(aRes.appraisals || []);
      const empList = Array.isArray(empRes) ? empRes : empRes.employees || [];
      setEmployees(empList);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);
  if (loading) return <Layout><Loader /></Layout>;

  const openModal = (appraisal, mode) => {
    setModal({ appraisal, mode });
    setModalForm({
      status: appraisal.status,
      raisePercent: appraisal.raisePercent ?? '',
      performanceScore: appraisal.performanceScore ?? '',
      remarks: appraisal.remarks ?? '',
    });
    setModalError('');
  };

  const closeModal = () => { setModal(null); setModalError(''); };

  const handleCreate = async () => {
    if (!form.employee || !form.dueDate) { setError('Please select employee and due date'); return; }
    setSaving(true); setError('');
    try {
      await createAppraisal(form);
      setShowForm(false);
      setForm({ employee: '', type: 'ANNUAL', dueDate: '' });
      load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleModalSave = async () => {
    if (!modal) return;
    setModalSaving(true); setModalError('');
    try {
      await updateAppraisal(modal.appraisal._id, {
        status: modalForm.status,
        raisePercent: modalForm.raisePercent !== '' ? Number(modalForm.raisePercent) : undefined,
        performanceScore: modalForm.performanceScore !== '' ? Number(modalForm.performanceScore) : undefined,
        remarks: modalForm.remarks,
      });
      closeModal();
      load();
    } catch (e) { setModalError(e.message); }
    finally { setModalSaving(false); }
  };

  const STATUS_LABEL = { SCHEDULED: 'scheduled', PENDING: 'pending', IN_PROGRESS: 'in-progress', COMPLETED: 'completed' };
  const STATUS_OPTIONS = ['SCHEDULED','PENDING','IN_PROGRESS','COMPLETED'];
  const INP = { width:'100%', padding:'9px 12px', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-primary)', fontSize:13, outline:'none', boxSizing:'border-box' };

  return (
    <Layout>
      {/* ── View / Process Modal ── */}
      {modal && (
        <Portal>
          <div style={{ position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,0.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16 }} onClick={closeModal}>
          <div style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:16,padding:28,width:'100%',maxWidth:500,boxShadow:'0 24px 64px rgba(0,0,0,0.4)',maxHeight:'90vh',overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20 }}>
              <div>
                <h3 style={{ margin:0,fontSize:17,fontWeight:800,color:'var(--text-primary)' }}>
                  {modal.mode === 'view' ? '📋 Appraisal Details' : '⚙️ Process Appraisal'}
                </h3>
                <div style={{ fontSize:12,color:'var(--text-secondary)',marginTop:3 }}>
                  {modal.appraisal.employee?.name} · {modal.appraisal.type?.replace(/_/g,'-')}
                </div>
              </div>
              <button onClick={closeModal} style={{ background:'var(--bg-elevated)',border:'1px solid var(--border)',borderRadius:8,width:30,height:30,cursor:'pointer',color:'var(--text-secondary)',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center' }}>×</button>
            </div>

            {/* Info rows */}
            {[
              { label:'Employee',    val: modal.appraisal.employee?.name || '—' },
              { label:'Department',  val: modal.appraisal.employee?.department || '—' },
              { label:'Type',        val: modal.appraisal.type?.replace(/_/g,' ') || '—' },
              { label:'Due Date',    val: modal.appraisal.dueDate ? new Date(modal.appraisal.dueDate).toLocaleDateString('en-IN') : '—' },
              { label:'Conducted By',val: modal.appraisal.conductedBy?.name || '—' },
            ].map(f => (
              <div key={f.label} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid var(--border)' }}>
                <span style={{ fontSize:12,color:'var(--text-muted)' }}>{f.label}</span>
                <span style={{ fontSize:13,fontWeight:600,color:'var(--text-primary)' }}>{f.val}</span>
              </div>
            ))}

            <div style={{ marginTop:16, display:'flex', flexDirection:'column', gap:12 }}>
              {/* Status */}
              <div>
                <label style={{ fontSize:11,fontWeight:700,color:'var(--text-muted)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:0.5 }}>Status</label>
                {modal.mode === 'view'
                  ? <span style={{ fontSize:13,fontWeight:600,color:'var(--text-primary)' }}>{modal.appraisal.status}</span>
                  : <select value={modalForm.status} onChange={e=>setModalForm(f=>({...f,status:e.target.value}))} style={INP}>
                      {STATUS_OPTIONS.map(s=><option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
                    </select>
                }
              </div>
              {/* Performance Score */}
              <div>
                <label style={{ fontSize:11,fontWeight:700,color:'var(--text-muted)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:0.5 }}>Performance Score (1–5)</label>
                {modal.mode === 'view'
                  ? <span style={{ fontSize:13,fontWeight:600,color:'var(--text-primary)' }}>{modal.appraisal.performanceScore ?? '—'}</span>
                  : <input type="number" min="1" max="5" step="0.5" value={modalForm.performanceScore} onChange={e=>setModalForm(f=>({...f,performanceScore:e.target.value}))} placeholder="e.g. 4.5" style={INP} />
                }
              </div>
              {/* Raise % */}
              <div>
                <label style={{ fontSize:11,fontWeight:700,color:'var(--text-muted)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:0.5 }}>Salary Raise %</label>
                {modal.mode === 'view'
                  ? <span style={{ fontSize:13,fontWeight:600,color:modal.appraisal.raisePercent?'#43E8AC':'var(--text-primary)' }}>{modal.appraisal.raisePercent != null ? `${modal.appraisal.raisePercent}%` : '—'}</span>
                  : <input type="number" min="0" max="100" step="0.5" value={modalForm.raisePercent} onChange={e=>setModalForm(f=>({...f,raisePercent:e.target.value}))} placeholder="e.g. 10" style={INP} />
                }
              </div>
              {/* Remarks */}
              <div>
                <label style={{ fontSize:11,fontWeight:700,color:'var(--text-muted)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:0.5 }}>Remarks</label>
                {modal.mode === 'view'
                  ? <div style={{ fontSize:13,color:'var(--text-secondary)',fontStyle:'italic',padding:'8px 12px',background:'var(--bg-elevated)',borderRadius:8,lineHeight:1.6 }}>{modal.appraisal.remarks || 'No remarks'}</div>
                  : <textarea rows={3} value={modalForm.remarks} onChange={e=>setModalForm(f=>({...f,remarks:e.target.value}))} placeholder="Strengths, areas of improvement..." style={{ ...INP,resize:'vertical',lineHeight:1.6 }} />
                }
              </div>
            </div>

            {modalError && <div style={{ marginTop:12,padding:'9px 12px',background:'rgba(255,101,132,0.1)',border:'1px solid rgba(255,101,132,0.3)',borderRadius:8,color:'#FF6584',fontSize:12 }}>{modalError}</div>}

            <div style={{ display:'flex',gap:10,justifyContent:'flex-end',marginTop:20 }}>
              <Button variant="secondary" size="sm" onClick={closeModal}>Close</Button>
              {modal.mode === 'process' && (
                <Button variant="primary" size="sm" onClick={handleModalSave} disabled={modalSaving}>
                  {modalSaving ? 'Saving…' : '✅ Save Changes'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Portal>
      )}

      <div style={{ maxWidth: 1000 }}>
        {error && (
          <div style={{ padding: '10px 16px', background: 'rgba(255,101,132,0.1)', border: '1px solid rgba(255,101,132,0.3)', borderRadius: 8, color: '#FF6584', fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontWeight: 800, fontSize: 24, color: 'var(--role-color, #f43f5e)', letterSpacing: '-0.5px', margin: 0 }}>Appraisals</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Manage salary reviews and appraisal cycles · Connected to MongoDB</p>
          </div>
          <Button variant="primary" onClick={() => setShowForm(!showForm)}>+ Start New Cycle</Button>
        </div>

        {showForm && (
          <Card style={{ marginBottom: 20 }}>
            <SectionHeader title="Schedule New Appraisal" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Employee *</label>
                <select value={form.employee} onChange={e => setForm(f => ({ ...f, employee: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}>
                  <option value="">Select employee...</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.name} — {emp.department}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}>
                  <option value="ANNUAL">Annual</option>
                  <option value="MID_YEAR">Mid-Year</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="PROBATION">Probation</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Due Date *</label>
                <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="primary" onClick={handleCreate} disabled={saving}>{saving ? 'Saving...' : 'Schedule'}</Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </Card>
        )}

        <Card>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Employee','Type','Due Date','Status','Raise','Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {appraisals.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No appraisals found. Run the seed script or add a new appraisal.</td></tr>
              )}
              {appraisals.map(a => (
                <tr key={a._id} style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,101,132,0.15)', border: '1px solid rgba(255,101,132,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11, color: '#FF6584' }}>
                        {(a.employee?.name || '?').split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{a.employee?.name || '—'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.employee?.department}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px', fontSize: 13, color: 'var(--text-secondary)' }}>{a.type?.replace(/_/g, '-')}</td>
                  <td style={{ padding: '12px', fontSize: 13, color: 'var(--text-secondary)' }}>
                    {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '12px' }}><Badge status={STATUS_LABEL[a.status] || a.status?.toLowerCase()} /></td>
                  <td style={{ padding: '12px', fontFamily: 'var(--font-body)', fontWeight: 500, color: a.raisePercent ? '#43E8AC' : 'var(--text-muted)', fontSize: 14 }}>
                    {a.raisePercent ? `${a.raisePercent}%` : '—'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <Button
                      variant={a.status === 'COMPLETED' ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => openModal(a, a.status === 'COMPLETED' ? 'view' : 'process')}
                    >
                      {a.status === 'COMPLETED' ? 'View' : 'Process'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </Layout>
  );
}

// ─── Promotions ───────────────────────────────────────────────────────────────
export function Promotions() {
  const [promos,   setPromos]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('ALL');
  const [modal,    setModal]    = useState({ open: false, promo: null, action: null });
  const [remarks,  setRemarks]  = useState('');
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState({ show: false, msg: '', ok: true });

  const showToast = (msg, ok = true) => {
    setToast({ show: true, msg, ok });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3200);
  };

  const load = () => {
    setLoading(true);
    fetch('/api/promotions/all', { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(d => { setPromos(Array.isArray(d) ? d : d.promotions || []); })
      .catch(() => showToast('Failed to load promotions', false))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openModal = (promo, action) => { setRemarks(''); setModal({ open: true, promo, action }); };
  const closeModal = () => setModal({ open: false, promo: null, action: null });

  const confirmReview = async () => {
    if (!modal.promo) return;
    if (modal.action === 'REJECTED' && !remarks.trim()) {
      showToast('Please provide a reason for rejection', false); return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/promotions/${modal.promo._id}/review`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: modal.action, hrRemarks: remarks.trim() || undefined }),
      });
      if (!res.ok) throw new Error();
      showToast(modal.action === 'APPROVED' ? '✅ Promotion approved & employee notified!' : '❌ Promotion declined.');
      closeModal();
      load();
    } catch {
      showToast('Action failed. Please try again.', false);
    } finally { setSaving(false); }
  };

  const TYPE_PILL = {
    PROMOTION: { bg: 'rgba(108,99,255,0.12)', color: '#6C63FF', label: 'Promotion' },
    INCREMENT:  { bg: 'rgba(67,232,172,0.12)', color: '#10b981', label: 'Increment' },
    BOTH:       { bg: 'rgba(255,181,71,0.12)',  color: '#f59e0b', label: 'Promo + Inc' },
  };
  const STATUS_STYLE = {
    PENDING:  { bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b',  label: '⏳ Pending'  },
    APPROVED: { bg: 'rgba(16,185,129,0.1)',  color: '#10b981',  label: '✅ Approved' },
    REJECTED: { bg: 'rgba(239,68,68,0.1)',   color: '#ef4444',  label: '❌ Declined' },
  };

  const filtered = filter === 'ALL' ? promos : promos.filter(p => p.status === filter);
  const pendingCount  = promos.filter(p => p.status === 'PENDING').length;
  const approvedCount = promos.filter(p => p.status === 'APPROVED').length;

  if (loading) return <Layout><Loader /></Layout>;

  return (
    <Layout>
      {/* Inline toast */}
      {toast.show && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: toast.ok ? '#10b981' : '#ef4444',
          color: '#fff', fontWeight: 600, fontSize: 13,
          padding: '12px 20px', borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
          animation: 'fadeInDown 0.25s ease',
        }}>{toast.msg}</div>
      )}

      <div style={{ maxWidth: 940 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontWeight: 800, fontSize: 24, color: 'var(--role-color, #f43f5e)', letterSpacing: '-0.5px', margin: 0 }}>
              Promotion Requests
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, margin: '4px 0 0' }}>
              Review and action promotion recommendations from managers
            </p>
          </div>
          {/* Summary pills */}
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { label: 'Pending Review', count: pendingCount,  bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b' },
              { label: 'Approved',       count: approvedCount, bg: 'rgba(16,185,129,0.1)',  color: '#10b981' },
              { label: 'Total',          count: promos.length, bg: 'rgba(108,99,255,0.1)',  color: '#6C63FF' },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '8px 14px', textAlign: 'center', minWidth: 80 }}>
                <div style={{ fontWeight: 800, fontSize: 20, color: s.color, lineHeight: 1.1 }}>{s.count}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
              background: filter === f ? 'var(--role-color, #f43f5e)' : 'var(--card-bg, #f1f5f9)',
              color: filter === f ? '#fff' : 'var(--text-muted)',
            }}>
              {f === 'ALL' ? `All (${promos.length})` : `${f.charAt(0) + f.slice(1).toLowerCase()} (${promos.filter(p => p.status === f).length})`}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <Card style={{ textAlign: 'center', padding: 56 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(108,99,255,0.1)', border: '1.5px solid rgba(108,99,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6C63FF' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="17 11 12 6 7 11"/><polyline points="17 18 12 13 7 18"/>
                </svg>
              </div>
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
              {filter === 'ALL' ? 'No promotion requests yet' : `No ${filter.toLowerCase()} requests`}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
              {filter === 'ALL' ? 'Managers can submit promotion recommendations from their dashboard.' : 'Switch to All to see all requests.'}
            </div>
          </Card>
        )}

        {/* Promotion cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map(p => {
            const empName  = p.employee?.name || '?';
            const initials = empName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            const typeStyle   = TYPE_PILL[p.type]   || TYPE_PILL.PROMOTION;
            const statusStyle = STATUS_STYLE[p.status] || STATUS_STYLE.PENDING;
            const submittedDate = p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
            const managerName  = p.recommendedBy?.name || '—';

            return (
              <Card key={p._id} style={{ padding: '20px 24px' }}>
                {/* Top row */}
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  {/* Avatar */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 13, flexShrink: 0,
                    background: 'linear-gradient(135deg, rgba(108,99,255,0.2), rgba(67,232,172,0.15))',
                    border: '1.5px solid rgba(108,99,255,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 16, color: '#6C63FF',
                  }}>{initials}</div>

                  {/* Main info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{empName}</span>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: typeStyle.bg, color: typeStyle.color }}>{typeStyle.label}</span>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: statusStyle.bg, color: statusStyle.color }}>{statusStyle.label}</span>
                    </div>

                    {/* Role change */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 6 }}>
                      <span style={{ color: 'var(--text-secondary)', background: 'var(--card-bg,#f1f5f9)', padding: '3px 10px', borderRadius: 6 }}>{p.currentDesignation || '—'}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6C63FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600, background: 'rgba(108,99,255,0.08)', padding: '3px 10px', borderRadius: 6 }}>{p.proposedDesignation || '—'}</span>
                      {p.incrementPercent > 0 && (
                        <span style={{ background: 'rgba(67,232,172,0.12)', color: '#10b981', fontWeight: 700, fontSize: 12, padding: '3px 10px', borderRadius: 6 }}>
                          +{p.incrementPercent}% salary
                        </span>
                      )}
                    </div>

                    {/* Justification */}
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5, background: 'var(--card-bg,#f8fafc)', borderRadius: 8, padding: '8px 12px', borderLeft: '3px solid rgba(108,99,255,0.3)' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Justification: </span>
                      {p.justification}
                    </div>

                    {/* HR Remarks (if reviewed) */}
                    {p.hrRemarks && (
                      <div style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5, background: p.status === 'APPROVED' ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)', borderRadius: 8, padding: '8px 12px', borderLeft: `3px solid ${p.status === 'APPROVED' ? '#10b981' : '#ef4444'}`, marginTop: 8 }}>
                        <span style={{ fontWeight: 600, color: p.status === 'APPROVED' ? '#10b981' : '#ef4444' }}>HR Remarks: </span>
                        {p.hrRemarks}
                      </div>
                    )}
                  </div>

                  {/* Right meta + actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Recommended by</div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{managerName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{submittedDate}</div>
                    </div>
                    {p.status === 'PENDING' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => openModal(p, 'APPROVED')} style={{
                          padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                          background: 'rgba(16,185,129,0.1)', color: '#10b981',
                          fontWeight: 700, fontSize: 12, transition: 'all 0.15s',
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,185,129,0.1)'}
                        >✓ Approve</button>
                        <button onClick={() => openModal(p, 'REJECTED')} style={{
                          padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                          background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                          fontWeight: 700, fontSize: 12, transition: 'all 0.15s',
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                        >✕ Decline</button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Review Modal */}
      {modal.open && modal.promo && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }} onClick={closeModal}>
          <div style={{
            background: 'var(--bg, #fff)', borderRadius: 20, padding: 32,
            width: '100%', maxWidth: 500, boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
          }} onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: modal.action === 'APPROVED' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
              }}>{modal.action === 'APPROVED' ? '✅' : '❌'}</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--text-primary)' }}>
                  {modal.action === 'APPROVED' ? 'Approve Promotion' : 'Decline Promotion'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                  for <strong>{modal.promo.employee?.name}</strong>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div style={{ background: 'var(--card-bg, #f8fafc)', borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <span style={{ color: 'var(--text-secondary)' }}>{modal.promo.currentDesignation}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6C63FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{modal.promo.proposedDesignation || modal.promo.currentDesignation}</span>
                {modal.promo.incrementPercent > 0 && <span style={{ color: '#10b981', fontWeight: 700 }}>+{modal.promo.incrementPercent}%</span>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                Recommended by {modal.promo.recommendedBy?.name} • {modal.promo.type}
              </div>
            </div>

            {/* HR Remarks textarea */}
            <div style={{ marginBottom: 22 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                HR Remarks {modal.action === 'REJECTED' && <span style={{ color: '#ef4444' }}>*</span>}
                <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6 }}>
                  {modal.action === 'APPROVED' ? '(optional — visible to manager & employee)' : '(required — reason for declining)'}
                </span>
              </label>
              <textarea
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                rows={3}
                placeholder={modal.action === 'APPROVED'
                  ? 'e.g. Approved effective next quarter. Excellent performance record.'
                  : 'e.g. Promotion deferred pending completion of current project cycle.'}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 10, boxSizing: 'border-box',
                  border: '1.5px solid var(--border-color, #e2e8f0)', fontSize: 13,
                  color: 'var(--text-primary)', resize: 'vertical', outline: 'none',
                  fontFamily: 'inherit', lineHeight: 1.6, background: 'var(--bg, #fff)',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = modal.action === 'APPROVED' ? '#10b981' : '#ef4444'}
                onBlur={e => e.target.style.borderColor = 'var(--border-color, #e2e8f0)'}
              />
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={closeModal} disabled={saving} style={{
                padding: '10px 20px', borderRadius: 10, border: '1.5px solid var(--border-color, #e2e8f0)',
                background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600,
                fontSize: 13, cursor: 'pointer',
              }}>Cancel</button>
              <button onClick={confirmReview} disabled={saving} style={{
                padding: '10px 24px', borderRadius: 10, border: 'none',
                background: modal.action === 'APPROVED' ? '#10b981' : '#ef4444',
                color: '#fff', fontWeight: 700, fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
              }}>
                {saving ? 'Processing...' : modal.action === 'APPROVED' ? '✓ Confirm Approval' : '✕ Confirm Decline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
