import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, ArrowUpRight } from 'lucide-react';

const LINKS = {
  Product: [
    { label: 'Book a Seat', to: '/book' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Floor Map', to: '/book' },
  ],
  Account: [
    { label: 'Sign In', to: '/signin' },
    { label: 'Register', to: '/register' },
    { label: 'Admin CRM', to: '/crm' },
  ],
};

export default function Footer() {
  return (
    <footer
      id="contact"
      style={{
        position: 'relative',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '4rem 1.5rem 2rem',
        overflow: 'hidden',
      }}
    >
      {/* Ambient top glow */}
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '600px', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(0,242,254,0.15), rgba(168,85,247,0.15), transparent)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '-80px', left: '20%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(0,242,254,0.03) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Top grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', marginBottom: '3.5rem' }}>
          {/* Brand col */}
          <div style={{ gridColumn: 'span 1' }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.3rem', fontWeight: 900, fontStyle: 'italic', color: '#fff', letterSpacing: '-0.02em' }}>SKY</span>
              <span style={{
                fontSize: '1.3rem', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, #00f2fe, #a855f7)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>DESK360</span>
              <span style={{ marginLeft: '0.35rem', fontSize: '0.38rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#1e293b', verticalAlign: 'super' }}>PRO</span>
            </Link>
            <p style={{ fontSize: '0.78rem', color: '#334155', lineHeight: 1.7, maxWidth: '240px' }}>
              Pune's most premium 14th-floor coworking space. Built for founders, creators, and teams that mean business.
            </p>

            {/* Social-style badges */}
            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.5rem' }}>
              {['🏢', '⚡', '🔐'].map((icon, i) => (
                <div key={i} style={{
                  width: '34px', height: '34px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.9rem', cursor: 'default',
                }}>
                  {icon}
                </div>
              ))}
            </div>
          </div>

          {/* Link cols */}
          {Object.entries(LINKS).map(([group, links]) => (
            <div key={group}>
              <h4 style={{ fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#1e293b', marginBottom: '1.25rem' }}>
                {group}
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {links.map((l) =>
                  l.to ? (
                    <li key={l.label}>
                      <Link
                        to={l.to}
                        style={{ textDecoration: 'none', fontSize: '0.8rem', color: '#334155', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.3rem', transition: 'color 0.2s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#e2e8f0')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#334155')}
                      >
                        {l.label}
                      </Link>
                    </li>
                  ) : (
                    <li key={l.label}>
                      <a
                        href={l.href}
                        style={{ textDecoration: 'none', fontSize: '0.8rem', color: '#334155', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.3rem', transition: 'color 0.2s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#e2e8f0')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#334155')}
                      >
                        {l.label}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>
          ))}

          {/* Contact col */}
          <div>
            <h4 style={{ fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#1e293b', marginBottom: '1.25rem' }}>
              Contact
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <a href="tel:+917397010324" style={{ textDecoration: 'none', display: 'flex', alignItems: 'flex-start', gap: '0.6rem', color: '#334155', fontSize: '0.78rem', transition: 'color 0.2s' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#94a3b8')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#334155')}
              >
                <Phone size={13} style={{ marginTop: '2px', flexShrink: 0 }} />
                +91 73970 10324
              </a>
              <a href="mailto:hello@skydesk360.com" style={{ textDecoration: 'none', display: 'flex', alignItems: 'flex-start', gap: '0.6rem', color: '#334155', fontSize: '0.78rem', transition: 'color 0.2s' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#94a3b8')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#334155')}
              >
                <Mail size={13} style={{ marginTop: '2px', flexShrink: 0 }} />
                hello@skydesk360.com
              </a>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', color: '#1e293b', fontSize: '0.75rem', lineHeight: 1.5 }}>
                <MapPin size={13} style={{ marginTop: '3px', flexShrink: 0, color: '#00f2fe' }} />
                14th Floor, Maruti Millennium Tower, Baner, Pune — 411045
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)', marginBottom: '2rem' }} />

        {/* Bottom bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#1e293b' }}>
            © 2026 SkyDesk360 Global. All rights reserved.
          </span>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {['Privacy', 'Terms', 'Security'].map((t) => (
              <a key={t} href="#" style={{ textDecoration: 'none', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#1e293b', transition: 'color 0.2s' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#475569')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#1e293b')}
              >
                {t}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
