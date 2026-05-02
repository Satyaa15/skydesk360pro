import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon, LayoutDashboard, Menu, X, Sun, Moon } from 'lucide-react';
import { clearAuthSession } from '../lib/api';
import { useTheme, useColors } from '../contexts/ThemeContext';

const getStoredUser = () => {
  try {
    const rawUser = sessionStorage.getItem('user');
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    sessionStorage.removeItem('user');
    return null;
  }
};

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const colors = useColors();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => setMobileOpen(false), [location]);

  const isHome = location.pathname === '/';
  const user = getStoredUser();
  const isAdmin = user?.role?.toLowerCase?.() === 'admin';

  if (location.pathname === '/signin' || location.pathname === '/register') return null;

  const handleLogout = () => {
    clearAuthSession();
    navigate('/signin');
  };

  const navBg = scrolled
    ? colors.bgNav
    : isDark
      ? 'linear-gradient(180deg, rgba(0,0,0,0.80) 0%, transparent 100%)'
      : 'linear-gradient(180deg, rgba(248,250,252,0.95) 0%, transparent 100%)';

  return (
    <>
      <nav
        className="fixed top-0 w-full z-50 transition-all duration-500"
        style={{
          background: navBg,
          backdropFilter: scrolled ? 'blur(28px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(28px)' : 'none',
          borderBottom: scrolled ? colors.navBorder : 'none',
          boxShadow: scrolled ? colors.navShadow : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 md:px-10"
          style={{ height: scrolled ? '64px' : '76px', transition: 'height 0.4s ease' }}>

          {/* Logo */}
          <Link to="/" className="no-underline flex items-baseline gap-0.5">
            <span className="font-black italic" style={{ fontSize: '1.1rem', letterSpacing: '-0.01em', color: colors.text }}>
              SKY
            </span>
            <span
              className="font-black italic"
              style={{
                fontSize: '1.1rem',
                letterSpacing: '-0.01em',
                background: 'linear-gradient(135deg, #00f2fe 0%, #a855f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              DESK
            </span>
            <span
              className="font-black italic"
              style={{
                fontSize: '1.1rem',
                letterSpacing: '-0.01em',
                background: 'linear-gradient(135deg, #a855f7 0%, #00f2fe 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              360
            </span>
            <span
              className="ml-1 font-black"
              style={{
                fontSize: '0.4rem',
                letterSpacing: '0.25em',
                color: colors.textSubtle,
                textTransform: 'uppercase',
                alignSelf: 'flex-end',
                paddingBottom: '1px',
              }}
            >
              PRO
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/" colors={colors}>Home</NavLink>
            {isHome ? (
              <a
                href="#pricing"
                className="no-underline transition-colors duration-200"
                style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: colors.textMuted }}
                onMouseEnter={(e) => (e.currentTarget.style.color = colors.text)}
                onMouseLeave={(e) => (e.currentTarget.style.color = colors.textMuted)}
              >
                Pricing
              </a>
            ) : (
              <NavLink to="/#pricing" colors={colors}>Pricing</NavLink>
            )}

            <div style={{ width: '1px', height: '14px', background: colors.border }} />

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)',
                border: `1px solid ${colors.border}`,
                cursor: 'pointer',
                color: colors.textMuted,
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDark ? 'rgba(0,242,254,0.08)' : 'rgba(0,0,0,0.1)';
                e.currentTarget.style.color = '#00f2fe';
                e.currentTarget.style.borderColor = 'rgba(0,242,254,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
                e.currentTarget.style.color = colors.textMuted;
                e.currentTarget.style.borderColor = colors.border;
              }}
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            <div style={{ width: '1px', height: '14px', background: colors.border }} />

            {user ? (
              <>
                <div className="flex items-center gap-2">
                  <div
                    className="flex items-center justify-center rounded-full"
                    style={{
                      width: '26px',
                      height: '26px',
                      background: 'linear-gradient(135deg, rgba(0,242,254,0.12), rgba(168,85,247,0.12))',
                      border: '1px solid rgba(0,242,254,0.25)',
                    }}
                  >
                    <UserIcon size={11} color="#00f2fe" />
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: colors.text }}>
                    {user.fullName || user.name || 'User'}
                  </span>
                </div>

                <NavLink to="/book" colors={colors} accent>Book Seat</NavLink>

                {isAdmin && (
                  <Link
                    to="/crm"
                    className="no-underline flex items-center gap-1.5 transition-colors duration-200"
                    style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#a855f7' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#c084fc')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#a855f7')}
                  >
                    <LayoutDashboard size={11} />
                    Admin
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 bg-none border-none cursor-pointer transition-colors duration-200"
                  style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: colors.textMuted, background: 'none', border: 'none' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = colors.textMuted)}
                >
                  <LogOut size={11} /> Out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/signin" colors={colors}>Sign In</NavLink>
                <Link
                  to="/register"
                  className="no-underline transition-all duration-200"
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.14em',
                    color: colors.textMuted,
                    padding: '0.45rem 1.1rem',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '999px',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,242,254,0.4)'; e.currentTarget.style.color = '#00f2fe'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.color = colors.textMuted; }}
                >
                  Register
                </Link>
                <Link
                  to="/book"
                  className="no-underline transition-all duration-300"
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.14em',
                    color: '#000',
                    padding: '0.5rem 1.3rem',
                    borderRadius: '999px',
                    background: 'linear-gradient(135deg, #00f2fe, #a855f7)',
                    boxShadow: '0 0 20px rgba(0,242,254,0.2)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 32px rgba(0,242,254,0.35)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 0 20px rgba(0,242,254,0.2)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  Book Now
                </Link>
              </>
            )}
          </div>

          {/* Mobile controls */}
          <div className="md:hidden flex items-center gap-3">
            <button
              onClick={toggleTheme}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '30px', height: '30px', borderRadius: '8px',
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)',
                border: `1px solid ${colors.border}`,
                cursor: 'pointer', color: colors.textMuted,
              }}
            >
              {isDark ? <Sun size={13} /> : <Moon size={13} />}
            </button>
            <button
              className="flex items-center justify-center"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted, padding: '0.25rem' }}
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div
            style={{
              borderTop: `1px solid ${colors.borderMarquee}`,
              background: colors.bgMobile,
              backdropFilter: 'blur(28px)',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <MobileLink to="/" colors={colors}>Home</MobileLink>
            {isHome ? (
              <a href="#pricing" style={{ ...mobileLinkStyle, color: colors.textMuted }}>Pricing</a>
            ) : (
              <MobileLink to="/#pricing" colors={colors}>Pricing</MobileLink>
            )}
            <MobileLink to="/book" colors={colors}>Book Seat</MobileLink>
            {user ? (
              <>
                {isAdmin && <MobileLink to="/crm" colors={colors}>Admin CRM</MobileLink>}
                <button
                  onClick={handleLogout}
                  style={{ ...mobileLinkStyle, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, color: '#f87171' }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <MobileLink to="/signin" colors={colors}>Sign In</MobileLink>
                <MobileLink to="/register" colors={colors}>Register</MobileLink>
              </>
            )}
          </div>
        )}
      </nav>
    </>
  );
}

const mobileLinkStyle = {
  textDecoration: 'none',
  fontSize: '0.7rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
};

function NavLink({ to, children, accent, colors }) {
  return (
    <Link
      to={to}
      className="no-underline transition-colors duration-200"
      style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: accent ? '#00f2fe' : colors.textMuted }}
      onMouseEnter={(e) => (e.currentTarget.style.color = accent ? '#67e8f9' : colors.text)}
      onMouseLeave={(e) => (e.currentTarget.style.color = accent ? '#00f2fe' : colors.textMuted)}
    >
      {children}
    </Link>
  );
}

function MobileLink({ to, children, colors }) {
  return (
    <Link to={to} style={{ ...mobileLinkStyle, color: colors.textMuted }} className="no-underline">
      {children}
    </Link>
  );
}
