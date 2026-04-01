import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Card, SectionHeader, Badge, StatCard } from '../../components/UI';
import Loader from '../../components/Loader';
import { getAuthHeaders } from '../../services/api';

const apiFetch = async (path) => {
  const res = await fetch(path, { headers: getAuthHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
      padding: '12px 20px', borderRadius: 12, fontWeight: 600, fontSize: 13,
      background: type === 'error' ? '#FF6584' : '#43E8AC', color: '#fff',
      boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    }}>
      {type === 'error' ? '⚠️' : '✅'} {msg}
    </div>
  );
}

const STATUS_COLOR = { PAID: '#43E8AC', APPROVED: '#6C63FF', PENDING: '#FFB547', PROCESSING: '#FFB547' };
const STATUS_BADGE = { PAID: 'approved', APPROVED: 'in-progress', PENDING: 'pending', PROCESSING: 'pending' };

export default function MySalarySlips() {
  const [slips, setSlips]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [toast, setToast]     = useState(null);

  useEffect(() => {
    apiFetch('/api/employee/salary-slips')
      .then(d => {
        const list = d.salaries || [];
        setSlips(list);
        if (list.length) setExpanded(list[0]._id);
      })
      .catch(e => setToast({ msg: e.message, type: 'error' }))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id) => setExpanded(p => p === id ? null : id);

  return (
    <Layout>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <div style={{ maxWidth: 800 }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 24, color: 'var(--role-color, #10b981)' }}>My Salary Slips</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>View your monthly payslips and earnings breakdown</p>
        </div>

        {!loading && slips.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
            <StatCard
              label="Total Slips"
              value={slips.length}
              color="#43E8AC"
              delay={0.05}
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
            />
            <StatCard
              label="Latest Net Pay"
              value={slips[0]?.netSalary ? `₹${slips[0].netSalary.toLocaleString()}` : '—'}
              color="#6C63FF"
              delay={0.10}
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
            />
            <StatCard
              label="Paid"
              value={slips.filter(s => s.status === 'PAID').length}
              color="#FFB547"
              delay={0.15}
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>}
            />
          </div>
        )}

        {loading ? <Loader /> : slips.length === 0 ? (
          <Card>
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', fontSize: 13 }}>
              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><span style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-muted)' }}>₹</span></div>
              No salary slips available yet. Contact HR for details.
            </div>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {slips.map(s => (
              <Card key={s._id}>
                {/* Header row */}
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => toggle(s._id)}
                >
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 10,
                      background: 'rgba(67,232,172,0.12)', border: '1px solid rgba(67,232,172,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                    }}><span style={{ fontSize: 18, fontWeight: 700, color: '#43E8AC', lineHeight: 1 }}>₹</span></div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                        {s.monthLabel || (s.month && s.year ? `${new Date(0, s.month - 1).toLocaleString('default', { month: 'long' })} ${s.year}` : s.month)}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Net: <strong style={{ color: '#43E8AC' }}>₹{(s.netSalary || 0).toLocaleString()}</strong>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                      background: `${STATUS_COLOR[s.status] || '#8B90A7'}18`,
                      color: STATUS_COLOR[s.status] || '#8B90A7',
                    }}>{s.status}</span>
                    <span style={{ fontSize: 18, color: 'var(--text-muted)', userSelect: 'none' }}>{expanded === s._id ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Expanded breakdown */}
                {expanded === s._id && (
                  <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)', animation: 'fadeIn 0.2s ease' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                      {/* Earnings */}
                      <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>💚 Earnings</div>
                        {[
                          ['Basic Salary',   s.basicSalary],
                          ['HRA',            s.hra],
                          ['Allowances',     s.allowances],
                          ['Bonus',          s.bonus],
                        ].filter(([, v]) => v).map(([label, val]) => (
                          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
                            <span style={{ fontSize: 13, fontWeight: 500, color: '#43E8AC' }}>₹{val.toLocaleString()}</span>
                          </div>
                        ))}
                        <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 6, marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Gross</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#43E8AC' }}>
                            ₹{((s.basicSalary || 0) + (s.hra || 0) + (s.allowances || 0) + (s.bonus || 0)).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Deductions */}
                      <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>🔴 Deductions</div>
                        {[
                          ['Tax (TDS)',     s.tax],
                          ['PF / Provident', s.providentFund],
                          ['Other',        s.otherDeductions],
                        ].filter(([, v]) => v).map(([label, val]) => (
                          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
                            <span style={{ fontSize: 13, fontWeight: 500, color: '#FF6584' }}>−₹{val.toLocaleString()}</span>
                          </div>
                        ))}
                        <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 6, marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Total Deducted</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#FF6584' }}>−₹{(s.deductions || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Net Take-Home */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: 16, background: 'rgba(67,232,172,0.06)',
                      borderRadius: 10, border: '1px solid rgba(67,232,172,0.18)', marginBottom: 14,
                    }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 15, fontWeight: 700, color: '#43E8AC' }}>₹</span> Net Take-Home</span>
                      <span style={{ fontSize: 24, fontWeight: 700, color: '#43E8AC' }}>₹{(s.netSalary || 0).toLocaleString()}</span>
                    </div>

                    {s.notes && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)',  marginBottom: 10 }}>Note: {s.notes}</div>
                    )}
                    {s.approvedBy && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>✓ Approved by: {s.approvedBy.name}</div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
