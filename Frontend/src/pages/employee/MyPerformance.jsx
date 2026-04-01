import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Card, SectionHeader, StatCard } from '../../components/UI';
import Loader from '../../components/Loader';
import { getAuthHeaders } from '../../services/api';

const apiFetch = async (path) => {
  const res = await fetch(path, { headers: getAuthHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

function Stars({ value, max = 5 }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} style={{ color: i < Math.round(value) ? '#FFB547' : '#dde0ed', fontSize: 16 }}>★</span>
      ))}
    </div>
  );
}

function MetricBar({ label, value, color = '#6C63FF', delay = 0 }) {
  const pct = Math.round((value / 5) * 100);
  const [animated, setAnimated] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setTimeout(() => setAnimated(true), delay);
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={ref} style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Stars value={value} />
          <span style={{ fontSize: 12, fontWeight: 700, color }}>{value}/5</span>
        </div>
      </div>
      <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: animated ? `${pct}%` : '0%',
          background: `linear-gradient(90deg, ${color}99, ${color})`,
          borderRadius: 3,
          transition: `width 1.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delay}ms`,
          boxShadow: animated ? `0 0 8px ${color}66` : 'none',
        }} />
      </div>
    </div>
  );
}

const PERIOD_COLORS = ['#6C63FF', '#43E8AC', '#FFB547', '#FF6584', '#8B85FF'];

export default function MyPerformance() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    apiFetch('/api/employee/performance')
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><Loader /></Layout>;

  return (
    <Layout>
      <div style={{ maxWidth: 900 }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 24, color: 'var(--role-color, #10b981)' }}>My Performance</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Your performance evaluations and ratings</p>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(255,101,132,0.1)', border: '1px solid rgba(255,101,132,0.25)', borderRadius: 10, marginBottom: 20, fontSize: 13, color: '#FF6584', display:'flex', alignItems:'center', gap:6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> {error}
          </div>
        )}

        {/* Averages */}
        {data?.averages && (data.reviews?.length > 0 || data.evaluations?.length > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
            <StatCard label="Avg Overall"     value={data.averages.overallRating?.toFixed(1)}  color="#FFB547" delay={0.05} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>} />
            <StatCard label="Task Completion" value={data.averages.taskCompletion?.toFixed(1)} color="#43E8AC" delay={0.08} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>} />
            <StatCard label="Teamwork"        value={data.averages.teamwork?.toFixed(1)}       color="#6C63FF" delay={0.11} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} />
            <StatCard label="Communication"   value={data.averages.communication?.toFixed(1)}  color="#FF6584" delay={0.14} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>} />
          </div>
        )}

        {/* Review Cards */}
        {!(data?.reviews?.length || data?.evaluations?.length) ? (
          <Card>
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
              <div style={{ marginBottom: 12, display:'flex', justifyContent:'center' }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" style={{color:'var(--text-muted)'}}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>No performance reviews yet</div>
              <div style={{ fontSize: 13 }}>Your manager or HR will add reviews here once evaluations are complete.</div>
            </div>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {(data.reviews || data.evaluations || []).map((r, idx) => {
              const c = PERIOD_COLORS[idx % PERIOD_COLORS.length];
              return (
                <Card key={r._id} style={{ position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: c }} />
                  <div style={{ paddingLeft: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div>
                        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
                          {r.reviewPeriod || r.reviewMonth || 'Performance Review'}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          Evaluated by {r.evaluatedBy?.name}
                          {r.createdAt && <> · {new Date(r.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' })}</>}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <Stars value={r.overallRating} />
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#FFB547', marginTop: 2 }}>{r.overallRating}/5</div>
                      </div>
                    </div>

                    <MetricBar label="Task Completion" value={r.taskCompletion}  color="#43E8AC" delay={0}   />
                    <MetricBar label="Teamwork"        value={r.teamwork}        color="#6C63FF" delay={200} />
                    <MetricBar label="Communication"   value={r.communication}   color="#FF6584" delay={400} />
                    <MetricBar label="Punctuality"     value={r.punctuality}     color="#FFB547" delay={600} />

                    {r.remarks && (
                      <div style={{
                        marginTop: 14, padding: '10px 14px',
                        background: `${c}08`, borderRadius: 8,
                        borderLeft: `3px solid ${c}`,
                        fontSize: 13, color: 'var(--text-secondary)', 
                      }}>
                        "{r.remarks}"
                      </div>
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
