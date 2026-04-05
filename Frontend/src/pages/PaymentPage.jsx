import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, CreditCard, Smartphone, Building2,
  Lock, Check, Shield, Sparkles
} from 'lucide-react';
import { createPaymentOrderBatch, verifyPayment } from '../lib/api';

const DURATION_LABELS = { hourly: 'Hourly', daily: 'Daily', monthly: 'Monthly', yearly: 'Yearly' };

// Must stay in sync with backend pricing.SEAT_PRICES
const SEAT_PRICES = {
  workstation:  { hourly: 100,  daily: 400,   monthly: 7000  },
  cabin:        { hourly: 400,  daily: 2500,  monthly: 35000 },
  conference:   { hourly: 550,  daily: 4500,  monthly: 60000 },
  meeting_room: { hourly: 550,  daily: 4500,  monthly: 60000 },
};

const computeDurationPrice = (workspaceType, durationUnit, quantity = 1) => {
  const prices = SEAT_PRICES[workspaceType] || SEAT_PRICES.workstation;
  const rate = durationUnit === 'hourly' ? prices.hourly
    : durationUnit === 'daily'   ? prices.daily
    : durationUnit === 'yearly'  ? prices.monthly * 12 * 0.9
    : prices.monthly;
  return rate * quantity;
};

const formatPrice = (value) => {
  const rounded = Math.round(value * 100) / 100;
  return rounded.toLocaleString('en-IN');
};

const loadRazorpayScript = () => new Promise((resolve) => {
  if (window.Razorpay) { resolve(true); return; }
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.onload = () => resolve(true);
  script.onerror = () => resolve(false);
  document.body.appendChild(script);
});

