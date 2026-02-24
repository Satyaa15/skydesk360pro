// src/components/PriceCard.jsx
import React from 'react';
import { motion } from 'framer-motion';

export default function PriceCard({ title, price, features, highlight }) {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className={`p-10 rounded-[2.5rem] border border-white/5 glass transition-all bg-white/[0.02] backdrop-blur-xl ${highlight ? 'border-[#00f2fe]/50 ring-1 ring-[#00f2fe]/20' : ''}`}
    >
      <h4 className="text-xs uppercase tracking-[0.4em] text-gray-500 mb-4 font-black">{title}</h4>
      <div className="text-5xl font-black mb-8 italic">
        {price === "399" || price === "999" ? "₹" : ""}{price}
        <span className="text-sm font-normal text-gray-500">/{price.includes(',') ? 'mo' : 'session'}</span>
      </div>
      <ul className="space-y-4 mb-10 flex-grow">
        {features.map(f => (
          <li key={f} className="flex items-center gap-3 text-sm text-gray-400 font-light italic">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00f2fe]" /> {f}
          </li>
        ))}
      </ul>
      <button className={`w-full py-5 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${highlight ? 'bg-[#00f2fe] text-black' : 'bg-white text-black hover:bg-[#00f2fe]'}`}>
        Get Started
      </button>
    </motion.div>
  );
}