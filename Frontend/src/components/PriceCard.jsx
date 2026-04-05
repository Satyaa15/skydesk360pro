import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PriceCard({ title, price, unit = 'session', features = [], highlight, accent = '#00f2fe' }) {
  const ref = useRef(null);
  const navigate = useNavigate();

  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(1000px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) scale3d(1.015,1.015,1.015)`;
  };
  const handleLeave = () => {
    if (ref.current) ref.current.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale3d(1,1,1)';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        ref={ref}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={{
          transition: 'transform 0.18s ease-out',
          willChange: 'transform',
          borderRadius: '24px',
          padding: '2px',
          background: highlight
            ? `linear-gradient(135deg, ${accent}, rgba(0,0,0,0))`
            : 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0))',
          boxShadow: highlight ? `0 0 60px ${accent}22` : 'none',
        }}
      >
        <div style={{
          background: highlight ? 'rgba(10,10,20,0.95)' : 'rgba(15,23,42,0.6)',
          borderRadius: '22px',
          padding: '2.25rem',
          backdropFilter: 'blur(24px)',
          position: 'relative',
          overflow: 'hidden',
          height: '100%',
          boxSizing: 'border-box',
        }}>
          {/* Top accent line */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
            background: highlight
              ? `linear-gradient(90deg, transparent, ${accent}, transparent)`
              : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
          }} />

          {/* Ambient glow */}
          {highlight && (
            <div style={{
              position: 'absolute', top: '-40px', right: '-40px',
              width: '160px', height: '160px', borderRadius: '50%',
              background: `radial-gradient(circle, ${accent}12 0%, transparent 70%)`,
              pointerEvents: 'none',
            }} />
          )}

          {/* Popular badge */}
          {highlight && (
            <div style={{
              position: 'absolute', top: '1.5rem', right: '1.5rem',
              fontSize: '0.52rem', fontWeight: 800, textTransform: 'uppercase',
              letterSpacing: '0.2em', color: '#000',
              background: `linear-gradient(135deg, ${accent}, #00f2fe)`,
              padding: '0.3rem 0.7rem', borderRadius: '999px',
            }}>
              Popular
            </div>
          )}

          {/* Title */}
          <p style={{
            fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '0.3em', color: '#334155', marginBottom: '1.25rem',
          }}>
            {title}
          </p>

          {/* Price */}
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: accent, alignSelf: 'flex-start', marginTop: '0.4rem' }}>₹</span>
              <span style={{
                fontSize: '3.2rem', fontWeight: 900, fontStyle: 'italic', lineHeight: 1,
                background: highlight ? `linear-gradient(135deg, ${accent}, #fff)` : `linear-gradient(135deg, #fff, #94a3b8)`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                {price}
              </span>
              <span style={{ fontSize: '0.72rem', color: '#334155', fontWeight: 600 }}>/{unit}</span>
            </div>
          </div>

          {/* Features */}
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {features.map((f) => (
              <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                <div style={{
                  width: '18px', height: '18px', borderRadius: '6px', flexShrink: 0,
                  background: `${accent}14`, border: `1px solid ${accent}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Check size={10} color={accent} strokeWidth={3} />
                </div>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>{f}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <button
            onClick={() => navigate('/book')}
            style={{
              width: '100%',
              padding: '0.9rem',
              borderRadius: '12px',
              border: highlight ? 'none' : `1px solid ${accent}30`,
              background: highlight ? `linear-gradient(135deg, ${accent}, ${accent}99)` : 'transparent',
              color: highlight ? '#000' : accent,
              fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase',
              letterSpacing: '0.18em', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              transition: 'all 0.25s ease',
              position: 'relative', overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              if (!highlight) {
                e.currentTarget.style.background = `${accent}12`;
                e.currentTarget.style.borderColor = accent;
              } else {
                e.currentTarget.style.boxShadow = `0 4px 24px ${accent}44`;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!highlight) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = `${accent}30`;
              } else {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            Get Started <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
