import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { StatCard, Card, SectionHeader, Badge, ProgressBar, Sparkline } from '../../components/UI';
import Loader from '../../components/Loader';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    Promise.all([api.getChartData(), api.getReviews()]).then(([c, r]) => {
      setData(c); setReviews(r);
    });
  }, []);

  if (!data) return <Layout><Loader /></Layout>;

  return (
    <Layout>
      <div style={{ maxWidth: 1100 }}>

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

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <StatCard label="Team Members"   value="8"    icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} color="#43E8AC" trend={0}  delay={0.05} />
          <StatCard label="Goals Assigned" value="24"   icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>} color="#6C63FF" trend={4}  delay={0.10} />
          <StatCard label="Pending Reviews" value="3"   icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>} color="#FFB547" trend={-1} delay={0.15} />
          <StatCard label="Team Avg Score" value="81%"  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>} color="#FF6584" trend={6}  delay={0.20} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Team performance */}
          <Card>
            <SectionHeader title="Team Performance Trend" subtitle="Last 6 months" />
            <Sparkline data={data.performance} color="#43E8AC" height={90} />
            <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
              {data.performance.map((d, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14, color: '#43E8AC' }}>{d.score}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{d.month}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Reviews */}
          <Card>
            <SectionHeader title="Recent Reviews" subtitle="Q4 cycle" />
            {reviews.map((r, i) => (
              <div key={r.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 0',
                borderBottom: i < reviews.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{r.employee}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.period}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {r.score && (
                    <span style={{ fontFamily: 'var(--font-body)', fontWeight: 500, color: '#43E8AC' }}>
                      ★ {r.score}
                    </span>
                  )}
                  <Badge status={r.status} />
                </div>
              </div>
            ))}
          </Card>

          {/* Action items */}
          <Card>
            <SectionHeader title="Action Items" subtitle="Needs your attention" />
            {[
              { text: 'Complete review for Morgan Lee', priority: 'high', due: 'Due today' },
              { text: 'Taylor Nguyen review overdue', priority: 'high', due: 'Overdue 3d' },
              { text: 'Set Q1 goals for team', priority: 'medium', due: 'Due Feb 28' },
              { text: 'Quarterly 1-on-1 meetings', priority: 'low', due: 'Due Mar 1' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, alignItems: 'center',
                padding: '10px 0', borderBottom: '1px solid var(--border)',
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: item.priority === 'high' ? '#FF6584' : item.priority === 'medium' ? '#FFB547' : '#43E8AC',
                }}/>
                <div style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)' }}>{item.text}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{item.due}</div>
              </div>
            ))}
          </Card>

          {/* Goal status */}
          <Card>
            <SectionHeader title="Team Goal Status" subtitle="Current quarter" />
            {data.goalCompletion.slice(0, 4).map((d, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Team Goal {i + 1}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{d.rate}%</span>
                </div>
                <ProgressBar value={d.rate} />
              </div>
            ))}
          </Card>
        </div>
      </div>
    </Layout>
  );
}
