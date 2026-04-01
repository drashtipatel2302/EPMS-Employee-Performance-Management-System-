import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { StatCard, Card, SectionHeader, Badge } from '../../components/UI';
import Loader from '../../components/Loader';
import { getAuthHeaders } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const apiFetch = async (path) => {
  const res = await fetch(path, { headers: getAuthHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

function StarRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
      <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
        {[1,2,3,4,5].map(n => (
          <span key={n} style={{ color: n <= Math.round(value) ? '#FFB547' : '#e2e5ef', fontSize: 14 }}>★</span>
        ))}
        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>{value}/5</span>
      </div>
    </div>
  );
}

export default function EmployeeDashboard() {
  const { user, updateUser } = useAuth();
  const [dash, setDash] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    // Fetch dashboard data
    apiFetch('/api/employee/dashboard')
      .then(setDash)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));

    // Sync designation/department from live profile so greeting shows latest data
    apiFetch('/api/employee/profile')
      .then(u => updateUser({ name: u.name, designation: u.designation, department: u.department }))
      .catch(() => {});
  }, []);

  if (loading) return <Layout><Loader /></Layout>;

  if (error) return (
    <Layout>
      <div style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Could not load dashboard</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{error}</div>
      </div>
    </Layout>
  );

  const { taskSummary, leaveSummary, attendanceSummary, latestPerformance, todayAttendance, recentTasks } = dash;
  const fmtTime = d => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
  const normStatus = s => ({ IN_PROGRESS: 'in-progress', PENDING: 'pending', COMPLETED: 'completed', HIGH: 'high', MEDIUM: 'medium', LOW: 'low' }[s] || s?.toLowerCase());

  return (
    <Layout>
      <div style={{ maxWidth: 1100 }}>

        {/* ── Greeting Banner ── */}
        <div style={{
          background: 'linear-gradient(120deg, rgba(108,99,255,0.15) 0%, rgba(255,181,71,0.08) 100%)',
          border: '1px solid rgba(108,99,255,0.18)',
          borderRadius: 'var(--r-xl)', padding: '22px 28px',
          marginBottom: 24, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: 28, top: '50%', transform: 'translateY(-50%)', opacity: 0.06, color:'#059669' }}>
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 22, color: 'var(--text-primary)' }}>
            <span>{greeting()}, {user?.name?.split(' ')[0]}</span>
            <span style={{ width:28, height:28, borderRadius:7, background:'rgba(67,232,172,0.13)', border:'1px solid rgba(67,232,172,0.28)', display:'inline-flex', alignItems:'center', justifyContent:'center', color:'#059669', flexShrink:0 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            {user?.designation && <><strong style={{ color: 'var(--accent)' }}>{user.designation}</strong> · </>}
            {user?.department} Department
          </div>

          {todayAttendance && (
            <div style={{
              marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 10,
              background: 'rgba(255,255,255,0.6)', borderRadius: 30,
              padding: '6px 16px', border: '1px solid rgba(108,99,255,0.12)',
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#43E8AC', display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Logged in at <strong style={{ color: 'var(--text-primary)' }}>{fmtTime(todayAttendance.loginTime)}</strong>
                {todayAttendance.logoutTime
                  ? <> · out at <strong style={{ color: 'var(--text-primary)' }}>{fmtTime(todayAttendance.logoutTime)}</strong></>
                  : <span style={{ color: '#43E8AC' }}> · Active</span>}
              </span>
              <span style={{
                padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: todayAttendance.status === 'PRESENT' ? 'rgba(67,232,172,0.18)' : todayAttendance.status === 'LATE' ? 'rgba(255,181,71,0.18)' : 'rgba(255,101,132,0.18)',
                color:      todayAttendance.status === 'PRESENT' ? '#43E8AC'               : todayAttendance.status === 'LATE' ? '#FFB547'               : '#FF6584',
              }}>{todayAttendance.status}</span>
            </div>
          )}
        </div>

        {/* ── Stats Row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <StatCard label="Total Tasks"     value={taskSummary.total}       icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>} color="#6C63FF" delay={0.05} />
          <StatCard label="In Progress"     value={taskSummary.inProgress}  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>} color="#FFB547" delay={0.10} />
          <StatCard label="Completed"       value={taskSummary.completed}   icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>} color="#43E8AC" delay={0.15} />
          <StatCard label="Leaves Pending"  value={leaveSummary.pending}    icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>} color="#FF6584" delay={0.20} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 16 }}>
          {/* Recent Tasks */}
          <Card>
            <SectionHeader title="Recent Tasks" subtitle="Your latest assigned work" />
            {recentTasks?.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recentTasks.map(t => (
                  <div key={t._id} style={{
                    padding: '12px 14px', background: 'var(--bg-elevated)',
                    borderRadius: 'var(--r-md)', border: '1px solid var(--border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        By {t.assignedBy?.name} · Due {t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-IN') : '—'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                      <Badge status={normStatus(t.priority)} />
                      <Badge status={normStatus(t.status)} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>No tasks assigned yet.</div>
            )}
          </Card>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Attendance Summary */}
            <Card>
              <SectionHeader title="This Month" subtitle="Attendance summary" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Present',   value: attendanceSummary.present,          color: '#43E8AC', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> },
                  { label: 'Late',      value: attendanceSummary.late,             color: '#FFB547', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
                  { label: 'Half Day',  value: attendanceSummary.halfDay,          color: '#6C63FF', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> },
                  { label: 'Total Hrs', value: `${attendanceSummary.totalHours}h`, color: '#43E8AC', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', color: s.color, marginBottom: 4 }}>{s.icon}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Latest Performance */}
            <Card>
              <SectionHeader title="Latest Review" subtitle="Your performance rating" />
              {latestPerformance ? (
                <>
                  <StarRow label="Overall"        value={latestPerformance.overallRating}  />
                  <StarRow label="Task Completion" value={latestPerformance.taskCompletion} />
                  <StarRow label="Teamwork"        value={latestPerformance.teamwork}       />
                  <StarRow label="Communication"   value={latestPerformance.communication}  />
                  {latestPerformance.remarks && (
                    <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(108,99,255,0.06)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)',  borderLeft: '2px solid var(--accent)' }}>
                      "{latestPerformance.remarks}"
                    </div>
                  )}
                  <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>By {latestPerformance.evaluatedBy?.name} · {latestPerformance.reviewMonth || latestPerformance.reviewPeriod}</div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>No reviews yet.</div>
              )}
            </Card>
          </div>
        </div>

        {/* Leave Summary Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {[
            { label: 'Approved Leaves',  value: leaveSummary.approved, color: '#43E8AC', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> },
            { label: 'Pending Requests', value: leaveSummary.pending,  color: '#FFB547', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
            { label: 'Rejected',         value: leaveSummary.rejected, color: '#FF6584', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--bg-surface)', border: `1px solid ${s.color}30`,
              borderRadius: 'var(--r-md)', padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: 14,
              borderLeft: `4px solid ${s.color}`,
            }}>
              <span style={{ color: s.color, flexShrink: 0 }}>{s.icon}</span>
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: 26, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </Layout>
  );
}
