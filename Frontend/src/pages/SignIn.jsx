import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { loginUser, setAuthSession } from '../lib/api';

const SignIn = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const data = await loginUser(email, password);
      const role = data.role?.toLowerCase?.() || 'user';
      const user = { email, fullName: email.split('@')[0], role };
      setAuthSession({ token: data.access_token, user });
      navigate(role === 'admin' ? '/crm' : from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#020204', color: '#fff', display: 'flex', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Left Brand Panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between"
        style={{
          width: '44%',
          flexShrink: 0,
          background: 'linear-gradient(145deg, #020204 0%, #0a0a14 50%, #060610 100%)',
          borderRight: '1px solid rgba(255,255,255,0.04)',
          padding: '3rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Grid pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(0,242,254,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,242,254,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
            pointerEvents: 'none',
          }}
        />
        {/* Gradient orbs */}
        <div style={{ position: 'absolute', top: '-80px', left: '-80px', width: '320px', height: '320px', background: 'radial-gradient(circle, rgba(0,242,254,0.06) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-60px', right: '-60px', width: '260px', height: '260px', background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        {/* Logo */}
        <Link to="/" className="no-underline" style={{ position: 'relative', zIndex: 1 }}>
          <span style={{ fontSize: '1.3rem', fontWeight: 900, fontStyle: 'italic', color: '#fff', letterSpacing: '-0.02em' }}>SKY</span>
          <span style={{
            fontSize: '1.3rem', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #00f2fe, #a855f7)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>DESK360</span>
          <span style={{ marginLeft: '0.4rem', fontSize: '0.42rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#1e293b', verticalAlign: 'super' }}>PRO</span>
        </Link>

        {/* Center content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <p style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#00f2fe', marginBottom: '1.2rem' }}>
              Premium Coworking
            </p>
            <h1 style={{ fontSize: '2.8rem', fontWeight: 900, fontStyle: 'italic', lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: '1.5rem' }}>
              Your Work.<br />
              <span style={{
                background: 'linear-gradient(135deg, #00f2fe 0%, #a855f7 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>Elevated.</span>
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.7, maxWidth: '340px', marginBottom: '2.5rem' }}>
              Access Bangalore's most premium 14th-floor coworking space. Reserve your seat in seconds, work in style.
            </p>

            {/* Feature list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {[
                { icon: '⚡', label: 'Instant booking — live seat availability' },
                { icon: '🔐', label: 'Enterprise-grade security & privacy' },
                { icon: '🏢', label: '35+ seats across 4 premium zones' },
              ].map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 + i * 0.12 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                >
                  <span style={{ fontSize: '1rem' }}>{f.icon}</span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>{f.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom stats */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {[['35+', 'Seats'], ['4', 'Zones'], ['24/7', 'Access']].map(([val, lbl]) => (
            <div key={lbl}>
              <div style={{
                fontSize: '1.4rem', fontWeight: 900,
                background: 'linear-gradient(135deg, #fff, #94a3b8)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>{val}</div>
              <div style={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#334155', marginTop: '0.1rem' }}>{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
        {/* Mobile background glow */}
        <div className="lg:hidden" style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%, -50%)', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(0,242,254,0.05) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="no-underline">
              <span style={{ fontSize: '1.2rem', fontWeight: 900, fontStyle: 'italic', color: '#fff' }}>SKY</span>
              <span style={{
                fontSize: '1.2rem', fontWeight: 900, fontStyle: 'italic',
                background: 'linear-gradient(135deg, #00f2fe, #a855f7)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>DESK360</span>
            </Link>
          </div>

          {/* Header */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.9rem', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '0.6rem' }}>
              Welcome<br />
              <span style={{
                background: 'linear-gradient(135deg, #00f2fe, #a855f7)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>Back.</span>
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#475569' }}>
              {location.state?.from
                ? <span style={{ color: '#00f2fe', fontWeight: 600 }}>Sign in to continue.</span>
                : 'Enter your credentials to access your workspace.'
              }
            </p>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                marginBottom: '1.5rem',
                padding: '0.85rem 1rem',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                color: '#fca5a5',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#475569', marginBottom: '0.5rem' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#334155', width: '15px', height: '15px' }} />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    padding: '0.9rem 1rem 0.9rem 2.75rem',
                    color: '#e2e8f0',
                    fontSize: '0.875rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(0,242,254,0.4)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(0,242,254,0.06)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#475569', marginBottom: '0.5rem' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#334155', width: '15px', height: '15px' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    padding: '0.9rem 3rem 0.9rem 2.75rem',
                    color: '#e2e8f0',
                    fontSize: '0.875rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(0,242,254,0.4)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(0,242,254,0.06)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#334155', padding: '2px' }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <a href="#" style={{ fontSize: '0.65rem', fontWeight: 700, color: '#475569', textDecoration: 'none' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#00f2fe')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '1rem',
                background: isSubmitting ? 'rgba(0,242,254,0.3)' : 'linear-gradient(135deg, #00f2fe, #a855f7)',
                border: 'none',
                borderRadius: '12px',
                color: isSubmitting ? 'rgba(0,0,0,0.4)' : '#000',
                fontSize: '0.72rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease',
                boxShadow: isSubmitting ? 'none' : '0 4px 24px rgba(0,242,254,0.2)',
              }}
              onMouseEnter={(e) => { if (!isSubmitting) { e.currentTarget.style.boxShadow = '0 6px 36px rgba(0,242,254,0.35)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,242,254,0.2)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {isSubmitting ? 'Signing In...' : <><span>Sign In</span><ArrowRight size={15} /></>}
            </button>
          </form>

          {/* Footer */}
          <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.8rem', color: '#475569' }}>
            No account?{' '}
            <Link to="/register" className="no-underline" style={{ color: '#00f2fe', fontWeight: 700 }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              Create one
            </Link>
          </p>

          <div style={{ marginTop: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#1e293b', fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            <ShieldCheck size={12} />
            Enterprise Grade Security
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SignIn;
