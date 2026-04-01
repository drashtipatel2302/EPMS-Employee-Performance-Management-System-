import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Card, SectionHeader, Badge, Button, StatCard } from '../../components/UI';
import Loader from '../../components/Loader';
import api from '../../services/api';

export default function LeaveRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { api.getLeaveRequests().then(r => { setRequests(r); setLoading(false); }); }, []);
  if (loading) return <Layout><Loader /></Layout>;

  const handleAction = (id, action) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: action } : r));
  };

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  const TYPE_COLORS = { 'Sick Leave': '#FF6584', 'Casual Leave': '#FFB547', 'Annual Leave': '#6C63FF' };

  return (
    <Layout>
      <div style={{ maxWidth: 1000 }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--role-color)', margin: 0, letterSpacing: '-0.3px' }}>Leave Requests</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Approve or reject team leave applications</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          <StatCard label="Total Requests" value={requests.length} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>} color="#6C63FF" delay={0.05} />
          <StatCard label="Pending"        value={requests.filter(r => r.status === 'pending').length}  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} color="#FFB547" delay={0.10} />
          <StatCard label="Approved"       value={requests.filter(r => r.status === 'approved').length} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>} color="#43E8AC" delay={0.15} />
          <StatCard label="Rejected"       value={requests.filter(r => r.status === 'rejected').length} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>} color="#FF6584" delay={0.20} />
        </div>

        <Card>
          <SectionHeader title="All Requests" subtitle="Manage team leave applications" />

          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {['all','pending','approved','rejected'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                textTransform: 'capitalize',
                background: filter === f ? '#6C63FF' : 'var(--bg-elevated)',
                color: filter === f ? '#fff' : 'var(--text-secondary)',
                border: `1px solid ${filter === f ? '#6C63FF' : 'var(--border)'}`,
                transition: 'all 0.15s',
              }}>{f}</button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(r => (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '16px', borderRadius: 12,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                  background: `${TYPE_COLORS[r.type] || '#6C63FF'}18`,
                  border: `1px solid ${TYPE_COLORS[r.type] || '#6C63FF'}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: TYPE_COLORS[r.type] || '#6C63FF',
                }}>
                  {r.type === 'Sick Leave'
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                    : r.type === 'Annual Leave'
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  }
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>{r.employee}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {r.type} · {r.from} → {r.to} · <strong style={{ color: 'var(--text-secondary)' }}>{r.days} day{r.days > 1 ? 's' : ''}</strong>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2,  }}>"{r.reason}"</div>
                </div>

                <Badge status={r.status} />

                {r.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Button variant="success" size="sm" onClick={() => handleAction(r.id, 'approved')}>Approve</Button>
                    <Button variant="danger" size="sm" onClick={() => handleAction(r.id, 'rejected')}>Reject</Button>
                  </div>
                )}
                {r.status !== 'pending' && (
                  <Button variant="secondary" size="sm">View</Button>
                )}
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>No {filter} requests found.</div>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
