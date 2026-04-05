import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * props:
 *   title    — "Dedicated Desk" | "Private Cabin" | "Conference Room"
 *   prices   — { hourly: '100', daily: '400', monthly: '7,000' }
 *   features — string[]
 *   highlight — bool (most-popular styling)
 *   accent   — CSS color string
 */
export default function PriceCard({ title, prices, features = [], highlight, accent = '#00f2fe' }) {
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
    if (ref.current)
      ref.current.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale3d(1,1,1)';
  };

  const rows = [
    { label: '/ hour', value: prices.hourly },
    { label: '/ day',  value: prices.daily  },
    { label: '/ month', value: prices.monthly },
  ];

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
          background: highlight ? 'rgba(10,10,20,0.97)' : 'rgba(15,23,42,0.6)',
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
              width: '180px', height: '180px', borderRadius: '50%',
              background: `radial-gradient(circle, ${accent}10 0%, transparent 70%)`,
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
              padding: '0.3rem 0.75rem', borderRadius: '999px',
            }}>
              Popular
            </div>
          )}

          {/* Title */}
          <p style={{
            fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '0.3em', color: '#334155', marginBottom: '1.5rem',
          }}>
            {title}
          </p>

          {/* Rate table */}
          <div style={{ marginBottom: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {rows.map(({ label, value }, i) => (
              <div
                key={label}
                style={{
                  display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                  padding: '0.6rem 0.9rem',
                  background: i === 2
                    ? (highlight ? `${accent}12` : 'rgba(255,255,255,0.03)')
                    : 'transparent',
                  borderRadius: '10px',
                  border: i === 2
                    ? `1px solid ${accent}20`
                    : '1px solid transparent',
                }}
              >
                <span style={{
                  fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.12em', color: '#334155',
                }}>
                  {label}
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.15rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: accent }}>₹</span>
                  <span style={{
                    fontSize: i === 2 ? '1.6rem' : '1.25rem',
                    fontWeight: 900,
                    fontStyle: 'italic',
                    lineHeight: 1,
                    background: i === 2
                      ? (highlight ? `linear-gradient(135deg, ${accent}, #fff)` : `linear-gradient(135deg, #fff, #94a3b8)`)
                      : 'none',
                    WebkitBackgroundClip: i === 2 ? 'text' : 'unset',
                    WebkitTextFillColor: i === 2 ? 'transparent' : '#64748b',
                    backgroundClip: i === 2 ? 'text' : 'unset',
                    color: i === 2 ? 'unset' : '#64748b',
                  }}>
                    {value}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Features */}
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {features.map((f) => (
              <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  width: '17px', height: '17px', borderRadius: '6px', flexShrink: 0,
                  background: `${accent}14`, border: `1px solid ${accent}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Check size={9} color={accent} strokeWidth={3} />
                </div>
                <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>{f}</span>
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
              whiteSpace: 'nowrap',
              transition: 'all 0.25s ease',
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
