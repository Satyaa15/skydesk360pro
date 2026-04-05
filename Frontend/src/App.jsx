import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import { clearAuthSession, wakeBackend } from './lib/api';

const Home        = lazy(() => import('./pages/Home'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const SignIn      = lazy(() => import('./pages/SignIn'));
const Register    = lazy(() => import('./pages/Register'));
const AdminCRM    = lazy(() => import('./pages/AdminCRM'));

// Auto-logout after this many milliseconds of no user activity (60 seconds)
const INACTIVITY_TIMEOUT_MS = 60 * 1000;

// Events that count as "activity"
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

function InactivityGuard() {
  const navigate  = useNavigate();
  const timerRef  = useRef(null);

  useEffect(() => {
    const isLoggedIn = () => !!sessionStorage.getItem('token');

    const resetTimer = () => {
      if (!isLoggedIn()) return;          // not logged in — nothing to guard
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        clearAuthSession();
        navigate('/signin', { replace: true });
      }, INACTIVITY_TIMEOUT_MS);
    };

    // Start the timer only when there is an active session
    if (isLoggedIn()) resetTimer();

    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, resetTimer, { passive: true }));

    return () => {
      clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [navigate]);

  return null;
}

function BackendWakeBanner() {
  const [status, setStatus] = useState('checking'); // 'checking' | 'alive' | 'failed'

  useEffect(() => {
    let cancelled = false;
    wakeBackend().then((alive) => {
      if (!cancelled) setStatus(alive ? 'alive' : 'failed');
    });
    return () => { cancelled = true; };
  }, []);

  if (status === 'alive') return null;

  return (
    <div style={{
      position: 'fixed', bottom: '1.25rem', left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, display: 'flex', alignItems: 'center', gap: '0.75rem',
      background: 'rgba(2,2,4,0.95)', backdropFilter: 'blur(20px)',
      border: status === 'failed' ? '1px solid rgba(248,113,113,0.3)' : '1px solid rgba(0,242,254,0.2)',
      borderRadius: '999px', padding: '0.65rem 1.25rem',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', whiteSpace: 'nowrap',
    }}>
      {status === 'checking' ? (
        <>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#00f2fe', animation: 'pulse 1.2s infinite' }} />
          <span style={{ color: '#94a3b8' }}>Server starting up — please wait…</span>
        </>
      ) : (
        <>
          <span style={{ color: '#f87171' }}>⚠</span>
          <span style={{ color: '#f87171' }}>Server unavailable. Try refreshing in a moment.</span>
        </>
      )}
    </div>
  );
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <InactivityGuard />
      <BackendWakeBanner />
      <Suspense fallback={<div className="min-h-screen bg-[#020204]" />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/book"
            element={
              <ProtectedRoute>
                <BookingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment"
            element={
              <ProtectedRoute>
                <PaymentPage />
              </ProtectedRoute>
            }
          />
          <Route path="/signin"   element={<SignIn />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/crm"
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminCRM />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
