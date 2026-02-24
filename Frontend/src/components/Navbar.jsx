import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon } from 'lucide-react';
import { clearAuthSession } from '../lib/api';

const getStoredUser = () => {
  try {
    const rawUser = localStorage.getItem('user');
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    localStorage.removeItem('user');
    return null;
  }
};

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';
  const user = getStoredUser();
  const isAdmin = user?.role?.toLowerCase?.() === 'admin';

  const handleLogout = () => {
    clearAuthSession();
    navigate('/signin');
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-gradient-to-b from-black/90 to-transparent">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 md:px-12 py-6">
        <Link to="/" className="text-xl font-bold italic no-underline text-white">SKYDESK<span className="text-blue-500">360</span></Link>
        <div className="hidden md:flex items-center space-x-10 text-[10px] uppercase tracking-widest font-semibold text-gray-400">
          <Link to="/" className="hover:text-white transition no-underline">Home</Link>
          {isHome ? (
            <a href="#pricing" className="hover:text-white transition no-underline">Pricing</a>
          ) : (
            <Link to="/#pricing" className="hover:text-white transition no-underline">Pricing</Link>
          )}
          <Link to="/book" className="hover:text-white transition text-[#00f2fe] no-underline">Book Seat</Link>
          
          <div className="h-4 w-px bg-white/10 mx-2" />
          
          {user ? (
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2 text-white normal-case font-bold tracking-normal text-xs">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                  <UserIcon size={12} className="text-blue-400" />
                </div>
                {user.fullName || user.name || 'User'}
              </span>
              {isAdmin && (
                <Link to="/crm" className="hover:text-white transition uppercase tracking-widest no-underline text-blue-400 font-bold">
                  CRM
                </Link>
              )}
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 hover:text-white transition uppercase tracking-widest no-underline"
              >
                <LogOut size={12} /> Sign Out
              </button>
            </div>
          ) : (
            <>
              <Link to="/signin" className="hover:text-white transition no-underline">Sign In</Link>
              <Link to="/register" className="px-5 py-2 bg-blue-600/20 border border-blue-500/50 rounded-full hover:bg-blue-600 hover:text-white transition text-blue-400 no-underline">Register</Link>
            </>
          )}
        </div>
        
        {/* Mobile View Toggle (Simplified for now) */}
        {!user && (
          <Link to="/book" className="md:hidden px-5 py-2 border border-white/20 text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition no-underline text-white">Book Now</Link>
        )}
      </div>
    </nav>
  );
}
