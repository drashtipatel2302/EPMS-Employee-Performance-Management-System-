import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { StatCard, Card, SectionHeader, Sparkline, DonutChart, ProgressBar } from '../../components/UI';
import Loader from '../../components/Loader';
import { useAuth } from '../../context/AuthContext';
import { fetchEmployees, fetchDepartments, fetchAllPerformance } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const ROLE_COLORS = { SUPER_ADMIN:'#6C63FF', HR:'#FF6584', MANAGER:'#38BDF8', EMPLOYEE:'#43E8AC' };

const SVG = {
  shield:   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  hr:       <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  manager:  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="4" rx="1"/><rect x="2" y="18" width="6" height="4" rx="1"/><rect x="16" y="18" width="6" height="4" rx="1"/><path d="M12 6v4"/><path d="M5 18v-4h14v4"/></svg>,
  employee: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  users:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  building: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="22" x2="9" y2="2"/><line x1="15" y1="22" x2="15" y2="2"/><line x1="4" y1="7" x2="9" y2="7"/><line x1="4" y1="12" x2="9" y2="12"/><line x1="4" y1="17" x2="9" y2="17"/><line x1="15" y1="7" x2="20" y2="7"/><line x1="15" y1="12" x2="20" y2="12"/><line x1="15" y1="17" x2="20" y2="17"/></svg>,
  checkCircle: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  alertTriangle: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  star:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  trendUp:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  barChart: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  megaphone:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>,
  lock:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  settings: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  shieldBig:<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
};

const ROLE_ICONS = {
  SUPER_ADMIN: SVG.shield,
  HR:          SVG.hr,
  MANAGER:     SVG.manager,
  EMPLOYEE:    SVG.employee,
};

