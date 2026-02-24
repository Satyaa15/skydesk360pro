import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';

const Home = lazy(() => import('./pages/Home'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const SignIn = lazy(() => import('./pages/SignIn'));
const Register = lazy(() => import('./pages/Register'));
const AdminCRM = lazy(() => import('./pages/AdminCRM'));

function App() {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <Suspense fallback={<div className="min-h-screen bg-[#020202]" />}>
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
          <Route path="/signin" element={<SignIn />} />
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
