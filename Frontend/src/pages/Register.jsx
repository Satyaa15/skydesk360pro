import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, ArrowRight, ShieldCheck, FileText, IdCard, Check, Send } from 'lucide-react';
import { registerUser } from '../lib/api';

const Register = () => {
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);
  const [verificationId, setVerificationId] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    govIdType: 'Aadhar',
    govIdNumber: ''
  });

  const createStableId = (prefix) => {
    if (globalThis.crypto?.randomUUID) {
      return `${prefix}${globalThis.crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
    }
    return `${prefix}${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const data = await registerUser({
        email: formData.email,
        full_name: formData.fullName,
        password: formData.password,
        gov_id_type: formData.govIdType,
        gov_id_number: formData.govIdNumber,
      });

      // Show success modal
      const reference = data.user_id ? `VER-${String(data.user_id).slice(0, 8).toUpperCase()}` : createStableId('VER-');
      setVerificationId(reference);
      setShowSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to register at this time.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-[#020202] text-white flex items-center justify-center px-6 py-20 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 -right-20 w-80 h-80 bg-blue-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-purple-600/10 rounded-full blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg z-10"
      >
        <div className="text-center mb-10">
          <Link to="/" className="text-2xl font-black italic no-underline text-white mb-4 block">
            SKYDESK<span className="text-blue-500">360</span>
          </Link>
          <h2 className="text-3xl font-bold tracking-tight uppercase italic">Join the <span className="text-[#00f2fe]">Elite.</span></h2>
          <p className="text-gray-500 mt-2">Create your account and secure your 14th-floor orbit.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6 bg-white/[0.02] border border-white/5 p-8 rounded-[2rem] backdrop-blur-xl">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input 
                  name="fullName"
                  type="text" 
                  required
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-[#00f2fe] transition-colors text-sm"
                  placeholder="John Doe"
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input 
                  name="email"
                  type="email" 
                  required
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-[#00f2fe] transition-colors text-sm"
                  placeholder="john@company.com"
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block">Password</label>
            <div className="relative">
              <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input 
                  name="password"
                  type="password" 
                  required
                  minLength={8}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-[#00f2fe] transition-colors text-sm"
                  placeholder="Minimum 8 characters"
                  onChange={handleChange}
                />
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#00f2fe] font-black mb-6">Government Verification Required</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block">ID Type</label>
                <select 
                  name="govIdType"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-4 px-4 focus:outline-none focus:border-[#00f2fe] transition-colors text-sm text-gray-400"
                  onChange={handleChange}
                >
                  <option value="Aadhar">Aadhar Card</option>
                  <option value="PAN">PAN Card</option>
                  <option value="Passport">Passport</option>
                  <option value="Driving License">Driving License</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block">ID Number</label>
                <div className="relative">
                  <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <input 
                    name="govIdNumber"
                    type="text" 
                    required
                    minLength={4}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-[#00f2fe] transition-colors text-sm"
                    placeholder="Verification Number"
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-white text-black font-black uppercase tracking-widest py-5 rounded-xl flex items-center justify-center gap-2 hover:bg-[#00f2fe] transition-all active:scale-[0.98]"
          >
            {isSubmitting ? 'Creating Account...' : <>Create Account <ArrowRight size={16} /></>}
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-gray-500">
          Already a pioneer? <Link to="/signin" className="text-[#00f2fe] font-bold hover:underline">Sign In</Link>
        </p>

        <div className="mt-12 flex items-center justify-center gap-6 text-[9px] text-gray-600 uppercase tracking-widest font-black">
          <span className="flex items-center gap-2"><ShieldCheck size={12}/> Secure Onboarding</span>
          <span className="flex items-center gap-2">Privacy Protected</span>
        </div>
      </motion.div>

      {/* ──── SUCCESS MODAL (MOCK EMAIL SENT) ──── */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center px-6 bg-[#020202]/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-sm bg-white/[0.03] border border-white/10 p-10 rounded-[3rem] text-center shadow-2xl relative"
            >
              <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 mx-auto mb-8 relative">
                <Send size={32} className="text-[#00f2fe] animate-pulse" />
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center border-2 border-[#020202]">
                  <Check size={12} className="text-white font-bold" />
                </div>
              </div>

              <h2 className="text-2xl font-black italic uppercase mb-4 tracking-tight">Check Your <span className="text-[#00f2fe]">Mail.</span></h2>
              <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                Welcome to the stratosphere! We've sent a registration confirmation to <span className="text-white font-bold">{formData.email}</span>.
              </p>

              <div className="bg-white/5 rounded-2xl p-4 mb-8 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                Verification ID: {verificationId}
              </div>

              <button 
                onClick={() => navigate('/signin')}
                className="w-full bg-[#00f2fe] text-black font-black uppercase tracking-widest py-5 rounded-2xl flex items-center justify-center gap-2 hover:bg-white transition-all shadow-[0_0_20px_rgba(0,242,254,0.3)]"
              >
                Go to Sign In <ArrowRight size={16} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Register;