export default function AdminDashboard() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [emp,   setEmp]   = useState([]);
  const [depts, setDepts] = useState([]);
  const [chart, setChart] = useState(null);
  const [load,  setLoad]  = useState(true);

  useEffect(() => {
    Promise.all([
      fetchEmployees({ limit: 500 }),
      fetchDepartments(),
      fetchAllPerformance().catch(()=>({evaluations:[]})),
    ]).then(([er, dr, perf]) => {
      setEmp(er.employees || []);
      setDepts(Array.isArray(dr) ? dr : dr.departments || []);
      // Build mock-compatible chart shape from real perf data
      const evalsByMonth = {};
      (perf.evaluations||[]).forEach(e => {
        const m = e.createdAt ? new Date(e.createdAt).toLocaleString('en',{month:'short'}) : null;
        if (!m) return;
        if (!evalsByMonth[m]) evalsByMonth[m] = [];
        evalsByMonth[m].push(e.overallRating||0);
      });
      const perfTrend = Object.entries(evalsByMonth).slice(-6).map(([month,ratings]) => ({
        month, score: ratings.length ? Math.round(ratings.reduce((s,v)=>s+v,0)/ratings.length*20) : 0
      }));
      setChart({ performance: perfTrend.length ? perfTrend : [] });
    }).finally(() => setLoad(false));
  }, []);

  if (load) return <Layout><Loader /></Layout>;

  const total    = emp.length;
  const active   = emp.filter(e => e.isActive).length;
  const inactive = total - active;

  const roleDist = [
    { name:'Admins',    value: emp.filter(e=>e.role==='SUPER_ADMIN').length, color:'#6C63FF' },
    { name:'HR',        value: emp.filter(e=>e.role==='HR').length,          color:'#FF6584' },
    { name:'Managers',  value: emp.filter(e=>e.role==='MANAGER').length,     color:'#38BDF8' },
    { name:'Employees', value: emp.filter(e=>e.role==='EMPLOYEE').length,    color:'#43E8AC' },
  ];

  const recent = [...emp].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,6);

  const QUICK = [
    { label:'Manage Users',      icon:SVG.users,      path:'/admin/users',         desc:'Create/edit/deactivate staff'    },
    { label:'Departments',       icon:SVG.building,   path:'/admin/departments',    desc:'Create & manage departments'     },
    { label:'Appraisals',        icon:SVG.star,       path:'/admin/appraisals',     desc:'Approve appraisal structures'    },
    { label:'Performance',       icon:SVG.trendUp,    path:'/admin/performance',    desc:'All employees performance data'  },
    { label:'Reports',           icon:SVG.barChart,   path:'/admin/reports',        desc:'Company performance reports'     },
    { label:'Announcements',     icon:SVG.megaphone,  path:'/admin/announcements',  desc:'Post company-wide notices'       },
    { label:'Roles & Perms',     icon:SVG.lock,       path:'/admin/roles',          desc:'Manage role-based access'        },
    { label:'System Settings',   icon:SVG.settings,   path:'/admin/settings',       desc:'Working hours, criteria, scale'  },
  ];

  return (
    <Layout>
      <div style={{ maxWidth:1200 }}>

        {/* Welcome Banner */}
        <div style={{ background:'linear-gradient(120deg,rgba(108,99,255,0.18) 0%,rgba(255,101,132,0.08) 100%)', border:'1px solid rgba(108,99,255,0.22)', borderRadius:16, padding:'22px 28px', marginBottom:22, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', right:24, top:'50%', transform:'translateY(-50%)', opacity:0.06, color:'#6C63FF' }}>{SVG.shieldBig}</div>
          <div style={{ fontSize:11, fontWeight:700, color:'#6C63FF', textTransform:'uppercase', letterSpacing:1.5, marginBottom:4 }}>SUPER ADMIN · SYSTEM CONTROLLER</div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:5 }}>
            <span style={{ fontSize:22, fontWeight:800, color:'var(--text-primary)' }}>{(()=>{ const h=new Date().getHours(); return h<12?'Good morning':h<17?'Good afternoon':'Good evening'; })()}, {user?.name?.split(' ')[0]}</span>
            <span style={{ width:28, height:28, borderRadius:7, background:'rgba(108,99,255,0.14)', border:'1px solid rgba(108,99,255,0.28)', display:'inline-flex', alignItems:'center', justifyContent:'center', color:'#6C63FF', flexShrink:0 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
            </span>
          </div>
          <div style={{ fontSize:13, color:'var(--text-secondary)' }}>
            You have full authority over the entire system.
            {inactive > 0 && <span style={{ display:'inline-flex', alignItems:'center', gap:6, marginLeft:10, padding:'3px 10px', borderRadius:20, background:'rgba(234,88,12,0.12)', border:'1px solid rgba(234,88,12,0.3)', color:'#c2410c', fontSize:13, fontWeight:700 }}>⚠ {inactive} inactive account{inactive>1?'s':''} need attention.</span>}
          </div>
        </div>

        {/* Main Stats */}
        <div className="epms-stagger" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
          <StatCard label="Total Staff"       value={total}        icon={SVG.users}         color="#6C63FF" trend={8}  delay={0.05} />
          <StatCard label="Departments"       value={depts.length} icon={SVG.building}      color="#43E8AC" trend={2}  delay={0.10} />
          <StatCard label="Active Accounts"   value={active}       icon={SVG.checkCircle}   color="#43E8AC" trend={3}  delay={0.15} />
          <StatCard label="Inactive Accounts" value={inactive}     icon={SVG.alertTriangle} color="#FF6584" trend={-1} delay={0.20} />
        </div>

        {/* Role Tiles */}
        <div className="epms-stagger" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
          {[
            { role:'SUPER_ADMIN', label:'Admins'    },
            { role:'HR',          label:'HR Staff'  },
            { role:'MANAGER',     label:'Managers'  },
            { role:'EMPLOYEE',    label:'Employees' },
          ].map(({ role, label }) => {
            const count = emp.filter(e=>e.role===role).length;
            const color = ROLE_COLORS[role];
            return (
              <Card key={role} onClick={() => navigate('/admin/users')} style={{ textAlign:'center', padding:'18px 10px', cursor:'pointer', borderLeft:`3px solid ${color}` }}>
                <div style={{ display:'flex', justifyContent:'center', alignItems:'center', width:48, height:48, borderRadius:12, background:`${color}12`, border:`1px solid ${color}25`, margin:'0 auto', color, transition:'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)' }}
                  onMouseEnter={e=>e.currentTarget.style.transform='scale(1.15) rotate(-5deg)'}
                  onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}
                >{ROLE_ICONS[role]}</div>
                <div style={{ fontSize:28, fontWeight:800, color, marginTop:4 }}>{count}</div>
                <div style={{ fontSize:12, color:'var(--text-secondary)', marginTop:2 }}>{label}</div>
              </Card>
            );
          })}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:18, marginBottom:20 }}>
          {/* Performance Trend */}
          <Card>
            <SectionHeader title="Company Performance Trend" subtitle="Last 6 months avg score" />
            {chart && <Sparkline data={chart.performance} color="#6C63FF" height={130} />}
            {chart && (
              <div style={{ display:'flex', gap:16, marginTop:12 }}>
                {chart.performance.map((d,i) => (
                  <div key={i} style={{ textAlign:'center' }}>
                    <div style={{ fontWeight:700, fontSize:15, color:'var(--text-primary)' }}>{d.score}</div>
                    <div style={{ fontSize:10, color:'var(--text-muted)' }}>{d.month}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Role Donut */}
          <Card>
            <SectionHeader title="Staff by Role" subtitle="Current distribution" />
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
              <DonutChart data={roleDist} size={110} />
              <div style={{ width:'100%' }}>
                {roleDist.map(d => (
                  <div key={d.name} style={{ display:'flex', justifyContent:'space-between', marginBottom:6, alignItems:'center' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:d.color }} />
                      <span style={{ fontSize:12, color:'var(--text-secondary)' }}>{d.name}</span>
                    </div>
                    <span style={{ fontWeight:700, fontSize:13, color:'var(--text-primary)' }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:20 }}>
          {/* Quick Actions */}
          <Card>
            <SectionHeader title="Quick Actions" subtitle="Common admin tasks" />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {QUICK.map(a => (
                <button key={a.label} onClick={() => navigate(a.path)} className="epms-action-card" style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:10, cursor:'pointer', textAlign:'left' }}
                  onMouseEnter={e=>{ e.currentTarget.style.borderColor='rgba(108,99,255,0.5)'; e.currentTarget.style.background='rgba(108,99,255,0.07)'; }}
                  onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background='var(--bg-elevated)'; }}>
                  <span style={{ display:'flex', alignItems:'center', justifyContent:'center', width:34, height:34, borderRadius:8, background:'rgba(108,99,255,0.1)', border:'1px solid rgba(108,99,255,0.18)', color:'#6C63FF', flexShrink:0, transition:'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)' }}
                    onMouseEnter={e=>e.style.transform='scale(1.15) rotate(-8deg)'}
                    onMouseLeave={e=>e.style.transform='scale(1)'}
                  >{a.icon}</span>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)' }}>{a.label}</div>
                    <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:1 }}>{a.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Recently Added */}
          <Card>
            <SectionHeader title="Recently Added Staff" subtitle="Latest onboarding" />
            {recent.map((u,i) => {
              const color = ROLE_COLORS[u.role] || '#aaa';
              const initials = u.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);
              return (
                <div key={u._id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom:i<recent.length-1?'1px solid var(--border)':'none' }}>
                  <div style={{ width:32, height:32, borderRadius:9, background:`${color}20`, border:`1px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color, flexShrink:0 }}>{initials}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.name}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>{u.department||'—'} · {u.role?.replace(/_/g,' ')}</div>
                  </div>
                  <span style={{ padding:'2px 8px', borderRadius:12, background:u.isActive?'rgba(67,232,172,0.12)':'rgba(255,101,132,0.12)', color:u.isActive?'#43E8AC':'#FF6584', fontSize:10, fontWeight:700, flexShrink:0 }}>
                    {u.isActive?'Active':'Inactive'}
                  </span>
                </div>
              );
            })}
          </Card>
        </div>

        {/* Departments Overview */}
        <Card>
          <SectionHeader title="Departments Overview" subtitle={`${depts.length} departments · staff distribution`} />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
            {depts.slice(0,8).map((dept,i) => {
              const COLORS = ['#6C63FF','#43E8AC','#FFB547','#FF6584','#8B85FF','#38BDF8','#F472B6','#A78BFA'];
              const c = COLORS[i%COLORS.length];
              const dEmp = emp.filter(e=>e.department===dept.name).length;
              return (
                <div key={dept._id||i} style={{ padding:'14px 16px', background:'var(--bg-elevated)', borderRadius:12, borderLeft:`3px solid ${c}`, border:`1px solid ${c}20` }}>
                  <div style={{ fontSize:22, fontWeight:800, color:c }}>{dEmp}</div>
                  <div style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)', marginTop:2 }}>{dept.name}</div>
                  <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:2 }}>{dEmp} staff member{dEmp!==1?'s':''}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
