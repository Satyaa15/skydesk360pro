import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  motion, useScroll, useTransform, useSpring,
  useInView, AnimatePresence
} from 'framer-motion';
import {
  Shield, Zap, Coffee, Monitor, Car, Globe, ArrowRight,
  MapPin, Play, Pause, RotateCcw, FastForward, Rewind,
  Wifi, Building2, Users, Clock, ChevronRight
} from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

import ScrollCanvas from '../components/ScrollCanvas';
import PriceCard from '../components/PriceCard';
import Footer from '../components/Footer';

/* ─── Reusable 3-D Tilt Card ─── */
function TiltCard({ children, className, style }) {
  const ref = useRef(null);
  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg) scale3d(1.02,1.02,1.02)`;
  };
  const handleLeave = () => {
    if (ref.current) ref.current.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg) scale3d(1,1,1)';
  };
  return (
    <div
      ref={ref}
      className={className}
      style={{ transition: 'transform 0.15s ease-out', willChange: 'transform', ...style }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {children}
    </div>
  );
}

/* ─── Animated Counter ─── */
function Counter({ target, suffix = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!isInView) return;
    const numeric = parseInt(String(target).replace(/\D/g, ''), 10);
    let start = 0;
    const step = Math.ceil(numeric / 50);
    const timer = setInterval(() => {
      start = Math.min(start + step, numeric);
      setCount(start);
      if (start >= numeric) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [isInView, target]);
  const prefix = String(target).startsWith('₹') ? '₹' : '';
  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

/* ─── Marquee Strip ─── */
const MARQUEE_ITEMS = [
  'PREMIUM WORKSTATIONS', 'PRIVATE CABINS', 'CONFERENCE ROOMS',
  '14TH FLOOR VIEWS', '10 GBPS FIBER', '24/7 ACCESS', 'VALET PARKING',
  'MEETING PODS', 'GOURMET COFFEE', 'BIOMETRIC SECURITY',
];

function MarqueeStrip() {
  return (
    <div style={{ overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(0,0,0,0.4)', padding: '1rem 0', position: 'relative', zIndex: 20 }}>
      <div style={{ display: 'flex', animation: 'marqueeScroll 28s linear infinite', width: 'max-content', gap: '3rem', alignItems: 'center' }}>
        {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
          <React.Fragment key={i}>
            <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.3em', color: i % 3 === 0 ? '#00f2fe' : '#1e293b', whiteSpace: 'nowrap' }}>
              {item}
            </span>
            <span style={{ color: '#0f172a', fontSize: '0.5rem' }}>◆</span>
          </React.Fragment>
        ))}
      </div>
      <style>{`@keyframes marqueeScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

/* ─── Feature Row ─── */
function FeatureRow({ eyebrow, heading, desc, tags, accent, reverse, visual }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      style={{ display: 'flex', flexDirection: reverse ? 'row-reverse' : 'row', gap: '5rem', alignItems: 'center', flexWrap: 'wrap' }}
    >
      <div style={{ flex: '1 1 340px' }}>
        <p style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.3em', color: accent, marginBottom: '0.75rem' }}>{eyebrow}</p>
        <h3 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, fontStyle: 'italic', lineHeight: 1.0, letterSpacing: '-0.03em', marginBottom: '1.25rem', color: '#fff' }}
          dangerouslySetInnerHTML={{ __html: heading }}
        />
        <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.75, marginBottom: '1.5rem' }}>{desc}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {tags.map((t) => (
            <span key={t} style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#334155', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '999px', padding: '0.3rem 0.75rem' }}>{t}</span>
          ))}
        </div>
      </div>
      <div style={{ flex: '1 1 320px', display: 'flex', justifyContent: 'center' }}>
        {visual}
      </div>
    </motion.div>
  );
}

