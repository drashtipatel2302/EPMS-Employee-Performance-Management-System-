import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

const Portal = ({ children }) => ReactDOM.createPortal(children, document.body);

import Layout from '../../components/Layout';
import { Card, SectionHeader, Button } from '../../components/UI';
import { fetchAppraisals, fetchEmployees, createAppraisal, updateAppraisal, deleteAppraisal } from '../../services/api';

const STATUS_META = {
  SCHEDULED:   { color:'#6C63FF', bg:'rgba(108,99,255,0.12)',  label:'Scheduled',   icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  PENDING:     { color:'#FFB547', bg:'rgba(255,181,71,0.12)',  label:'Pending',     icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  IN_PROGRESS: { color:'#38BDF8', bg:'rgba(56,189,248,0.12)',  label:'In Progress', icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
  COMPLETED:   { color:'#43E8AC', bg:'rgba(67,232,172,0.12)',  label:'Completed',   icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> },
};

const CRITERIA_DEFAULT = [
  { id:1, name:'Goal Achievement', weight:40 },
  { id:2, name:'Work Quality',     weight:25 },
  { id:3, name:'Collaboration',    weight:20 },
  { id:4, name:'Learning & Growth',weight:15 },
];

const EMPTY_FORM = { employee:'', type:'ANNUAL', dueDate:'', remarks:'' };

function Field({ label, required, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:'block',fontSize:11,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:0.8,marginBottom:5 }}>
        {label}{required&&<span style={{color:'#FF6584'}}> *</span>}
      </label>
      {children}
    </div>
  );
}

export default function Appraisals() {
  const [tab,        setTab]        = useState('all');
  const [appraisals, setAppraisals] = useState([]);
  const [employees,  setEmployees]  = useState([]);
  const [criteria,   setCriteria]   = useState(CRITERIA_DEFAULT);
  const [loading,    setLoading]    = useState(true);
  const [showNew,    setShowNew]    = useState(false);
  const [processing, setProcessing] = useState(null); // appraisal being reviewed
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');

  const INP = { width:'100%',padding:'9px 12px',boxSizing:'border-box',background:'var(--bg-elevated)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text-primary)',fontSize:13,outline:'none' };

  const load = () => {
    setLoading(true);
    Promise.all([
      fetchAppraisals().catch(() => ({ appraisals: [] })),
      fetchEmployees({ limit: 200 }).catch(() => ({ employees: [] })),
    ]).then(([aRes, eRes]) => {
      setAppraisals(aRes.appraisals || []);
      setEmployees((eRes.employees || eRes || []).filter(e => e.role === 'EMPLOYEE' || e.role === 'MANAGER'));
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const counts = {
    SCHEDULED:   appraisals.filter(a => a.status === 'SCHEDULED').length,
    PENDING:     appraisals.filter(a => a.status === 'PENDING').length,
    IN_PROGRESS: appraisals.filter(a => a.status === 'IN_PROGRESS').length,
    COMPLETED:   appraisals.filter(a => a.status === 'COMPLETED').length,
  };

  const filtered = tab === 'all' ? appraisals : appraisals.filter(a => a.status === tab);

  const handleCreate = async () => {
    if (!form.employee || !form.dueDate) { setError('Employee and Due Date are required.'); return; }
    setSaving(true); setError('');
    try {
      await createAppraisal(form);
      setShowNew(false); setForm(EMPTY_FORM); load();
    } catch(e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleStatusChange = async (id, status, extra = {}) => {
    try {
      await updateAppraisal(id, { status, ...extra });
      setAppraisals(prev => prev.map(a => (a._id||a.id) === id ? { ...a, status, ...extra } : a));
      setProcessing(null);
    } catch(e) { alert(e.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this appraisal?')) return;
    try {
      await deleteAppraisal(id);
      setAppraisals(prev => prev.filter(a => (a._id||a.id) !== id));
    } catch(e) { alert(e.message); }
  };

  const Tab = ({ label, k, count }) => (
    <button onClick={() => setTab(k)} style={{ padding:'8px 16px',borderRadius:9,fontSize:13,fontWeight:600,cursor:'pointer',background:tab===k?'#6C63FF':'var(--bg-elevated)',color:tab===k?'#fff':'var(--text-secondary)',border:tab===k?'none':'1px solid var(--border)',transition:'all .15s',whiteSpace:'nowrap' }}>
      {label}{count !== undefined && <span style={{ marginLeft:5,padding:'1px 7px',borderRadius:20,background:tab===k?'rgba(255,255,255,0.2)':'var(--bg-surface)',fontSize:11 }}>{count}</span>}
    </button>
  );

  return (
    <Layout>
      {/* ── Create modal ── */}
      {showNew && (
        <Portal>
          <div style={{ position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,0.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16 }} onClick={() => setShowNew(false)}>
          <div style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:16,padding:28,width:'100%',maxWidth:480,boxShadow:'0 24px 64px rgba(0,0,0,0.4)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex',justifyContent:'space-between',marginBottom:22 }}>
              <h3 style={{ margin:0,fontSize:17,fontWeight:800,color:'var(--text-primary)' }}>Create Appraisal</h3>
              <button onClick={() => setShowNew(false)} style={{ background:'var(--bg-elevated)',border:'1px solid var(--border)',borderRadius:8,width:30,height:30,cursor:'pointer',color:'var(--text-secondary)',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center' }}>×</button>
            </div>
            {error && <div style={{ padding:'9px 12px',background:'rgba(255,101,132,0.1)',border:'1px solid rgba(255,101,132,0.3)',borderRadius:8,color:'#FF6584',fontSize:12,marginBottom:14 }}>{error}</div>}
            <Field label="Employee" required>
              <select style={INP} value={form.employee} onChange={e => setForm(f => ({...f, employee: e.target.value}))}>
                <option value="">Select employee…</option>
                {employees.map(e => <option key={e._id} value={e._id}>{e.name} — {e.department}</option>)}
              </select>
            </Field>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14 }}>
              <Field label="Type">
                <select style={INP} value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))}>
                  {['ANNUAL','MID_YEAR','QUARTERLY','PROBATION'].map(t => <option key={t} value={t}>{t.replace('_',' ')}</option>)}
                </select>
              </Field>
              <Field label="Due Date" required>
                <input type="date" style={INP} value={form.dueDate} onChange={e => setForm(f => ({...f, dueDate: e.target.value}))} />
              </Field>
            </div>
            <Field label="Remarks">
              <textarea style={{ ...INP,minHeight:72,resize:'vertical' }} value={form.remarks} onChange={e => setForm(f => ({...f, remarks: e.target.value}))} placeholder="Optional notes…" />
            </Field>
            <div style={{ display:'flex',gap:10,justifyContent:'flex-end',marginTop:6 }}>
              <Button variant="secondary" size="sm" onClick={() => { setShowNew(false); setError(''); }}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleCreate} disabled={saving}>{saving ? 'Creating…' : 'Create Appraisal'}</Button>
            </div>
          </div>
        </div>
      </Portal>
      )}

      {/* ── Process modal ── */}
      {processing && (() => {
        const a = processing;
        const m = STATUS_META[a.status] || STATUS_META.PENDING;
        const emp = a.employee;
        return (
          <Portal>
          <div style={{ position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,0.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16 }} onClick={() => setProcessing(null)}>
            <div style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:16,padding:28,width:'100%',maxWidth:480,boxShadow:'0 24px 64px rgba(0,0,0,0.4)' }} onClick={e => e.stopPropagation()}>
              <div style={{ display:'flex',justifyContent:'space-between',marginBottom:20 }}>
                <div>
                  <h3 style={{ margin:0,fontSize:17,fontWeight:800,color:'var(--text-primary)' }}>Process Appraisal</h3>
                  <div style={{ fontSize:12,color:'var(--text-secondary)',marginTop:3 }}>{a.type} · Due {a.dueDate ? new Date(a.dueDate).toLocaleDateString('en-IN') : '—'}</div>
                </div>
                <button onClick={() => setProcessing(null)} style={{ background:'var(--bg-elevated)',border:'1px solid var(--border)',borderRadius:8,width:30,height:30,cursor:'pointer',color:'var(--text-secondary)',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center' }}>×</button>
              </div>
              {[
                { label:'Employee',   val: emp?.name || '—' },
                { label:'Department', val: emp?.department || '—' },
                { label:'Designation',val: emp?.designation || '—' },
                { label:'Status',     val: <span style={{ padding:'2px 10px',borderRadius:20,fontSize:11,fontWeight:700,background:m.bg,color:m.color }}>{m.icon} {m.label}</span> },
                { label:'Raise',      val: a.raisePercent != null ? `${a.raisePercent}%` : '—' },
                { label:'Score',      val: a.performanceScore != null ? `${a.performanceScore}/5` : '—' },
              ].map(f => (
                <div key={f.label} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderBottom:'1px solid var(--border)' }}>
                  <span style={{ fontSize:12,color:'var(--text-muted)' }}>{f.label}</span>
                  <span style={{ fontSize:13,fontWeight:600,color:'var(--text-primary)' }}>{f.val}</span>
                </div>
              ))}
              {a.remarks && <div style={{ marginTop:14,padding:12,background:'var(--bg-elevated)',borderRadius:8,fontSize:13,color:'var(--text-secondary)',lineHeight:1.6,fontStyle:'italic' }}>"{a.remarks}"</div>}
              <div style={{ display:'flex',gap:8,marginTop:20,flexWrap:'wrap' }}>
                {a.status !== 'IN_PROGRESS' && (
                  <button onClick={() => handleStatusChange(a._id||a.id, 'IN_PROGRESS')} style={{ flex:1,padding:'9px',borderRadius:9,border:'1px solid rgba(56,189,248,0.4)',background:'rgba(56,189,248,0.1)',color:'#38BDF8',fontWeight:700,cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',gap:5 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Mark In Progress</button>
                )}
                {a.status !== 'COMPLETED' && (
                  <button onClick={() => handleStatusChange(a._id||a.id, 'COMPLETED', { completedAt: new Date() })} style={{ flex:1,padding:'9px',borderRadius:9,border:'none',background:'linear-gradient(90deg,#43E8AC,#38BDF8)',color:'#fff',fontWeight:700,cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',gap:5 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Mark Completed</button>
                )}
                <button onClick={() => handleDelete(a._id||a.id)} style={{ padding:'9px 16px',borderRadius:9,border:'1px solid rgba(255,101,132,0.4)',background:'rgba(255,101,132,0.08)',color:'#FF6584',fontWeight:700,cursor:'pointer',fontSize:13 }}>🗑 Delete</button>
              </div>
            </div>
          </div>
        </Portal>
        );
      })()}

      <div style={{ maxWidth:1100 }}>
        {/* Header */}
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20,flexWrap:'wrap',gap:12 }}>
          <div>
            <div style={{ fontSize:24,fontWeight:800,color:'var(--role-color, #4f46e5)',marginBottom:4 }}>Appraisal Management</div>
            <div style={{ fontSize:13,color:'var(--text-secondary)' }}>Review, approve, and manage employee appraisal structures</div>
          </div>
          <Button variant="primary" onClick={() => { setShowNew(true); setError(''); }}>+ Create Appraisal</Button>
        </div>

        {/* Summary tiles */}
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12,marginBottom:20 }}>
          {Object.entries(counts).map(([key,val]) => {
            const m = STATUS_META[key];
            return (
              <div key={key} onClick={() => setTab(key)} style={{ background:'var(--bg-surface)',border:tab===key?`2px solid ${m.color}`:'1px solid var(--border)',borderRadius:12,padding:'16px 18px',cursor:'pointer',transition:'all .2s',position:'relative',overflow:'hidden' }}>
                <div style={{ position:'absolute',top:0,right:0,width:70,height:70,background:`radial-gradient(circle at top right,${m.color}15,transparent 70%)`,borderRadius:'0 12px 0 100%' }}/>
                <div style={{ width:36,height:36,borderRadius:9,background:`${m.color}18`,border:`1px solid ${m.color}30`,display:'flex',alignItems:'center',justifyContent:'center',color:m.color,marginBottom:10 }}>{m.icon}</div>
                <div style={{ fontSize:26,fontWeight:800,color:m.color,lineHeight:1 }}>{val}</div>
                <div style={{ fontSize:12,color:'var(--text-secondary)',fontWeight:600,marginTop:4 }}>{m.label}</div>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex',gap:8,marginBottom:18,flexWrap:'wrap' }}>
          <Tab label="All"           k="all"         count={appraisals.length} />
          <Tab label={<span style={{display:'inline-flex',alignItems:'center',gap:5}}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>Scheduled</span>}  k="SCHEDULED"   count={counts.SCHEDULED} />
          <Tab label={<span style={{display:'inline-flex',alignItems:'center',gap:5}}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Pending</span>}    k="PENDING"     count={counts.PENDING} />
          <Tab label={<span style={{display:'inline-flex',alignItems:'center',gap:5}}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>In Progress</span>} k="IN_PROGRESS" count={counts.IN_PROGRESS} />
          <Tab label={<span style={{display:'inline-flex',alignItems:'center',gap:5}}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Completed</span>}  k="COMPLETED"   count={counts.COMPLETED} />
        </div>

        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:18 }}>
          {/* Appraisal Records */}
          <Card>
            <SectionHeader title="Appraisal Records" subtitle={`${filtered.length} records`} />
            {loading ? (
              <div style={{ textAlign:'center',padding:'30px 0',color:'var(--text-muted)' }}>Loading…</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign:'center',padding:'40px 0',color:'var(--text-muted)' }}><div style={{marginBottom:8,display:'flex',justifyContent:'center'}}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>No appraisals in this category.</div>
            ) : filtered.map(a => {
              const m = STATUS_META[a.status] || STATUS_META.PENDING;
              const emp = a.employee;
              const ini = (emp?.name||'?').split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);
              return (
                <div key={a._id||a.id} style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:'1px solid var(--border)' }}>
                  <div style={{ width:36,height:36,borderRadius:10,background:'rgba(108,99,255,0.15)',border:'1px solid rgba(108,99,255,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#6C63FF',flexShrink:0 }}>{ini}</div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:13,fontWeight:700,color:'var(--text-primary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{emp?.name||'—'}</div>
                    <div style={{ fontSize:11,color:'var(--text-muted)' }}>{emp?.department||'—'} · {a.type} · {a.dueDate ? new Date(a.dueDate).toLocaleDateString('en-IN') : '—'}</div>
                  </div>
                  <div style={{ textAlign:'right',flexShrink:0 }}>
                    <span style={{ display:'block',padding:'3px 9px',borderRadius:20,fontSize:11,fontWeight:700,background:m.bg,color:m.color,marginBottom:a.raisePercent?4:0 }}>{m.icon} {m.label}</span>
                    {a.raisePercent != null && <span style={{ fontSize:10,color:'#43E8AC',fontWeight:600 }}>+{a.raisePercent}% raise</span>}
                  </div>
                  <button onClick={() => setProcessing(a)} style={{ padding:'5px 12px',borderRadius:7,border:'1px solid rgba(108,99,255,0.4)',background:'rgba(108,99,255,0.1)',color:'#9c8fff',fontSize:11,cursor:'pointer',fontWeight:600,flexShrink:0 }}>Process</button>
                </div>
              );
            })}
          </Card>

          {/* Appraisal Criteria + Rating Scale */}
          <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
            <Card>
              <SectionHeader title="Appraisal Criteria" subtitle="Evaluation weightage (must = 100%)" />
              {criteria.map((c,i) => (
                <div key={c.id} style={{ marginBottom:14 }}>
                  <div style={{ display:'flex',justifyContent:'space-between',marginBottom:5 }}>
                    <input value={c.name} onChange={e => { const nc=[...criteria]; nc[i]={...c,name:e.target.value}; setCriteria(nc); }} style={{ background:'transparent',border:'none',color:'var(--text-primary)',fontSize:13,fontWeight:600,outline:'none',flex:1 }} />
                    <div style={{ display:'flex',alignItems:'center',gap:4 }}>
                      <input type="number" min={0} max={100} value={c.weight} onChange={e => { const nc=[...criteria]; nc[i]={...c,weight:Number(e.target.value)}; setCriteria(nc); }} style={{ width:48,padding:'3px 6px',background:'var(--bg-elevated)',border:'1px solid var(--border)',borderRadius:6,color:'var(--text-primary)',fontSize:12,outline:'none',textAlign:'center' }} />
                      <span style={{ fontSize:12,color:'var(--text-muted)' }}>%</span>
                    </div>
                  </div>
                  <div style={{ height:6,background:'var(--bg-elevated)',borderRadius:6,overflow:'hidden' }}>
                    <div style={{ height:'100%',width:`${c.weight}%`,background:'linear-gradient(90deg,#6C63FF,#8B85FF)',borderRadius:6,transition:'width .3s' }} />
                  </div>
                </div>
              ))}
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:6 }}>
                <span style={{ fontSize:12,fontWeight:700,color:criteria.reduce((s,c)=>s+c.weight,0)===100?'#43E8AC':'#FF6584' }}>
                  Total: {criteria.reduce((s,c)=>s+c.weight,0)}%
                </span>
                <Button variant="primary" size="sm">✓ Save Criteria</Button>
              </div>
            </Card>

            <Card>
              <SectionHeader title="Rating Scale" subtitle="5-point evaluation scale" />
              {['Needs Improvement','Below Expectations','Meets Expectations','Exceeds Expectations','Outstanding'].map((label,i) => (
                <div key={i} style={{ display:'flex',alignItems:'center',gap:10,marginBottom:10 }}>
                  <div style={{ width:28,height:28,borderRadius:7,background:'rgba(255,181,71,0.15)',border:'1px solid rgba(255,181,71,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:13,color:'#FFB547',flexShrink:0 }}>{i+1}</div>
                  <div style={{ fontSize:13,color:'var(--text-secondary)',fontWeight:500 }}>{label}</div>
                </div>
              ))}
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
