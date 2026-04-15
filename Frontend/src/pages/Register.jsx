import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Lock, ArrowRight, ShieldCheck, IdCard, Check,
  Send, Eye, EyeOff, Phone, Briefcase, UploadCloud, FileText, X,
} from 'lucide-react';
import { registerUser } from '../lib/api';

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  padding: '0.85rem 1rem 0.85rem 2.75rem',
  color: '#e2e8f0',
  fontSize: '0.875rem',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const inputNoIconStyle = {
  ...inputStyle,
  paddingLeft: '1rem',
};

const labelStyle = {
  display: 'block',
  fontSize: '0.58rem',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.18em',
  color: '#475569',
  marginBottom: '0.45rem',
};

const OCCUPATION_SECTORS = [
  'Information Technology',
  'Finance & Banking',
  'Healthcare',
  'Education',
  'Legal',
  'Manufacturing',
  'Retail & E-commerce',
  'Media & Entertainment',
  'Real Estate',
  'Logistics & Supply Chain',
  'Consulting',
  'Government & Public Sector',
  'Non-Profit',
  'Freelance / Independent',
  'Others',
];

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ position: 'relative' }}>
        {Icon && <Icon style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#334155', width: '15px', height: '15px', zIndex: 1 }} />}
        {children}
      </div>
    </div>
  );
}

const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2 MB

