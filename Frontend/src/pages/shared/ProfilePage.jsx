import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactDOM from 'react-dom';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';

const apiFetch = async (path, method = 'GET', body = null) => {
  const token = localStorage.getItem('epms_token');
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

const ROLE_THEMES = {
  admin:    { label: 'Super Admin',   color: '#6C63FF', dark: '#4f46e5',  g: 'linear-gradient(135deg,#4f46e5,#6C63FF,#8B85FF)', bg: '#f5f3ff', bc: '#ede9fe' },
  manager:  { label: 'Manager',       color: '#0284c7', dark: '#0369a1',  g: 'linear-gradient(135deg,#0369a1,#0284c7,#0ea5e9)', bg: '#f0f9ff', bc: '#e0f2fe' },
  hr:       { label: 'HR Specialist', color: '#e11d48', dark: '#be123c',  g: 'linear-gradient(135deg,#be123c,#e11d48,#f43f5e)', bg: '#fff1f2', bc: '#ffe4e6' },
  employee: { label: 'Employee',      color: '#059669', dark: '#047857',  g: 'linear-gradient(135deg,#047857,#059669,#10b981)', bg: '#f0fdf4', bc: '#dcfce7' },
};

const ROLE_TO_KEY = {
  'SUPER_ADMIN':'admin','ADMIN':'admin','admin':'admin',
  'MANAGER':'manager','manager':'manager',
  'EMPLOYEE':'employee','employee':'employee',
  'HR':'hr','hr':'hr',
};

const IC = {
  edit:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  lock:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  check:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  user:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  home:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  doc:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  badge:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
  cal:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  clock:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  tick:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  brief:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
  email:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  dept:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>,
};

function Field({ label, value, editing, onChange, placeholder='', readOnly=false, theme }) {
  const c = theme.color;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      <label style={{ fontSize:10, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase', color: c }}>{label}</label>
      {editing && !readOnly ? (
        <input value={value||''} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
          style={{ padding:'10px 14px', background:`${c}07`, border:`1.5px solid ${c}30`, borderRadius:8, color:'var(--text-primary)', fontSize:13, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'inherit', transition:'all 0.2s' }}
          onFocus={e=>{ e.target.style.borderColor=c; e.target.style.boxShadow=`0 0 0 3px ${c}18`; }}
          onBlur={e=>{ e.target.style.borderColor=`${c}30`; e.target.style.boxShadow='none'; }}
        />
      ) : (
        <div style={{ padding:'10px 14px', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:8, fontSize:13, color:value?'var(--text-primary)':'var(--text-muted)' }}>
          {value||'—'}
        </div>
      )}
    </div>
  );
}

function SecCard({ children, theme, delay='0s' }) {
  return (
    <div style={{ background:'var(--bg-surface)', border:'1px solid var(--border)', borderTop:`3px solid ${theme.color}`, borderRadius:12, overflow:'hidden', boxShadow:'0 1px 8px rgba(0,0,0,0.05)', animation:'profFadeUp 0.4s ease both', animationDelay:delay }}>
      {children}
    </div>
  );
}

function SecHead({ icon, title, sub, theme }) {
  return (
    <div style={{ padding:'16px 22px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:11 }}>
      <div style={{ width:32, height:32, borderRadius:8, background:theme.g, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:`0 3px 8px ${theme.color}30` }}>{icon}</div>
      <div>
        <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>{title}</div>
        <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:1 }}>{sub}</div>
      </div>
    </div>
  );
}

function StatBox({ label, value, icon, theme, last=false }) {
  return (
    <div style={{ flex:1, padding:'13px 16px', borderRight: last ? 'none' : '1px solid var(--border)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:4 }}>
        <span style={{ color:theme.color, opacity:0.7, display:'flex' }}>{icon}</span>
        <span style={{ fontSize:10, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:'var(--text-muted)' }}>{label}</span>
      </div>
      <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>{value||'—'}</div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile]       = useState(null);
  const [form, setForm]             = useState({});
  const [editing, setEditing]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [loading, setLoading]       = useState(true);
  const [toast, setToast]           = useState(null);
  const [promoNotif, setPromoNotif] = useState(null);
  const [mounted, setMounted]       = useState(false);

  const roleKey = ROLE_TO_KEY[user?.role] || 'employee';
  const T = ROLE_THEMES[roleKey];

  const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };

  useEffect(() => {
    setTimeout(()=>setMounted(true), 40);
    apiFetch('/api/employee/profile')
      .then(u => {
        setProfile(u);
        setForm({ name:u.name||'', phone:u.phone||'', address:u.address||'', emergencyContact:u.emergencyContact||'', bio:u.bio||'' });
        updateUser({ name:u.name, designation:u.designation, department:u.department });
      })
      .catch(e=>showToast(e.message,'error'))
      .finally(()=>setLoading(false));
    const token = localStorage.getItem('epms_token');
    if (token) {
      fetch('/api/notifications?limit=10',{ headers:{ Authorization:`Bearer ${token}` } })
        .then(r=>r.json())
        .then(data=>{
          const n=(data.notifications||[]).find(n=>n.type==='PROMOTION_APPROVED'&&!n.isRead&&(Date.now()-new Date(n.createdAt).getTime())<7*24*60*60*1000);
          if(n) setPromoNotif(n);
        }).catch(()=>{});
    }
  }, []);

  const dismissPromo = async () => {
    const token = localStorage.getItem('epms_token');
    try { await fetch(`/api/notifications/${promoNotif._id}/read`,{ method:'PUT', headers:{ Authorization:`Bearer ${token}` } }); } catch {}
    setPromoNotif(null);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await apiFetch('/api/employee/profile','PUT',form);
      const u2 = res.user||res;
      setProfile(u2); setEditing(false);
      updateUser({ name:u2.name });
      showToast('Profile updated successfully.');
    } catch(e) { showToast(e.message,'error'); }
    setSaving(false);
  };

  if (loading) return (
    <Layout>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:280, gap:10 }}>
        <div style={{ width:18, height:18, borderRadius:'50%', border:`2.5px solid ${T.color}25`, borderTopColor:T.color, animation:'profSpin 0.75s linear infinite' }} />
        <span style={{ fontSize:13, color:'var(--text-muted)' }}>Loading profile…</span>
        <style>{`@keyframes profSpin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </Layout>
  );

  const u = profile;
  const initials    = u?.name?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)||'U';
  const joinDate    = u?.joiningDate ? new Date(u.joiningDate).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : null;
  const monthsWorked = u?.joiningDate ? Math.floor((Date.now()-new Date(u.joiningDate))/(1000*60*60*24*30)) : null;

  return (
    <Layout>
      <style>{`
        @keyframes profFadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes profSpin   { to{transform:rotate(360deg)} }
        @keyframes profBlink  { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .pf-btn { transition:opacity 0.15s,transform 0.15s !important; cursor:pointer; }
        .pf-btn:hover:not(:disabled) { opacity:0.86; transform:translateY(-1px) !important; }
      `}</style>

      {/* Toast */}
      {toast && ReactDOM.createPortal(
        <div style={{ position:'fixed', top:20, right:24, zIndex:9999, padding:'11px 18px', borderRadius:8, fontSize:13, fontWeight:600, background:toast.type==='error'?'#fff1f2':'#f6fef9', color:toast.type==='error'?'#be123c':'#166534', border:`1px solid ${toast.type==='error'?'#fecdd3':'#bbf7d0'}`, boxShadow:'0 4px 20px rgba(0,0,0,0.10)', display:'flex', alignItems:'center', gap:8, animation:'profFadeUp 0.25s ease both' }}>
          {toast.type==='error'
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          }
          {toast.msg}
        </div>,
        document.body
      )}

      <div style={{ maxWidth:820, margin:'0 auto', display:'flex', flexDirection:'column', gap:14, opacity:mounted?1:0, transition:'opacity 0.25s' }}>

        {/* Promo banner */}
        {promoNotif && (
          <div style={{ background:'#f6fef9', border:'1px solid #86efac', borderLeft:`4px solid #16a34a`, borderRadius:8, padding:'13px 18px', display:'flex', alignItems:'flex-start', gap:12, animation:'profFadeUp 0.4s ease both' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" style={{ flexShrink:0, marginTop:1 }}><polyline points="20 6 9 17 4 12"/></svg>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:13, color:'#14532d' }}>{promoNotif.title}</div>
              <div style={{ fontSize:12, color:'#166534', marginTop:2, lineHeight:1.5 }}>{promoNotif.message}</div>
            </div>
            <button onClick={dismissPromo} style={{ background:'none', border:'none', color:'#86efac', cursor:'pointer', fontSize:18, lineHeight:1, padding:2 }}>×</button>
          </div>
        )}

        {/* ── HERO CARD ── */}
        <div style={{ background:'var(--bg-surface)', border:`1px solid ${T.color}30`, borderRadius:12, overflow:'hidden', boxShadow:`0 4px 20px ${T.color}15`, animation:'profFadeUp 0.4s ease both' }}>

          {/* Coloured hero header */}
          <div style={{ background:T.g, padding:'28px 28px 24px', position:'relative', overflow:'hidden' }}>
            {/* Decorative circles */}
            <div style={{ position:'absolute', top:-30, right:-30, width:130, height:130, borderRadius:'50%', background:'rgba(255,255,255,0.08)', pointerEvents:'none' }} />
            <div style={{ position:'absolute', bottom:-40, right:60, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.06)', pointerEvents:'none' }} />

          {/* Header row */}
          <div style={{ display:'flex', alignItems:'flex-start', gap:20, position:'relative', zIndex:1 }}>
            {/* Avatar with active dot */}
            <div style={{ position:'relative', flexShrink:0 }}>
              <div style={{ width:76, height:76, borderRadius:16, background:'rgba(255,255,255,0.22)', backdropFilter:'blur(8px)', border:'2px solid rgba(255,255,255,0.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, fontWeight:800, color:'#fff', letterSpacing:-1 }}>
                {initials}
              </div>
              <div style={{ position:'absolute', bottom:3, right:3, width:13, height:13, borderRadius:'50%', background:u?.isActive?'#4ade80':'#94a3b8', border:'2.5px solid rgba(255,255,255,0.7)' }} />
            </div>

            {/* Name / meta */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:9, flexWrap:'wrap', marginBottom:6 }}>
                <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', margin:0, letterSpacing:-0.4, textShadow:'0 1px 4px rgba(0,0,0,0.15)' }}>{u?.name}</h1>
                <span style={{ fontSize:10, fontWeight:800, letterSpacing:1.1, textTransform:'uppercase', color:'#fff', background:'rgba(255,255,255,0.2)', border:'1px solid rgba(255,255,255,0.35)', padding:'3px 9px', borderRadius:4 }}>
                  {T.label}
                </span>
                {promoNotif && (
                  <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, color:'#fff', background:'rgba(74,222,128,0.35)', border:'1px solid rgba(74,222,128,0.6)', padding:'3px 8px', borderRadius:4 }}>Promoted</span>
                )}
              </div>

              <div style={{ display:'flex', flexWrap:'wrap', gap:'5px 14px', marginBottom:16 }}>
                {u?.designation && <span style={{ fontSize:12, color:'rgba(255,255,255,0.85)', display:'flex', alignItems:'center', gap:4 }}>{IC.brief}{u.designation}</span>}
                {u?.department  && <span style={{ fontSize:12, color:'rgba(255,255,255,0.85)', display:'flex', alignItems:'center', gap:4 }}>{IC.dept}{u.department}</span>}
                {u?.email       && <span style={{ fontSize:12, color:'rgba(255,255,255,0.85)', display:'flex', alignItems:'center', gap:4 }}>{IC.email}{u.email}</span>}
              </div>

              {/* Action buttons */}
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {!editing ? (
                  <button className="pf-btn" onClick={()=>setEditing(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 18px', borderRadius:7, border:'none', background:'rgba(255,255,255,0.95)', color:T.dark, fontSize:12, fontWeight:700, boxShadow:'0 2px 8px rgba(0,0,0,0.15)' }}>
                    {IC.edit} Edit Profile
                  </button>
                ) : (
                  <>
                    <button className="pf-btn" onClick={save} disabled={saving} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 18px', borderRadius:7, border:'none', background:'rgba(255,255,255,0.95)', color:T.dark, fontSize:12, fontWeight:700, boxShadow:'0 2px 8px rgba(0,0,0,0.15)' }}>
                      {saving ? <div style={{ width:12,height:12,borderRadius:'50%',border:`2px solid ${T.dark}40`,borderTopColor:T.dark,animation:'profSpin 0.7s linear infinite' }}/> : IC.check}
                      {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                    <button className="pf-btn" onClick={()=>setEditing(false)} style={{ padding:'8px 18px', borderRadius:7, border:'1px solid rgba(255,255,255,0.4)', background:'rgba(255,255,255,0.12)', color:'#fff', fontSize:12, fontWeight:600 }}>
                      Cancel
                    </button>
                  </>
                )}
                <button className="pf-btn" onClick={()=>navigate('/change-password')} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 18px', borderRadius:7, border:'1px solid rgba(255,255,255,0.4)', background:'rgba(255,255,255,0.12)', color:'#fff', fontSize:12, fontWeight:600 }}>
                  {IC.lock} Change Password
                </button>
              </div>
            </div>
          </div>
          </div>{/* end colored hero */}

          {/* Stats strip */}
          <div style={{ borderTop:`1px solid ${T.color}20`, display:'flex', background:`${T.color}06` }}>
            {u?.employeeId    && <StatBox label="Employee ID" value={u.employeeId}              icon={IC.badge} theme={T} />}
            {joinDate         && <StatBox label="Joined"      value={joinDate}                  icon={IC.cal}   theme={T} />}
            {monthsWorked!==null && <StatBox label="Tenure"   value={`${monthsWorked} months`}  icon={IC.clock} theme={T} />}
            <StatBox label="Status" value={u?.isActive?'Active':'Inactive'} icon={IC.tick} theme={T} last />
          </div>

          {/* Editing indicator */}
          {editing && (
            <div style={{ borderTop:`1px solid ${T.color}20`, background:`${T.color}06`, padding:'8px 22px', display:'flex', alignItems:'center', gap:7 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:T.color, animation:'profBlink 1.4s infinite' }} />
              <span style={{ fontSize:11, fontWeight:600, color:T.color }}>Editing mode — changes are not saved yet</span>
            </div>
          )}
        </div>

        {/* ── PERSONAL INFO ── */}
        <SecCard theme={T} delay="0.05s">
          <SecHead icon={IC.user} title="Personal Information" sub="Core identity and contact details" theme={T} />
          <div style={{ padding:'20px 22px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:15 }}>
            <Field label="Full Name"    value={editing?form.name:u?.name}  editing={editing} onChange={v=>setForm(f=>({...f,name:v}))}  placeholder="Your full name"   theme={T} />
            <Field label="Email Address" value={u?.email}                  editing={false}   readOnly                                     theme={T} />
            <Field label="Phone Number" value={editing?form.phone:u?.phone} editing={editing} onChange={v=>setForm(f=>({...f,phone:v}))} placeholder="+91 00000 00000" theme={T} />
            <Field label="Employee ID"  value={u?.employeeId}              editing={false}   readOnly                                     theme={T} />
            <Field label="Department"   value={u?.department}              editing={false}   readOnly                                     theme={T} />
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:10, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase', color:T.color }}>Designation</label>
              <div style={{ padding:'10px 14px', background:'var(--bg-elevated)', border:promoNotif?'1.5px solid #86efac':'1px solid var(--border)', borderRadius:8, fontSize:13, color:'var(--text-primary)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ color:promoNotif?'#166534':'inherit', fontWeight:promoNotif?600:400 }}>{u?.designation||'—'}</span>
                {promoNotif && <span style={{ fontSize:9, fontWeight:800, letterSpacing:1, textTransform:'uppercase', background:'#dcfce7', color:'#166534', border:'1px solid #86efac', padding:'2px 7px', borderRadius:3 }}>Updated</span>}
              </div>
            </div>
            {joinDate && <Field label="Joining Date" value={joinDate} editing={false} readOnly theme={T} />}
            <Field label="Status" value={u?.isActive?'Active':'Inactive'} editing={false} readOnly theme={T} />
          </div>
        </SecCard>

        {/* ── ADDRESS & BIO ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <SecCard theme={T} delay="0.10s">
            <SecHead icon={IC.home} title="Address & Emergency" sub="Location and emergency contact" theme={T} />
            <div style={{ padding:'18px 22px', display:'flex', flexDirection:'column', gap:14 }}>
              <Field label="Address"           value={editing?form.address:u?.address}                  editing={editing} onChange={v=>setForm(f=>({...f,address:v}))}          placeholder="Street, City, State" theme={T} />
              <Field label="Emergency Contact" value={editing?form.emergencyContact:u?.emergencyContact} editing={editing} onChange={v=>setForm(f=>({...f,emergencyContact:v}))} placeholder="+91 00000 00000"     theme={T} />
            </div>
          </SecCard>

          <SecCard theme={T} delay="0.12s">
            <SecHead icon={IC.doc} title="About Me" sub="Professional bio and notes" theme={T} />
            <div style={{ padding:'18px 22px' }}>
              <label style={{ fontSize:10, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase', color:T.color, display:'block', marginBottom:8 }}>Bio</label>
              {editing ? (
                <textarea value={form.bio||''} onChange={e=>setForm(f=>({...f,bio:e.target.value}))} placeholder="A brief professional summary…" rows={5}
                  style={{ width:'100%', padding:'10px 14px', background:`${T.color}07`, border:`1.5px solid ${T.color}28`, borderRadius:8, color:'var(--text-primary)', fontSize:13, outline:'none', resize:'vertical', boxSizing:'border-box', fontFamily:'inherit', lineHeight:1.65, transition:'all 0.2s' }}
                  onFocus={e=>{ e.target.style.borderColor=T.color; e.target.style.boxShadow=`0 0 0 3px ${T.color}18`; }}
                  onBlur={e=>{ e.target.style.borderColor=`${T.color}28`; e.target.style.boxShadow='none'; }}
                />
              ) : (
                <div style={{ padding:'10px 14px', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:8, fontSize:13, color:u?.bio?'var(--text-primary)':'var(--text-muted)', fontStyle:u?.bio?'normal':'italic', minHeight:90, lineHeight:1.7 }}>
                  {u?.bio||'No bio added yet.'}
                </div>
              )}
            </div>
          </SecCard>
        </div>

      </div>
    </Layout>
  );
}
