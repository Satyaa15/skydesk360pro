import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { loginUser, setAuthSession } from '../lib/api';

const SignIn = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get the redirect path from state, or default to home
  const from = location.state?.from?.pathname || "/";

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const data = await loginUser(email, password);
      const role = data.role?.toLowerCase?.() || 'user';
      const user = {
        email,
        fullName: email.split('@')[0],
        role,
      };
      setAuthSession({ token: data.access_token, user });
      navigate(role === 'admin' ? '/crm' : from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020202] text-white flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-purple-600/20 rounded-full blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-10">
          <Link to="/" className="text-2xl font-black italic no-underline text-white mb-4 block">
            SKYDESK<span className="text-blue-500">360</span>
          </Link>
          <h2 className="text-3xl font-bold tracking-tight uppercase italic">Welcome <span className="text-[#00f2fe]">Back.</span></h2>
          <p className="text-gray-500 mt-2">
            {location.state?.from ? (
              <span className="text-blue-400 font-bold">Please sign in to access your request.</span>
            ) : (
              "Enter your credentials to access your workspace."
            )}
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-xs font-bold"
          >
            <AlertCircle size={14} />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative">
            <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input 
                type="email" 
                required
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-[#00f2fe] transition-colors text-sm"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="relative">
            <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input 
                type="password" 
                required
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-[#00f2fe] transition-colors text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
            <label className="flex items-center gap-2 cursor-pointer text-gray-500 hover:text-white transition">
              <input type="checkbox" className="rounded bg-white/10 border-white/10 text-blue-500 focus:ring-0" />
              Remember Me
            </label>
            <a href="#" className="text-[#00f2fe] hover:underline no-underline">Forgot Password?</a>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#00f2fe] text-black font-black uppercase tracking-widest py-5 rounded-xl flex items-center justify-center gap-2 hover:bg-white transition-all active:scale-[0.98]"
          >
            {isSubmitting ? 'Signing In...' : <>Sign In <ArrowRight size={16} /></>}
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-gray-500">
          Don't have an account? <Link to="/register" className="text-[#00f2fe] font-bold hover:underline no-underline">Register Now</Link>
        </p>

        <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-center gap-2 text-[10px] text-gray-600 uppercase tracking-widest font-bold">
          <ShieldCheck size={14} className="text-gray-700" />
          Enterprise Grade Security
        </div>
      </motion.div>
    </div>
  );
};

export default SignIn;