const Register = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [showSuccess, setShowSuccess] = useState(false);
  const [verificationId, setVerificationId] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fileError, setFileError] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    govIdType: 'Aadhar',
    govIdNumber: '',
    mobile: '',
    occupationSector: '',
    occupationRole: '',
  });

  const [kycFile, setKycFile] = useState(null); // { name, base64, type }

  const createStableId = (prefix) => {
    if (globalThis.crypto?.randomUUID)
      return `${prefix}${globalThis.crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
    return `${prefix}${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    setFileError('');
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setFileError('File too large — maximum 2 MB.');
      e.target.value = '';
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      setFileError('Only JPG, PNG, WEBP, or PDF allowed.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setKycFile({ name: file.name, base64: reader.result, type: file.type });
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setKycFile(null);
    setFileError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.mobile.trim()) { setError('Mobile number is required.'); return; }
    if (!formData.occupationSector) { setError('Please select an occupation sector.'); return; }
    setIsSubmitting(true);
    try {
      const data = await registerUser({
        email: formData.email,
        full_name: formData.fullName,
        password: formData.password,
        gov_id_type: formData.govIdType,
        gov_id_number: formData.govIdNumber,
        mobile: formData.mobile.trim(),
        occupation_sector: formData.occupationSector,
        occupation_role: formData.occupationRole.trim() || undefined,
        kyc_document_name: kycFile?.name || undefined,
        kyc_document_data: kycFile?.base64 || undefined,
      });
      const reference = data.user_id
        ? `VER-${String(data.user_id).slice(0, 8).toUpperCase()}`
        : createStableId('VER-');
      setVerificationId(reference);
      setShowSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to register at this time.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onFocus = (e) => { e.target.style.borderColor = 'rgba(0,242,254,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,242,254,0.06)'; };
  const onBlur  = (e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; };

  const sectionHeader = (label, color = '#00f2fe') => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)', marginBottom: '0.85rem' }}>
      <div style={{ width: '3px', height: '14px', borderRadius: '2px', background: color }} />
      <span style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.25em', color }}>{label}</span>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#020204', color: '#fff', display: 'flex', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Left Brand Panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between"
        style={{
          width: '38%', flexShrink: 0,
          background: 'linear-gradient(145deg, #020204 0%, #080812 60%, #050510 100%)',
          borderRight: '1px solid rgba(255,255,255,0.04)',
          padding: '3rem', position: 'relative', overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(168,85,247,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.03) 1px, transparent 1px)', backgroundSize: '48px 48px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '280px', height: '280px', background: 'radial-gradient(circle, rgba(0,242,254,0.06) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-80px', left: '-40px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(168,85,247,0.07) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <Link to="/" className="no-underline" style={{ position: 'relative', zIndex: 1 }}>
          <span style={{ fontSize: '1.3rem', fontWeight: 900, fontStyle: 'italic', color: '#fff', letterSpacing: '-0.02em' }}>SKY</span>
          <span style={{ fontSize: '1.3rem', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #00f2fe, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>DESK360</span>
        </Link>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }}>
            <p style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#a855f7', marginBottom: '1rem' }}>Join the Community</p>
            <h1 style={{ fontSize: '2.6rem', fontWeight: 900, fontStyle: 'italic', lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: '1.25rem' }}>
              Work at<br />
              <span style={{ background: 'linear-gradient(135deg, #a855f7 0%, #00f2fe 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>the top.</span>
            </h1>
            <p style={{ fontSize: '0.83rem', color: '#475569', lineHeight: 1.7, maxWidth: '300px', marginBottom: '2.5rem' }}>
              Join hundreds of professionals who've made SkyDesk360 their second office. 14th floor views, first-class amenities.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { icon: '🏙️', label: 'Panoramic 14th-floor city views' },
                { icon: '⚡', label: 'High-speed fiber — 10 Gbps' },
                { icon: '☕', label: 'Complimentary coffee & pantry' },
                { icon: '🔒', label: 'Private cabins & conference rooms' },
              ].map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.45 + i * 0.1 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                  <span style={{ fontSize: '0.95rem' }}>{f.icon}</span>
                  <span style={{ fontSize: '0.73rem', color: '#64748b', fontWeight: 500 }}>{f.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '0.7rem', color: '#1e293b', fontStyle: 'italic' }}>"The best coworking space in the city — the views alone are worth it."</div>
          <div style={{ fontSize: '0.58rem', color: '#334155', fontWeight: 700, marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>— A happy member</div>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem', overflowY: 'auto', position: 'relative' }}>
        <div className="lg:hidden" style={{ position: 'absolute', top: '10%', right: '-10%', width: '350px', height: '350px', background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          style={{ width: '100%', maxWidth: '520px', position: 'relative', zIndex: 1, paddingTop: '2rem', paddingBottom: '2rem' }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="no-underline">
              <span style={{ fontSize: '1.2rem', fontWeight: 900, fontStyle: 'italic', color: '#fff' }}>SKY</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 900, fontStyle: 'italic', background: 'linear-gradient(135deg, #00f2fe, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>DESK360</span>
            </Link>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '0.5rem' }}>
              Create<br />
              <span style={{ background: 'linear-gradient(135deg, #a855f7, #00f2fe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Your Account.</span>
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#475569' }}>Complete KYC verification to join the workspace.</p>
          </div>

          <form onSubmit={handleRegister} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {error && (
              <div style={{ padding: '0.8rem 1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', color: '#fca5a5', fontSize: '0.75rem', fontWeight: 600 }}>
                {error}
              </div>
            )}

            {/* ── Basic Info ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Field label="Full Name" icon={User}>
                <input name="fullName" type="text" required placeholder="John Doe" onChange={handleChange} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </Field>
              <Field label="Email" icon={Mail}>
                <input name="email" type="email" required placeholder="john@co.com" onChange={handleChange} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </Field>
            </div>

            <Field label="Password" icon={Lock}>
              <input name="password" type={showPassword ? 'text' : 'password'} required minLength={8} placeholder="Minimum 8 characters" onChange={handleChange} style={{ ...inputStyle, paddingRight: '3rem' }} onFocus={onFocus} onBlur={onBlur} />
              <button type="button" onClick={() => setShowPassword((v) => !v)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#334155' }}>
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </Field>

            {/* ── Government ID ── */}
            {sectionHeader('Government ID Verification', '#00f2fe')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>ID Type</label>
                <select name="govIdType" onChange={handleChange} style={{ ...inputNoIconStyle, color: '#94a3b8', appearance: 'none', cursor: 'pointer' }} onFocus={onFocus} onBlur={onBlur}>
                  <option value="Aadhar">Aadhar Card</option>
                  <option value="PAN">PAN Card</option>
                  <option value="Passport">Passport</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Voter ID">Voter ID</option>
                </select>
              </div>
              <Field label="ID Number" icon={IdCard}>
                <input name="govIdNumber" type="text" required minLength={4} placeholder="Verification No." onChange={handleChange} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </Field>
            </div>

            {/* Document Upload */}
            <div>
              <label style={labelStyle}>Upload ID Proof Document</label>
              <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={handleFileChange} style={{ display: 'none' }} />
              {!kycFile ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: '100%', padding: '1rem', borderRadius: '12px', cursor: 'pointer',
                    border: '1.5px dashed rgba(0,242,254,0.2)', background: 'rgba(0,242,254,0.02)',
                    color: '#475569', fontSize: '0.78rem', fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,242,254,0.4)'; e.currentTarget.style.color = '#94a3b8'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(0,242,254,0.2)'; e.currentTarget.style.color = '#475569'; }}
                >
                  <UploadCloud size={16} />
                  Click to upload Aadhar / PAN / Passport scan
                  <span style={{ fontSize: '0.6rem', color: '#334155' }}>(JPG, PNG, PDF · max 2 MB)</span>
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(0,242,254,0.04)', border: '1px solid rgba(0,242,254,0.15)', borderRadius: '12px' }}>
                  <FileText size={16} color="#00f2fe" />
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{kycFile.name}</span>
                  <button type="button" onClick={removeFile} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex' }}>
                    <X size={14} />
                  </button>
                </div>
              )}
              {fileError && <p style={{ fontSize: '0.7rem', color: '#f87171', marginTop: '0.4rem' }}>{fileError}</p>}
            </div>

            {/* ── KYC Details ── */}
            {sectionHeader('Personal & Professional Details', '#a855f7')}
            <Field label="Mobile Number" icon={Phone}>
              <input name="mobile" type="tel" required placeholder="+91 98765 43210" onChange={handleChange} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Occupation Sector</label>
                <select name="occupationSector" required onChange={handleChange} style={{ ...inputNoIconStyle, color: formData.occupationSector ? '#e2e8f0' : '#475569', appearance: 'none', cursor: 'pointer' }} onFocus={onFocus} onBlur={onBlur}>
                  <option value="" disabled>Select sector</option>
                  {OCCUPATION_SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>
                  Role / Designation
                  <span style={{ color: '#334155', fontWeight: 600, marginLeft: '0.4rem' }}>(optional)</span>
                </label>
                <input name="occupationRole" type="text" placeholder="e.g. Software Engineer" onChange={handleChange} style={inputNoIconStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%', padding: '1rem',
                background: isSubmitting ? 'rgba(168,85,247,0.3)' : 'linear-gradient(135deg, #a855f7, #00f2fe)',
                border: 'none', borderRadius: '12px',
                color: isSubmitting ? 'rgba(0,0,0,0.4)' : '#000',
                fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.18em',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                marginTop: '0.25rem', transition: 'all 0.3s ease',
                boxShadow: isSubmitting ? 'none' : '0 4px 24px rgba(168,85,247,0.2)',
              }}
              onMouseEnter={(e) => { if (!isSubmitting) { e.currentTarget.style.boxShadow = '0 6px 36px rgba(168,85,247,0.35)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 24px rgba(168,85,247,0.2)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {isSubmitting ? 'Submitting KYC...' : <><span>Create Account</span><ArrowRight size={15} /></>}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: '#475569' }}>
            Already a member?{' '}
            <Link to="/signin" className="no-underline" style={{ color: '#a855f7', fontWeight: 700 }}>Sign In</Link>
          </p>

          <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', color: '#1e293b', fontSize: '0.57rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><ShieldCheck size={11} /> KYC Secured</span>
            <span style={{ width: '1px', height: '10px', background: 'rgba(255,255,255,0.05)' }} />
            <span>Data Encrypted</span>
            <span style={{ width: '1px', height: '10px', background: 'rgba(255,255,255,0.05)' }} />
            <span>Privacy Protected</span>
          </div>
        </motion.div>
      </div>

      {/* ── SUCCESS MODAL ── */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'rgba(2,2,4,0.9)', backdropFilter: 'blur(20px)' }}>
            <motion.div initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              style={{ width: '100%', maxWidth: '380px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '28px', padding: '2.5rem', textAlign: 'center' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(0,242,254,0.12), rgba(168,85,247,0.12))', border: '1px solid rgba(0,242,254,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', position: 'relative' }}>
                <Send size={28} color="#00f2fe" />
                <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '22px', height: '22px', borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #020204' }}>
                  <Check size={11} color="#fff" strokeWidth={3} />
                </div>
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                KYC <span style={{ background: 'linear-gradient(135deg, #00f2fe, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Submitted!</span>
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Your account has been created. Confirmation sent to{' '}
                <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{formData.email}</span>.
              </p>
              <div style={{ background: 'rgba(0,242,254,0.06)', border: '1px solid rgba(0,242,254,0.15)', borderRadius: '10px', padding: '0.7rem 1.25rem', fontSize: '0.65rem', fontWeight: 800, color: '#00f2fe', letterSpacing: '0.1em', marginBottom: '1.75rem', textTransform: 'uppercase' }}>
                Ref: {verificationId}
              </div>
              <button onClick={() => navigate('/signin')} style={{ width: '100%', padding: '0.9rem', background: 'linear-gradient(135deg, #00f2fe, #a855f7)', border: 'none', borderRadius: '12px', color: '#000', fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.18em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 24px rgba(0,242,254,0.2)' }}>
                Go to Sign In <ArrowRight size={15} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Register;