/* ─── Visual: Floor Plan Preview ─── */
function FloorPlanVisual() {
  return (
    <TiltCard style={{ width: '100%', maxWidth: '420px' }}>
      <div style={{
        background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(0,242,254,0.1)',
        borderRadius: '20px', padding: '1.75rem',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}>
        <div style={{ fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#334155', marginBottom: '1rem' }}>
          Live Floor Map — 14F
        </div>
        {/* Simplified floor grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '5px', marginBottom: '1rem' }}>
          {Array.from({ length: 32 }).map((_, i) => {
            const state = i < 8 ? 'booked' : i < 12 ? 'selected' : i < 20 ? 'available' : 'locked';
            const colors = {
              booked: { bg: 'rgba(127,29,29,0.35)', border: 'rgba(239,68,68,0.3)' },
              selected: { bg: 'rgba(0,242,254,0.15)', border: 'rgba(0,242,254,0.5)' },
              available: { bg: 'rgba(30,41,59,0.7)', border: 'rgba(148,163,184,0.12)' },
              locked: { bg: 'rgba(120,53,15,0.25)', border: 'rgba(251,191,36,0.3)' },
            };
            return (
              <div key={i} style={{
                height: '18px', borderRadius: '4px',
                background: colors[state].bg,
                border: `1px solid ${colors[state].border}`,
              }} />
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {[['#00f2fe', 'Selected'], ['rgba(239,68,68,0.7)', 'Booked'], ['rgba(251,191,36,0.7)', 'Locked'], ['rgba(148,163,184,0.3)', 'Free']].map(([c, l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: c }} />
              <span style={{ fontSize: '0.55rem', color: '#334155', fontWeight: 700 }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </TiltCard>
  );
}

/* ─── Visual: Booking Flow Card ─── */
function BookingFlowVisual() {
  const steps = [
    { icon: '🗺️', label: 'Choose seat on live map' },
    { icon: '⏱️', label: 'Pick your duration' },
    { icon: '💳', label: 'Pay securely via Razorpay' },
    { icon: '✅', label: 'Seat locked instantly' },
  ];
  return (
    <TiltCard style={{ width: '100%', maxWidth: '380px' }}>
      <div style={{
        background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(168,85,247,0.12)',
        borderRadius: '20px', padding: '1.75rem',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}>
        <div style={{ fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#334155', marginBottom: '1.2rem' }}>
          Booking in 4 steps
        </div>
        {steps.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.6rem 0', borderBottom: i < steps.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
              background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
            }}>{s.icon}</div>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>{s.label}</span>
            <ChevronRight size={12} color="#1e293b" style={{ marginLeft: 'auto', flexShrink: 0 }} />
          </div>
        ))}
      </div>
    </TiltCard>
  );
}

/* ══════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════ */
const Home = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const isLoggedIn = !!sessionStorage.getItem('token');
  const position = [18.5523284, 73.7714723];

  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 80, damping: 25 });

  const heroScale   = useTransform(smoothProgress, [0, 0.12], [1, 0.82]);
  const heroOpacity = useTransform(smoothProgress, [0, 0.1], [1, 0]);
  const heroBlur    = useTransform(smoothProgress, [0, 0.1], [0, 12]);
  const heroY       = useTransform(smoothProgress, [0, 0.12], [0, -60]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) { videoRef.current.play(); setIsPlaying(true); }
    else { videoRef.current.pause(); setIsPlaying(false); }
  };
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setVideoProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
  };
  const skip = (t) => { if (videoRef.current) videoRef.current.currentTime += t; };

  const amenities = [
    { icon: <Wifi className="w-7 h-7" style={{ color: '#00f2fe' }} />, title: 'Neural Fiber', desc: 'Redundant 10 Gbps symmetric fiber — zero throttle, zero downtime.', accent: '#00f2fe' },
    { icon: <Coffee className="w-7 h-7" style={{ color: '#f97316' }} />, title: 'Gourmet Coffee', desc: 'Unlimited artisan cold brew, espresso, and specialty teas on tap.', accent: '#f97316' },
    { icon: <Shield className="w-7 h-7" style={{ color: '#a855f7' }} />, title: 'Biometric Access', desc: 'Advanced 3-factor biometric + 24/7 live security monitoring.', accent: '#a855f7' },
    { icon: <Monitor className="w-7 h-7" style={{ color: '#3b82f6' }} />, title: 'Business Suite', desc: 'Printing, courier, reception, and enterprise concierge support.', accent: '#3b82f6' },
    { icon: <Zap className="w-7 h-7" style={{ color: '#eab308' }} />, title: 'Power Backup', desc: '100% uptime with dual-redundant UPS and DG set for zero outage.', accent: '#eab308' },
    { icon: <Car className="w-7 h-7" style={{ color: '#ec4899' }} />, title: 'Valet Parking', desc: 'Dedicated basement bays with round-the-clock valet service.', accent: '#ec4899' },
  ];

  return (
    <div ref={containerRef} className="w-full min-h-screen bg-[#020204] text-white selection:bg-[#00f2fe] selection:text-black overflow-x-hidden">

      {/* ── SCROLL CANVAS ENGINE ── */}
      <ScrollCanvas frameCount={240} isLoaded={isLoaded} setIsLoaded={setIsLoaded} />

      {/* ══ HERO (250vh sticky) ══ */}
      <section className="relative z-10" style={{ height: '250vh' }}>
        <motion.div
          style={{ scale: heroScale, opacity: heroOpacity, filter: `blur(${heroBlur}px)`, y: heroY }}
          className="sticky top-0 h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden"
        >
          {/* Ambient orbs */}
          <div style={{ position: 'absolute', top: '15%', left: '10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(0,242,254,0.04) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '10%', right: '8%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(168,85,247,0.05) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

          {/* Badge */}
          <motion.span
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase',
              color: '#00f2fe', border: '1px solid rgba(0,242,254,0.2)', borderRadius: '999px',
              padding: '0.5rem 1.25rem', background: 'rgba(0,242,254,0.04)', marginBottom: '2.5rem',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00f2fe', animation: 'pulse 2s infinite' }} />
            14 Floors Above Ordinary
          </motion.span>

          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{ fontSize: 'clamp(4rem, 11vw, 10rem)', fontWeight: 900, lineHeight: 0.88, letterSpacing: '-0.04em', fontStyle: 'italic', textTransform: 'uppercase', marginBottom: '2rem' }}
          >
            SKY
            <span style={{
              background: 'linear-gradient(135deg, #00f2fe 0%, #a855f7 60%, #00f2fe 100%)',
              backgroundSize: '200% 200%',
              animation: 'gradientShift 5s ease infinite',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>DESK</span>
            <br />
            <span style={{ color: 'rgba(255,255,255,0.12)' }}>360</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.7 }}
            style={{ fontSize: 'clamp(0.9rem, 1.5vw, 1.1rem)', color: '#94a3b8', maxWidth: '520px', lineHeight: 1.7, marginBottom: '3rem', fontWeight: 400 }}
          >
            Pune's most premium coworking floor. Luxury meets productivity — reserve your seat in under 60 seconds.
          </motion.p>

          {/* Floating stat pills */}
          <div style={{ position: 'absolute', left: '5%', top: '38%', display: 'flex', flexDirection: 'column', gap: '0.6rem' }} className="hidden lg:flex">
            {[['28', 'Seats Free'], ['4', 'Zones'], ['10Gbps', 'Fiber']].map(([v, l], i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 + i * 0.15 }}
                style={{
                  background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px',
                  padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}
              >
                <span style={{ fontSize: '1rem', fontWeight: 900, color: '#00f2fe' }}>{v}</span>
                <span style={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#334155' }}>{l}</span>
              </motion.div>
            ))}
          </div>

          <div style={{ position: 'absolute', right: '5%', top: '42%', display: 'flex', flexDirection: 'column', gap: '0.6rem' }} className="hidden lg:flex">
            {[['24/7', 'Access'], ['₹499', 'Starts at'], ['14F', 'Altitude']].map(([v, l], i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + i * 0.15 }}
                style={{
                  background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px',
                  padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}
              >
                <span style={{ fontSize: '1rem', fontWeight: 900, color: '#a855f7' }}>{v}</span>
                <span style={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#334155' }}>{l}</span>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.6 }}
            style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'nowrap', justifyContent: 'center', paddingBottom: '4rem' }}
          >
            <button
              onClick={() => navigate(isLoggedIn ? '/book' : '/signin')}
              style={{
                padding: '1rem 2.5rem', borderRadius: '999px',
                background: 'linear-gradient(135deg, #00f2fe, #a855f7)',
                border: 'none', cursor: 'pointer', color: '#000',
                fontSize: '0.68rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.18em',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                whiteSpace: 'nowrap',
                boxShadow: '0 0 40px rgba(0,242,254,0.25)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 60px rgba(0,242,254,0.45)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 0 40px rgba(0,242,254,0.25)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <span>Reserve Your Seat</span><ArrowRight size={15} />
            </button>
            <a
              href="#pricing"
              style={{
                padding: '1rem 2rem', borderRadius: '999px',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', color: '#64748b',
                fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em',
                textDecoration: 'none', transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#e2e8f0'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#64748b'; }}
            >
              View Spaces
            </a>
          </motion.div>

          {/* Scroll hint */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
            style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)' }}
          >
            <motion.div
              animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ width: '1px', height: '36px', background: 'linear-gradient(to bottom, rgba(0,242,254,0.25), transparent)' }}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ══ SCROLLING CONTENT ══ */}
      <div className="relative z-20 w-full" style={{ background: '#020204', boxShadow: '0 -60px 120px rgba(0,0,0,1)' }}>

        {/* ── Marquee ── */}
        <MarqueeStrip />

        {/* ── Stats Band ── */}
        <section style={{ padding: '5rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {[
              { value: 500, suffix: '+', label: 'Pioneer Members', accent: '#00f2fe', icon: <Users size={18} /> },
              { value: 10, suffix: ' Gbps', label: 'Neural Fiber Speed', accent: '#a855f7', icon: <Wifi size={18} /> },
              { value: 35, suffix: '+', label: 'Premium Seats', accent: '#f97316', icon: <Building2 size={18} /> },
              { value: 24, suffix: '/7', label: 'Hours Access', accent: '#22c55e', icon: <Clock size={18} /> },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '20px', padding: '2rem', position: 'relative', overflow: 'hidden',
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${s.accent}, transparent)` }} />
                <div style={{ color: s.accent, marginBottom: '0.75rem' }}>{s.icon}</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, fontStyle: 'italic', color: '#fff', lineHeight: 1, marginBottom: '0.4rem' }}>
                  <Counter target={s.value} suffix={s.suffix} />
                </div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#334155' }}>{s.label}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Feature Sections ── */}
        <section style={{ padding: '7rem 1.5rem', maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '8rem' }}>
          <FeatureRow
            eyebrow="Live Floor Map"
            heading="Reserve any seat.<br/><span style='background:linear-gradient(135deg,#00f2fe,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;'>In real time.</span>"
            desc="Browse our interactive 14th-floor plan, see which seats are free, booked, or locked — then claim yours in seconds. No phone calls, no email chains."
            tags={['Interactive SVG Map', 'Live Seat Status', 'Instant Lock', 'Multi-seat Select']}
            accent="#00f2fe"
            reverse={false}
            visual={<FloorPlanVisual />}
          />
          <FeatureRow
            eyebrow="Frictionless Booking"
            heading="4 taps to<br/><span style='background:linear-gradient(135deg,#a855f7,#00f2fe);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;'>your desk.</span>"
            desc="Choose a seat, pick your duration — hourly to yearly — and pay via Razorpay. Your booking is confirmed instantly and your seat is locked for your entire window."
            tags={['Hourly / Daily / Monthly', 'Razorpay Secure Payments', 'Instant Confirmation', 'Email Receipt']}
            accent="#a855f7"
            reverse={true}
            visual={<BookingFlowVisual />}
          />
        </section>

        {/* ── Amenities ── */}
        <section style={{ padding: '6rem 1.5rem', background: 'rgba(0,0,0,0.3)' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <motion.div
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              style={{ textAlign: 'center', marginBottom: '4rem' }}
            >
              <p style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.35em', color: '#00f2fe', marginBottom: '0.75rem' }}>What's Included</p>
              <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.03em', lineHeight: 1 }}>
                The Full<br />
                <span style={{ background: 'linear-gradient(135deg, #00f2fe, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Arsenal.</span>
              </h2>
            </motion.div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {amenities.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                >
                  <TiltCard style={{ height: '100%' }}>
                    <div style={{
                      padding: '2rem', borderRadius: '18px', height: '100%', boxSizing: 'border-box',
                      background: 'rgba(15,23,42,0.45)', border: '1px solid rgba(255,255,255,0.05)',
                      position: 'relative', overflow: 'hidden',
                    }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${item.accent}40, transparent)` }} />
                      <div style={{
                        width: '52px', height: '52px', borderRadius: '14px', marginBottom: '1.25rem',
                        background: `${item.accent}0f`, border: `1px solid ${item.accent}20`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {item.icon}
                      </div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.5rem', color: '#e2e8f0' }}>{item.title}</h3>
                      <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.65 }}>{item.desc}</p>
                    </div>
                  </TiltCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Video Walkthrough ── */}
        <section style={{ padding: '7rem 1.5rem' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '5rem', alignItems: 'center' }}>
            <motion.div
              initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              style={{ flex: '1 1 340px' }}
            >
              <p style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.35em', color: '#f97316', marginBottom: '0.75rem' }}>Virtual Tour</p>
              <h2 style={{ fontSize: 'clamp(2.5rem, 4.5vw, 3.5rem)', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.03em', marginBottom: '1.25rem', lineHeight: 1.0 }}>
                The<br />
                <span style={{ background: 'linear-gradient(135deg, #f97316, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Walkthrough.</span>
              </h2>
              <p style={{ color: '#475569', fontSize: '0.88rem', lineHeight: 1.75, marginBottom: '2rem' }}>
                Take a guided virtual flight through our 14th-floor ecosystem. Control the tour with the interactive player.
              </p>
              <div style={{ width: '40px', height: '2px', background: 'linear-gradient(90deg, #f97316, transparent)' }} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center' }}
            >
              <TiltCard>
                <div style={{
                  width: '280px', aspectRatio: '9/18.5',
                  background: '#0a0a14', borderRadius: '48px',
                  border: '10px solid rgba(255,255,255,0.06)',
                  boxShadow: '0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
                  overflow: 'hidden', position: 'relative',
                }} className="group">
                  <video ref={videoRef} onTimeUpdate={handleTimeUpdate} playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }}>
                    <source src="/videos/office-tour.mp4" type="video/mp4" />
                  </video>
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, transparent 50%)',
                    opacity: 0, transition: 'opacity 0.3s',
                    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '1.5rem',
                  }} className="group-hover:opacity-100">
                    <div style={{ height: '3px', background: 'rgba(255,255,255,0.15)', borderRadius: '999px', marginBottom: '1.5rem', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: '#00f2fe', width: `${videoProgress}%`, transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <button onClick={() => skip(-5)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }}><Rewind size={20} /></button>
                      <button onClick={togglePlay} style={{
                        width: '52px', height: '52px', borderRadius: '50%',
                        background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                      }}>
                        {isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" style={{ marginLeft: '2px' }} />}
                      </button>
                      <button onClick={() => skip(5)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }}><FastForward size={20} /></button>
                    </div>
                    <button onClick={() => { if (videoRef.current) videoRef.current.currentTime = 0; }} style={{
                      background: 'none', border: 'none', cursor: 'pointer', color: '#475569',
                      fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                    }}>
                      <RotateCcw size={10} /> Restart
                    </button>
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="pricing" style={{ padding: '6rem 1.5rem', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <motion.div
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              style={{ textAlign: 'center', marginBottom: '4rem' }}
            >
              <p style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.35em', color: '#a855f7', marginBottom: '0.75rem' }}>Pricing</p>
              <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.03em', lineHeight: 1 }}>
                Curated<br />
                <span style={{ background: 'linear-gradient(135deg, #a855f7, #00f2fe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Nests.</span>
              </h2>
            </motion.div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              <PriceCard
                title="Hot Desks"
                price="499"
                unit="day"
                features={['Daily Access', 'High-Speed WiFi', 'Coffee & Pantry', 'Shared Lounge']}
                accent="#00f2fe"
              />
              <PriceCard
                title="Private Cabins"
                price="25,000"
                unit="month"
                features={['Dedicated Cabin', 'Concierge Service', 'Priority Meeting Room', 'Valet Parking']}
                highlight
                accent="#a855f7"
              />
              <PriceCard
                title="Meeting Rooms"
                price="999"
                unit="hour"
                features={['Up to 10 People', '4K Smart Screen', 'Fiber Internet', 'Whiteboard & AV']}
                accent="#f97316"
              />
            </div>
          </div>
        </section>

        {/* ── CTA Band ── */}
        <section style={{ padding: '6rem 1.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,242,254,0.04) 0%, rgba(168,85,247,0.05) 100%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(0,242,254,0.2), rgba(168,85,247,0.2), transparent)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.2), rgba(0,242,254,0.2), transparent)' }} />
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}
          >
            <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '1.5rem' }}>
              Your next<br />
              <span style={{ background: 'linear-gradient(135deg, #00f2fe, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                great idea
              </span>
              <br />starts here.
            </h2>
            <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '2.5rem', lineHeight: 1.7 }}>
              Join 500+ founders, engineers, and creators who call SkyDesk360 their second home.
            </p>
            <button
              onClick={() => navigate(isLoggedIn ? '/book' : '/register')}
              style={{
                padding: '1.1rem 3rem', borderRadius: '999px',
                background: 'linear-gradient(135deg, #00f2fe, #a855f7)',
                border: 'none', cursor: 'pointer', color: '#000',
                fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                whiteSpace: 'nowrap',
                boxShadow: '0 0 60px rgba(0,242,254,0.2)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 80px rgba(0,242,254,0.4)'; e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 0 60px rgba(0,242,254,0.2)'; e.currentTarget.style.transform = 'translateY(0) scale(1)'; }}
            >
              <span>Get Started Free</span> <ArrowRight size={16} />
            </button>
          </motion.div>
        </section>

        {/* ── Location ── */}
        <section id="location" style={{ padding: '6rem 1.5rem' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <motion.div
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div style={{
                borderRadius: '28px', overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', flexWrap: 'wrap',
                background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(16px)',
              }}>
                <div style={{ flex: '1 1 340px', padding: '3.5rem' }}>
                  <p style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.35em', color: '#00f2fe', marginBottom: '0.75rem' }}>Find Us</p>
                  <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '1.5rem' }}>
                    The<br /><span style={{ background: 'linear-gradient(135deg, #00f2fe, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Location.</span>
                  </h2>
                  <p style={{ color: '#475569', fontSize: '0.82rem', lineHeight: 1.7, display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
                    <MapPin size={16} color="#00f2fe" style={{ flexShrink: 0, marginTop: '3px' }} />
                    14th Floor, Maruti Millennium Tower, Pune Bangalore Highway Pashan Exit, Baner Annex, Baner, Pune, Maharashtra 411045
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {[['🚇', 'Metro: 8 min'], ['✈️', 'Airport: 25 min'], ['🅿️', 'Valet Parking']].map(([icon, label]) => (
                      <span key={label} style={{
                        fontSize: '0.65rem', fontWeight: 700, color: '#334155',
                        border: '1px solid rgba(255,255,255,0.06)', borderRadius: '999px',
                        padding: '0.35rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem',
                      }}>{icon} {label}</span>
                    ))}
                  </div>
                </div>
                <div style={{ flex: '1 1 340px', minHeight: '360px', filter: 'grayscale(1) brightness(0.4) contrast(1.2)', position: 'relative' }}>
                  <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%', minHeight: '360px' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={position} />
                  </MapContainer>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>

      {/* Global animation keyframes */}
      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        .group:hover .group-hover\\:opacity-100 { opacity: 1 !important; }
      `}</style>
    </div>
  );
};

export default Home;
