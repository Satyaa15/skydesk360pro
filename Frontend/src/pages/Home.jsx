import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { 
  Shield, Zap, Coffee, Monitor, Car, Globe, ArrowRight, 
  MapPin, Play, Pause, RotateCcw, FastForward, Rewind 
} from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Components
import ScrollCanvas from '../components/ScrollCanvas';
import PriceCard from '../components/PriceCard'; // Refactored from your SpaceCard
import Footer from '../components/Footer';

const Home = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const isLoggedIn = !!localStorage.getItem('token');
  const position = [18.552146999436236, 73.77132638120212];

  // --- VIDEO PLAYER STATE ---
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);

  // --- SCROLL PARALLAX FOR OVERLAYS ---
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  
  // Hero Parallax Transitions
  const heroScale = useTransform(smoothProgress, [0, 0.15], [1, 0.8]);
  const heroOpacity = useTransform(smoothProgress, [0, 0.1], [1, 0]);
  const heroBlur = useTransform(smoothProgress, [0, 0.1], [0, 10]);

  // --- VIDEO LOGIC ---
  const togglePlay = () => {
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    const current = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setVideoProgress(current);
  };

  const skip = (time) => { videoRef.current.currentTime += time; };

  const amenities = [
    { icon: <Globe className="w-8 h-8 text-[#00f2fe]" />, title: "High-Speed WiFi", desc: "Redundant 10Gbps fiber lines." },
    { icon: <Coffee className="w-8 h-8 text-orange-400" />, title: "Gourmet Coffee", desc: "Unlimited artisan brews." },
    { icon: <Shield className="w-8 h-8 text-[#7000ff]" />, title: "24/7 Security", desc: "Advanced biometric access." },
    { icon: <Monitor className="w-8 h-8 text-blue-500" />, title: "Business Support", desc: "Enterprise-grade services." },
    { icon: <Zap className="w-8 h-8 text-yellow-400" />, title: "Zero Downtime", desc: "Designed lounge areas." },
    { icon: <Car className="w-8 h-8 text-pink-500" />, title: "Valet Parking", desc: "Reserved slots with valet." },
  ];

  return (
    <div ref={containerRef} className="w-full min-h-screen bg-[#020202] text-white selection:bg-[#00f2fe] selection:text-black overflow-x-hidden">
      
      {/* 1. FIXED BACKGROUND ENGINE */}
      <ScrollCanvas frameCount={240} isLoaded={isLoaded} setIsLoaded={setIsLoaded} />
      
      {/* 2. HERO SECTION (STICKY OVERLAY) */}
      <section className="relative h-[250vh] z-10">
        <motion.div 
          style={{ scale: heroScale, opacity: heroOpacity, filter: `blur(${heroBlur}px)` }}
          className="sticky top-0 h-screen flex flex-col items-center justify-center text-center px-6"
        >
          <motion.span 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 text-[10px] font-black tracking-[0.6em] text-[#00f2fe] uppercase mb-8 border border-[#00f2fe]/30 px-5 py-2 rounded-full bg-[#00f2fe]/5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#00f2fe] animate-pulse" />
            14 Floors Above Ordinary
          </motion.span>
          
          <h1 className="text-[14vw] md:text-[10vw] font-black leading-[0.8] tracking-tighter uppercase italic">
            SKY<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f2fe] to-[#7000ff]">DESK360</span>
          </h1>

          <p className="text-gray-400 text-sm md:text-lg max-w-xl mx-auto mt-8 mb-12 font-medium">
            The world's first AI-integrated premium workspace. Luxury meets logic at Pune's premier altitude.
          </p>

          <button
            onClick={() => navigate(isLoggedIn ? '/book' : '/signin')}
            className="group relative bg-[#00f2fe] text-black px-12 py-5 rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all hover:pr-14"
          >
            Reserve Now <ArrowRight className="w-4 h-4 absolute right-5 opacity-0 group-hover:opacity-100 transition-all" />
          </button>
        </motion.div>
      </section>

      {/* 3. SCROLLING CONTENT BLOCKS */}
      <div className="relative z-20 w-full bg-[#020202]/80 backdrop-blur-sm shadow-[0_-50px_100px_rgba(0,0,0,1)]">
        
        {/* STATS */}
        <div className="py-24 border-b border-white/5 bg-white/[0.01]">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            <StatItem value="500+" label="Pioneer Members" />
            <StatItem value="10Gbps" label="Neural Fiber" />
            <StatItem value="24/7" label="Secure Access" />
            <StatItem value="14th" label="Floor Altitude" />
          </div>
        </div>

        {/* INTERACTIVE VIDEO PLAYER */}
        <section className="py-32 px-6">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
            <div className="lg:w-1/2">
               <h2 className="text-5xl md:text-6xl font-black italic uppercase mb-8">The <span className="text-[#00f2fe]">Walkthrough.</span></h2>
               <p className="text-gray-400 text-lg mb-8 font-light italic leading-relaxed">Control your perspective. Take a guided virtual flight through our 14th-floor ecosystem using the interactive controller.</p>
               <div className="h-px w-20 bg-[#00f2fe] mb-8" />
            </div>

            <div className="lg:w-1/2 flex justify-center">
              <div className="relative group w-full max-w-[320px] aspect-[9/18.5] bg-[#111] rounded-[3.5rem] border-[12px] border-white/5 shadow-2xl overflow-hidden glass ring-1 ring-white/10">
                <video 
                  ref={videoRef} onTimeUpdate={handleTimeUpdate} playsInline 
                  className="w-full h-full object-cover"
                >
                  <source src="/videos/office-tour.mp4" type="video/mp4" />
                </video>

                {/* Video Controls */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8">
                  <div className="w-full h-1 bg-white/20 rounded-full mb-8 overflow-hidden">
                    <motion.div className="h-full bg-[#00f2fe]" style={{ width: `${videoProgress}%` }} />
                  </div>
                  <div className="flex items-center justify-between mb-6">
                    <button onClick={() => skip(-5)}><Rewind size={24}/></button>
                    <button onClick={togglePlay} className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                      {isPlaying ? <Pause fill="white"/> : <Play fill="white" className="ml-1"/>}
                    </button>
                    <button onClick={() => skip(5)}><FastForward size={24}/></button>
                  </div>
                  <button onClick={() => videoRef.current.currentTime = 0} className="text-[8px] font-black text-gray-500 uppercase flex items-center justify-center gap-2"><RotateCcw size={12}/> Restart</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CURATED SPACES (Using PriceCard) */}
        <section id="pricing" className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-6xl font-black italic mb-20 text-center uppercase tracking-tighter">Curated <span className="text-[#00f2fe]">Nests.</span></h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
               <PriceCard title="Hot Desks" price="399" features={["Daily Access", "WiFi", "Coffee"]} />
               <PriceCard title="Private Cabins" price="25,000" highlight features={["Monthly", "Privacy", "Concierge"]} />
               <PriceCard title="Meeting Rooms" price="999" features={["Hourly", "Smart Screen", "Fiber"]} />
            </div>
          </div>
        </section>

        {/* AMENITIES */}
        <section className="py-32 px-6 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {amenities.map((item, i) => (
            <motion.div key={i} whileHover={{ y: -10 }} className="p-10 rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-md">
              <div className="mb-6">{item.icon}</div>
              <h3 className="text-xl font-bold mb-3 uppercase italic">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </section>

        {/* LOCATION WITH MAP */}
        <section id="location" className="py-32 px-6 max-w-7xl mx-auto">
          <div className="glass rounded-[4rem] border border-white/5 overflow-hidden flex flex-col lg:flex-row shadow-2xl">
            <div className="lg:w-1/2 p-20">
              <h2 className="text-5xl font-black mb-8 italic uppercase">The <span className="text-[#00f2fe]">Location.</span></h2>
              <p className="text-gray-400 mb-12 flex items-center gap-4"><MapPin className="text-[#00f2fe]"/> 14th Floor, Maruti Chowk, Baner, Pune</p>
              <button className="text-xs font-black uppercase tracking-widest text-[#00f2fe] flex items-center gap-4">Satellite Coordinates <ArrowRight/></button>
            </div>
            <div className="lg:w-1/2 h-[500px] grayscale brightness-50 contrast-125">
              <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={position} />
              </MapContainer>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
};

const StatItem = ({ value, label }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="text-center">
    <div className="text-5xl font-black mb-2 italic text-white uppercase tracking-tighter">{value}</div>
    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</div>
  </motion.div>
);

export default Home;
