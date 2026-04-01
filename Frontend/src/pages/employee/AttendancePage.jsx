import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import { Card, SectionHeader, StatCard } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';
import { getTodayAttendance, getMyAttendance } from '../../services/attendanceApi';

const STATUS_COLOR = { PRESENT: '#43E8AC', LATE: '#FFB547', ABSENT: '#FF6584', HALF_DAY: '#6C63FF' };
const STATUS_BG    = { PRESENT: 'rgba(67,232,172,0.15)', LATE: 'rgba(255,181,71,0.15)', ABSENT: 'rgba(255,101,132,0.15)', HALF_DAY: 'rgba(108,99,255,0.15)' };
const STATUS_ICON  = {
  PRESENT:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  LATE:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  ABSENT:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  HALF_DAY: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
};

function fmtTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}
function fmtDate(s) {
  if (!s) return '';
  const [y, m, d] = s.split('-');
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  return (
    <div style={{ fontFamily: 'monospace', fontSize: 38, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: 3 }}>
      {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
    </div>
  );
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const YEARS  = [2023, 2024, 2025, 2026];

export default function AttendancePage() {
  const { user } = useAuth();
  const [today,   setToday]   = useState(null);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [month,   setMonth]   = useState(new Date().getMonth() + 1);
  const [year,    setYear]    = useState(new Date().getFullYear());

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [todayRes, histRes] = await Promise.all([
        getTodayAttendance(),
        getMyAttendance(month, year),
      ]);
      setToday(todayRes.today);
      setRecords(histRes.records || []);
      setSummary(histRes.summary || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { loadData(); }, [loadData]);

  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <Layout>
      <div style={{ maxWidth: 1100 }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 24, color: 'var(--role-color, #10b981)', margin: 0, letterSpacing: '-0.5px' }}>My Attendance</h2>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Attendance is recorded automatically when you login and logout</div>
        </div>

        {/* Info banner */}
        <div style={{
          background: 'linear-gradient(120deg, rgba(108,99,255,0.15) 0%, rgba(67,232,172,0.08) 100%)',
          border: '1px solid rgba(108,99,255,0.25)',
          borderRadius: 14, padding: '14px 20px', marginBottom: 22,
          display: 'flex', alignItems: 'center', gap: 12, fontSize: 14,
          color: 'var(--text-secondary)',
        }}>
          <span style={{ color: '#6C63FF', flexShrink: 0 }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="15" x2="8" y2="15"/><line x1="16" y1="15" x2="16" y2="15"/></svg></span>
          <span>
            Your attendance is <strong style={{ color: 'var(--text-primary)' }}>automatically recorded</strong> —
            login time is captured when you sign in, and logout time when you sign out.
            No manual action needed.
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 22 }}>
          {/* Live Clock */}
          <Card style={{ padding: '28px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>{todayFormatted}</div>
            <LiveClock />
            <div style={{ marginTop: 14, fontSize: 13, color: 'var(--text-muted)' }}>
              {today?.loginTime
                ? `Login recorded at ${fmtTime(today.loginTime)}`
                : 'Logged in — attendance has been recorded ✅'}
            </div>
          </Card>

          {/* Today's Status */}
          <Card style={{ padding: '26px 24px' }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, color: 'var(--text-primary)' }}>
              Today's Status
            </div>
            {loading ? (
              <div style={{ color: 'var(--text-secondary)' }}>Loading…</div>
            ) : today ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <span style={{ color: STATUS_COLOR[today.status], display: 'flex' }}>{STATUS_ICON[today.status] || <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}</span>
                  <span style={{
                    padding: '5px 16px', borderRadius: 20, fontWeight: 700, fontSize: 14,
                    background: STATUS_BG[today.status], color: STATUS_COLOR[today.status],
                  }}>
                    {today.status}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Login Time',   value: fmtTime(today.loginTime),  icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#43E8AC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
                    { label: 'Logout Time',  value: fmtTime(today.logoutTime), icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FF6584" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> },
                    { label: 'Hours Worked', value: today.hoursWorked ? `${today.hoursWorked} hrs` : today.logoutTime ? `${today.hoursWorked} hrs` : 'In progress…', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6C63FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
                    { label: 'Date',         value: fmtDate(today.date),       icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFB547" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
                  ].map(({ label, value, icon }) => (
                    <div key={label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-secondary)', marginBottom: 3 }}>{icon} {label}</div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{value}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', paddingTop: 16, color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: 36 }}>⏰</div>
                <div style={{ marginTop: 8 }}>No attendance record yet for today.</div>
              </div>
            )}
          </Card>
        </div>

        {/* Monthly Summary */}
        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 22 }}>
            <StatCard label="Present"   value={summary.present}         color="#43E8AC" delay={0.05} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>} />
            <StatCard label="Late"      value={summary.late}            color="#FFB547" delay={0.08} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} />
            <StatCard label="Absent"    value={summary.absent}          color="#FF6584" delay={0.11} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>} />
            <StatCard label="Half Day"  value={summary.halfDay}         color="#6C63FF" delay={0.14} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>} />
            <StatCard label="Total Hrs" value={`${summary.totalHours}h`} color="#43E8AC" delay={0.17} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} />
          </div>
        )}

        {/* Attendance History */}
        <Card>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Attendance History</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <select value={month} onChange={e => setMonth(Number(e.target.value))} style={selStyle}>
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
              <select value={year} onChange={e => setYear(Number(e.target.value))} style={selStyle}>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Date', 'Login Time', 'Logout Time', 'Hours Worked', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '11px 18px', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Loading…</td></tr>
                ) : records.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>No records found for this period.</td></tr>
                ) : records.map(r => (
                  <tr key={r._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={tdStyle}>{fmtDate(r.date)}</td>
                    <td style={{ ...tdStyle, color: '#43E8AC', fontWeight: 600 }}>{fmtTime(r.loginTime)}</td>
                    <td style={{ ...tdStyle, color: '#FF6584', fontWeight: 600 }}>{fmtTime(r.logoutTime)}</td>
                    <td style={tdStyle}>{r.hoursWorked ? `${r.hoursWorked} hrs` : r.logoutTime ? '0 hrs' : '—'}</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                        background: STATUS_BG[r.status] || 'rgba(255,255,255,0.08)',
                        color: STATUS_COLOR[r.status] || '#fff',
                      }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, verticalAlign: 'middle' }}>{STATUS_ICON[r.status]} {r.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Layout>
  );
}

const tdStyle    = { padding: '13px 18px', fontSize: 13, color: 'var(--text-primary)' };
const selStyle   = {
  padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.06)', color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer',
};
