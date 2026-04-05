import { Suspense, lazy, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import { clearAuthSession } from './lib/api';

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

function App() {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <InactivityGuard />
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
