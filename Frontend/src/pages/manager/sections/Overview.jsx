import React, { useEffect, useState } from 'react'
import api from '../../../api/axios'
import { useAuth } from '../../../context/AuthContext'
import { KpiCard, Card, CardHeader, CardTitle, ProgressBar, Avatar, Chip, Btn, Spinner } from '../../../components/UI'
import styles from './sections.module.css'

export default function Overview({ onNavigate }) {
  const { user } = useAuth()
  const [employees, setEmployees] = useState([])
  const [tasks, setTasks]         = useState([])
  const [leaves, setLeaves]       = useState([])
  const [projects, setProjects]   = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/auth/employees').catch(() => ({ data: { employees: [] } })),
      api.get('/manager-tasks/my-assigned').catch(() => ({ data: [] })),
      api.get('/leave/team').catch(() => ({ data: [] })),
      api.get('/projects').catch(() => ({ data: [] })),
    ]).then(([empRes, taskRes, leaveRes, projRes]) => {
      setEmployees(empRes.data.employees || [])
      setTasks(Array.isArray(taskRes.data) ? taskRes.data : [])
      setLeaves(Array.isArray(leaveRes.data) ? leaveRes.data : [])
      setProjects(Array.isArray(projRes.data) ? projRes.data : [])
      setLoading(false)
    })
  }, [])

  if (loading) return <Spinner />

  const pendingLeaves   = leaves.filter(l => l.status === 'PENDING')
  const pendingTasks    = tasks.filter(t => t.status === 'PENDING')
  const completedTasks  = tasks.filter(t => t.status === 'COMPLETED')

  const progressColor = (p) => p >= 80 ? 'blue' : p >= 50 ? 'blue' : 'blue'

  return (
    <div className="page-enter">

      {/* Welcome Banner */}
      <div style={{ background:'linear-gradient(120deg,rgba(56,189,248,0.14) 0%,rgba(56,189,248,0.06) 100%)', border:'1px solid rgba(56,189,248,0.22)', borderRadius:16, padding:'22px 28px', marginBottom:22, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', right:24, top:'50%', transform:'translateY(-50%)', opacity:0.06, color:'#38BDF8' }}>
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="4" rx="1"/><rect x="2" y="18" width="6" height="4" rx="1"/><rect x="16" y="18" width="6" height="4" rx="1"/><path d="M12 6v4"/><path d="M5 18v-4h14v4"/></svg>
        </div>
        <div style={{ fontSize:11, fontWeight:700, color:'#0284c7', textTransform:'uppercase', letterSpacing:1.5, marginBottom:4 }}>MANAGER · TEAM LEAD</div>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:5 }}>
          <span style={{ fontSize:22, fontWeight:800, color:'var(--text-primary)' }}>{(()=>{ const h=new Date().getHours(); return h<12?'Good morning':h<17?'Good afternoon':'Good evening'; })()}, {user?.name?.split(' ')[0]}</span>
          <span style={{ width:28, height:28, borderRadius:7, background:'rgba(56,189,248,0.13)', border:'1px solid rgba(56,189,248,0.28)', display:'inline-flex', alignItems:'center', justifyContent:'center', color:'#0284c7', flexShrink:0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="4" rx="1"/><rect x="2" y="18" width="6" height="4" rx="1"/><rect x="16" y="18" width="6" height="4" rx="1"/><path d="M12 6v4"/><path d="M5 18v-4h14v4"/></svg>
          </span>
        </div>
        <div style={{ fontSize:13, color:'var(--text-secondary)' }}>You have full oversight of your team's performance.</div>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <KpiCard icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} value={employees.length} label="Team Members"    color="blue"   delta="Your department"        onClick={() => onNavigate('team')} />
        <KpiCard icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>} value={completedTasks.length} label="Tasks Completed" color="green" delta={`${tasks.length} total assigned`} onClick={() => onNavigate('tasks')} />
        <KpiCard icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} value={pendingTasks.length}  label="Pending Tasks"  color="warn"   delta="Awaiting action"        onClick={() => onNavigate('tasks')} />
        <KpiCard icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>} value={pendingLeaves.length} label="Leave Requests" color="red"    delta="Pending review"        onClick={() => onNavigate('leave')} />
        <KpiCard icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="4" rx="1"/><rect x="2" y="18" width="6" height="4" rx="1"/><rect x="16" y="18" width="6" height="4" rx="1"/><path d="M12 6v4"/><path d="M5 18v-4h14v4"/></svg>} value={projects.length}      label="Active Projects" color="purple" delta="Under your management"  onClick={() => onNavigate('projects')} />
        <KpiCard icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>} value={employees.length > 0 ? '4.2' : '—'} label="Avg. Performance" color="blue" delta="Last quarter"       onClick={() => onNavigate('reports')} />
      </div>

      <div className={styles.overviewGrid}>
        {/* Project Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Project Progress</CardTitle>
            <Btn variant="ghost" size="sm" onClick={() => onNavigate('projects')}>View All</Btn>
          </CardHeader>
          {projects.length === 0 && <p className={styles.empty}>No projects yet. <button className={styles.link} onClick={() => onNavigate('projects')}>Add one →</button></p>}
          {projects.slice(0, 5).map(p => (
            <div key={p._id} className={styles.projRow}>
              <div className={styles.projRowTop}>
                <span className={styles.projName}>{p.name}</span>
                <span className={styles.projPct} style={{ color: p.progress >= 80 ? '#0ea5e9' : p.progress >= 50 ? '#0ea5e9' : '#f59e0b' }}>{p.progress}%</span>
              </div>
              <ProgressBar value={p.progress} color={progressColor(p.progress)} />
            </div>
          ))}
        </Card>

        {/* Pending Leaves */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Leave Requests</CardTitle>
            <Btn variant="ghost" size="sm" onClick={() => onNavigate('leave')}>View All</Btn>
          </CardHeader>
          {pendingLeaves.length === 0 && <p className={styles.empty}>No pending requests.</p>}
          {pendingLeaves.slice(0, 4).map(l => (
            <div key={l._id} className={styles.leaveRow}>
              <Avatar name={l.employee?.name || '?'} size="sm" />
              <div className={styles.leaveInfo}>
                <div className={styles.leaveName}>{l.employee?.name}</div>
                <div className={styles.leaveMeta}>{l.leaveType} · {l.totalDays} days · {new Date(l.fromDate).toLocaleDateString('en-IN')}</div>
              </div>
              <Chip color="warn">Pending</Chip>
            </div>
          ))}
        </Card>
      </div>

      {/* Team Quick View */}
      {employees.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Team at a Glance</CardTitle>
            <Btn variant="ghost" size="sm" onClick={() => onNavigate('team')}>View All Members</Btn>
          </CardHeader>
          <div className={styles.teamGlance}>
            {employees.slice(0, 6).map(e => (
              <div key={e._id} className={styles.glanceCard}>
                <Avatar name={e.name} size="md" />
                <div className={styles.glanceName}>{e.name}</div>
                <div className={styles.glanceRole}>{e.designation || e.role}</div>
                <Chip color={e.isActive ? 'green' : 'gray'}>{e.isActive ? 'Active' : 'Inactive'}</Chip>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
