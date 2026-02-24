import { Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer id="contact" className="relative z-10 bg-black/80 border-t border-white/10 pt-20 pb-10 px-10 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12 mb-16">
        <div className="col-span-2">
          <div className="text-2xl font-bold italic tracking-tighter mb-4">SKYDESK<span className="text-blue-500">360</span></div>
          <p className="text-gray-500 text-sm max-w-sm">Elite workspace for the 0.1% of founders and creators.</p>
        </div>
        <div className="text-sm space-y-3">
          <h4 className="text-white font-bold uppercase tracking-widest text-[10px]">Office</h4>
          <p className="text-gray-500 flex items-center gap-2"><MapPin size={14}/> Financial District, NY</p>
        </div>
        <div className="text-sm space-y-3">
          <h4 className="text-white font-bold uppercase tracking-widest text-[10px]">Contact</h4>
          <p className="text-gray-500 flex items-center gap-2"><Mail size={14}/> hello@skydesk360.com</p>
        </div>
      </div>
      <div className="text-center text-[10px] text-gray-700 tracking-[0.3em] uppercase border-t border-white/5 pt-8">
        © 2026 SKYDESK360 Global
      </div>
    </footer>
  );
}