/* ─── Shared input style ─── */
const inputSx = {
  width: '100%',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '12px',
  padding: '0.85rem 1.1rem',
  color: '#e2e8f0',
  fontSize: '0.875rem',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: "'Inter', sans-serif",
  transition: 'border-color 0.2s, box-shadow 0.2s',
};
const labelSx = {
  display: 'block',
  fontSize: '0.58rem',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.18em',
  color: '#334155',
  marginBottom: '0.45rem',
};
const onFocus = (e) => { e.target.style.borderColor = 'rgba(0,242,254,0.35)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,242,254,0.05)'; };
const onBlur  = (e) => { e.target.style.borderColor = 'rgba(255,255,255,0.07)'; e.target.style.boxShadow = 'none'; };

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { seats = [], durationUnit = 'monthly', durationQuantity = 1 } = location.state || {};
  const total = seats.reduce((sum, seat) => sum + computeDurationPrice(seat.workspaceType, durationUnit, durationQuantity), 0);

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [showSuccess, setShowSuccess] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [bookingIds, setBookingIds] = useState([]);
  const [error, setError] = useState('');

  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName]     = useState('');
  const [expiry, setExpiry]         = useState('');
  const [cvv, setCvv]               = useState('');
  const [upiId, setUpiId]           = useState('');
  const [selectedUpi, setSelectedUpi] = useState('');

  const user = (() => { try { return JSON.parse(sessionStorage.getItem('user') || '{}'); } catch { return {}; } })();

  useEffect(() => { if (!sessionStorage.getItem('token')) navigate('/signin'); }, [navigate]);

  const createBookingId = () => {
    if (globalThis.crypto?.randomUUID) return `SKY-${globalThis.crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase()}`;
    return `SKY-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  };

  const formatCardNumber = (v) => {
    const d = v.replace(/\D/g, '').slice(0, 16);
    return d.replace(/(.{4})/g, '$1 ').trim();
  };
  const formatExpiry = (v) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length >= 2 ? d.slice(0, 2) + '/' + d.slice(2) : d;
  };

  const handlePayment = async () => {
    if (processing || seats.length === 0) return;
    setProcessing(true);
    setError('');
    try {
      const seatIds = seats.map((s) => s.dbId).filter(Boolean);
      if (!seatIds.length) throw new Error('No seats linked to database.');
      const order = await createPaymentOrderBatch({ seat_ids: seatIds, duration_unit: durationUnit, duration_quantity: durationQuantity });
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error('Failed to load Razorpay checkout.');
      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'SkyDesk Pro',
        description: `${seatIds.length} seat(s) — ${durationQuantity} × ${DURATION_LABELS[durationUnit] || 'Monthly'}`,
        order_id: order.razorpay_order_id,
        prefill: { name: user?.full_name || '', email: user?.email || '' },
        theme: { color: '#00f2fe' },
        handler: async (response) => {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setBookingIds(order.booking_ids || []);
            setShowSuccess(true);
          } catch (err) {
            setError(err?.message || 'Payment verification failed.');
          } finally {
            setProcessing(false);
          }
        },
        modal: { ondismiss: () => setProcessing(false) },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => { setError(resp?.error?.description || 'Payment failed.'); setProcessing(false); });
      rzp.open();
    } catch (err) {
      setError(err?.message || 'Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  if (seats.length === 0 && !showSuccess) {
    return (
      <div style={{ minHeight: '100vh', background: '#020204', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.5rem', color: '#475569', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ fontSize: '3rem' }}>🪑</div>
        <p style={{ fontSize: '0.9rem' }}>No seats selected.</p>
        <button onClick={() => navigate('/book')} style={{ padding: '0.75rem 2rem', borderRadius: '999px', border: '1px solid rgba(0,242,254,0.3)', background: 'transparent', color: '#00f2fe', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer' }}>
          ← Back to Booking
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#020204', color: '#fff', fontFamily: "'Inter', sans-serif", paddingTop: '90px' }}>

      {/* ── Header ── */}
      <div style={{ textAlign: 'center', padding: '2rem 1.5rem 1rem' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p style={{ fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4em', color: '#334155', marginBottom: '0.6rem' }}>
            Secure Checkout
          </p>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.03em', lineHeight: 1, margin: 0 }}>
            Complete Your{' '}
            <span style={{
              background: 'linear-gradient(135deg, #00f2fe, #a855f7)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>Booking.</span>
          </h1>
        </motion.div>
      </div>

      {/* ── Two-column layout ── */}
      <div style={{ maxWidth: '940px', margin: '0 auto', padding: '1.5rem 1.5rem 4rem', display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* ── LEFT — Payment form ── */}
        <div style={{ flex: '1 1 420px' }}>
          <button
            onClick={() => navigate('/book')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'none', border: '1px solid rgba(255,255,255,0.07)',
              color: '#475569', fontSize: '0.62rem', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.15em',
              padding: '0.55rem 1.25rem', borderRadius: '999px', cursor: 'pointer',
              marginBottom: '1.75rem', transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,242,254,0.3)'; e.currentTarget.style.color = '#00f2fe'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#475569'; }}
          >
            <ArrowLeft size={13} /> Back to Seats
          </button>

          {/* Method tabs */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {[
              { id: 'card', icon: <CreditCard size={17} />, label: 'Card' },
              { id: 'upi', icon: <Smartphone size={17} />, label: 'UPI' },
              { id: 'netbanking', icon: <Building2 size={17} />, label: 'Net Banking' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setPaymentMethod(m.id)}
                style={{
                  flex: 1, padding: '0.9rem 0.5rem',
                  background: paymentMethod === m.id ? 'rgba(0,242,254,0.05)' : 'rgba(255,255,255,0.02)',
                  border: paymentMethod === m.id ? '1px solid rgba(0,242,254,0.3)' : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '14px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                }}
              >
                <div style={{ color: paymentMethod === m.id ? '#00f2fe' : '#334155', display: 'flex', justifyContent: 'center', marginBottom: '0.3rem' }}>{m.icon}</div>
                <div style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: paymentMethod === m.id ? '#00f2fe' : '#334155' }}>{m.label}</div>
              </button>
            ))}
          </div>

          {/* Form panel */}
          <AnimatePresence mode="wait">
            <motion.div
              key={paymentMethod}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '1.75rem' }}
            >
              {paymentMethod === 'card' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                  <div>
                    <label style={labelSx}>Card Number</label>
                    <input style={inputSx} type="text" placeholder="4242 4242 4242 4242" maxLength={19}
                      value={cardNumber} onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      onFocus={onFocus} onBlur={onBlur} />
                  </div>
                  <div>
                    <label style={labelSx}>Cardholder Name</label>
                    <input style={inputSx} type="text" placeholder="John Doe"
                      value={cardName} onChange={(e) => setCardName(e.target.value)}
                      onFocus={onFocus} onBlur={onBlur} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={labelSx}>Expiry</label>
                      <input style={inputSx} type="text" placeholder="MM/YY" maxLength={5}
                        value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                        onFocus={onFocus} onBlur={onBlur} />
                    </div>
                    <div>
                      <label style={labelSx}>CVV</label>
                      <input style={inputSx} type="password" placeholder="•••" maxLength={4}
                        value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                        onFocus={onFocus} onBlur={onBlur} />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'upi' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem', marginBottom: '1.25rem' }}>
                    {[{ name: 'GPay', e: '💳' }, { name: 'PhonePe', e: '📱' }, { name: 'Paytm', e: '💰' }, { name: 'BHIM', e: '🏛️' }].map((a) => (
                      <button key={a.name} onClick={() => setSelectedUpi(a.name)} style={{
                        padding: '0.75rem 0.4rem', borderRadius: '12px', cursor: 'pointer', textAlign: 'center',
                        background: selectedUpi === a.name ? 'rgba(0,242,254,0.06)' : 'rgba(255,255,255,0.02)',
                        border: selectedUpi === a.name ? '1px solid rgba(0,242,254,0.3)' : '1px solid rgba(255,255,255,0.06)',
                        transition: 'all 0.2s',
                      }}>
                        <div style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>{a.e}</div>
                        <div style={{ fontSize: '0.56rem', fontWeight: 700, color: selectedUpi === a.name ? '#00f2fe' : '#334155' }}>{a.name}</div>
                      </button>
                    ))}
                  </div>
                  <div>
                    <label style={labelSx}>UPI ID</label>
                    <input style={inputSx} type="text" placeholder="yourname@upi"
                      value={upiId} onChange={(e) => setUpiId(e.target.value)}
                      onFocus={onFocus} onBlur={onBlur} />
                  </div>
                </div>
              )}

              {paymentMethod === 'netbanking' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem', marginBottom: '1rem' }}>
                    {[{ name: 'SBI', e: '🏦' }, { name: 'HDFC', e: '🏧' }, { name: 'ICICI', e: '🏛️' }, { name: 'Axis', e: '💼' }].map((b) => (
                      <button key={b.name} onClick={() => setSelectedUpi(b.name)} style={{
                        padding: '0.75rem 0.4rem', borderRadius: '12px', cursor: 'pointer', textAlign: 'center',
                        background: selectedUpi === b.name ? 'rgba(0,242,254,0.06)' : 'rgba(255,255,255,0.02)',
                        border: selectedUpi === b.name ? '1px solid rgba(0,242,254,0.3)' : '1px solid rgba(255,255,255,0.06)',
                        transition: 'all 0.2s',
                      }}>
                        <div style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>{b.e}</div>
                        <div style={{ fontSize: '0.56rem', fontWeight: 700, color: selectedUpi === b.name ? '#00f2fe' : '#334155' }}>{b.name}</div>
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.72rem', color: '#334155', textAlign: 'center', marginTop: '0.5rem' }}>
                    You'll be redirected to your bank's secure portal.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Secure badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.25rem', color: '#1e293b', fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            <Lock size={11} />
            256-bit SSL · Razorpay Secured
          </div>
        </div>

        {/* ── RIGHT — Order Summary ── */}
        <div style={{ flex: '0 0 300px', position: 'sticky', top: '100px' }}>
          <div style={{
            background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.07)', borderRadius: '22px',
            padding: '1.75rem', position: 'relative', overflow: 'hidden',
          }}>
            {/* Top accent */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #00f2fe, #a855f7)' }} />

            <p style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#334155', marginBottom: '1.25rem' }}>
              Order Summary
            </p>

            {/* Seat list */}
            <div style={{ maxHeight: '220px', overflowY: 'auto', marginBottom: '1rem' }}>
              {seats.map((seat, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0' }}>{seat.id}</div>
                    <div style={{ fontSize: '0.6rem', color: '#334155', marginTop: '0.1rem' }}>{seat.zone}</div>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#00f2fe' }}>
                    ₹{formatPrice(computeDurationPrice(seat.price, durationUnit))}
                  </div>
                </div>
              ))}
            </div>

            {/* Duration */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#334155', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span>Billing</span>
              <span style={{ fontWeight: 700, color: '#475569' }}>{DURATION_LABELS[durationUnit] || 'Monthly'}</span>
            </div>

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#334155' }}>Total</span>
              <span style={{
                fontSize: '2rem', fontWeight: 900,
                background: 'linear-gradient(135deg, #00f2fe, #a855f7)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                ₹{formatPrice(total)}
              </span>
            </div>

            {/* Error */}
            {error && (
              <div style={{ marginBottom: '1rem', padding: '0.7rem 0.9rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', color: '#fca5a5', fontSize: '0.72rem', textAlign: 'center' }}>
                {error}
              </div>
            )}

            {/* Pay button */}
            <button
              onClick={handlePayment}
              disabled={processing || seats.length === 0}
              style={{
                width: '100%', padding: '1rem', borderRadius: '14px', border: 'none',
                background: processing ? 'rgba(0,242,254,0.2)' : 'linear-gradient(135deg, #00f2fe, #a855f7)',
                color: processing ? 'rgba(0,0,0,0.4)' : '#000',
                fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.18em',
                cursor: processing ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                boxShadow: processing ? 'none' : '0 4px 24px rgba(0,242,254,0.2)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => { if (!processing) { e.currentTarget.style.boxShadow = '0 6px 36px rgba(0,242,254,0.35)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,242,254,0.2)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {processing ? (
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block', fontSize: '1rem' }}>⏳</motion.span>
              ) : (
                <><Shield size={14} /> Pay ₹{formatPrice(total)}</>
              )}
            </button>

            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', fontSize: '0.56rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#1e293b' }}>
              <Sparkles size={10} />
              Powered by Razorpay
            </div>
          </div>
        </div>
      </div>

      {/* ── SUCCESS OVERLAY ── */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(2,2,4,0.88)', backdropFilter: 'blur(24px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1.5rem' }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              style={{
                width: '100%', maxWidth: '420px', textAlign: 'center',
                background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '28px', padding: '3rem',
                boxShadow: '0 40px 100px rgba(0,0,0,0.7)',
                position: 'relative', overflow: 'hidden',
              }}
            >
              {/* Top gradient accent */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #00f2fe, #a855f7)' }} />

              {/* Check icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                style={{
                  width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 1.75rem',
                  background: 'linear-gradient(135deg, rgba(0,242,254,0.15), rgba(168,85,247,0.15))',
                  border: '1px solid rgba(0,242,254,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 40px rgba(0,242,254,0.15)',
                }}
              >
                <Check size={36} color="#00f2fe" strokeWidth={2.5} />
              </motion.div>

              <h2 style={{ fontSize: '1.8rem', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
                Seat{seats.length > 1 ? 's' : ''}{' '}
                <span style={{ background: 'linear-gradient(135deg, #00f2fe, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Locked!</span>
              </h2>
              <p style={{ color: '#475569', fontSize: '0.82rem', marginBottom: '1.75rem', lineHeight: 1.65 }}>
                Your workspace is reserved. See you at the 14th floor.
              </p>

              {/* Booking ref */}
              <div style={{
                background: 'rgba(0,242,254,0.05)', border: '1px solid rgba(0,242,254,0.15)',
                borderRadius: '12px', padding: '0.75rem 1.25rem',
                fontSize: '0.65rem', fontWeight: 800, color: '#00f2fe',
                letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.75rem',
              }}>
                {bookingIds.length > 0 ? bookingIds.join(' · ') : createBookingId()}
              </div>

              <p style={{ fontSize: '0.65rem', color: '#334155', marginBottom: '2rem' }}>
                {seats.length} seat{seats.length > 1 ? 's' : ''} · ₹{formatPrice(total)} paid · {DURATION_LABELS[durationUnit]}
              </p>

              <button
                onClick={() => navigate('/')}
                style={{
                  width: '100%', padding: '0.95rem', borderRadius: '14px', border: 'none',
                  background: 'linear-gradient(135deg, #00f2fe, #a855f7)',
                  color: '#000', fontSize: '0.7rem', fontWeight: 900,
                  textTransform: 'uppercase', letterSpacing: '0.18em',
                  cursor: 'pointer', boxShadow: '0 4px 24px rgba(0,242,254,0.25)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 6px 40px rgba(0,242,254,0.4)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,242,254,0.25)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                Back to Home
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaymentPage;
