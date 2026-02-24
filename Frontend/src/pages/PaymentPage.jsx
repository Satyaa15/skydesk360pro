import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CreditCard, Smartphone, Building2, Lock, Check, Shield } from 'lucide-react';
import './BookingPage.css';

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { seats = [], total = 0 } = location.state || {};

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [showSuccess, setShowSuccess] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [bookingId, setBookingId] = useState('');

  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  // UPI state
  const [upiId, setUpiId] = useState('');
  const [selectedUpiApp, setSelectedUpiApp] = useState('');

  const createBookingId = () => {
    if (globalThis.crypto?.randomUUID) {
      return `SKY-${globalThis.crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase()}`;
    }
    return `SKY-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  };

  // Format card number with spaces
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : v;
  };

  // Format expiry date
  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) return v.substring(0, 2) + '/' + v.substring(2, 4);
    return v;
  };

  const handlePayment = () => {
    if (!canSubmitPayment) {
      return;
    }
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setBookingId(createBookingId());
      setShowSuccess(true);
    }, 2000);
  };

  const isCardReady = cardNumber.replace(/\s/g, '').length === 16 && cardName.trim() !== '' && expiry.length === 5 && cvv.length >= 3;
  const isUpiReady = upiId.includes('@') && selectedUpiApp !== '';
  const isNetBankingReady = selectedUpiApp !== '';
  const canSubmitPayment = paymentMethod === 'card'
    ? isCardReady
    : paymentMethod === 'upi'
      ? isUpiReady
      : isNetBankingReady;

  // If no seats passed, redirect back
  if (seats.length === 0 && !showSuccess) {
    return (
      <div className="payment-page">
        <div style={{ textAlign: 'center', paddingTop: '200px' }}>
          <p style={{ color: '#666', fontSize: '1rem', marginBottom: '2rem' }}>
            No seats selected. Please go back and select seats first.
          </p>
          <button className="back-btn" onClick={() => navigate('/book')}>
            <ArrowLeft size={14} /> Go to Booking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">

      {/* Header */}
      <div className="payment-header">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Secure <span>Payment</span>
        </motion.h1>
      </div>

      <div className="payment-container">
        {/* LEFT — Payment Form */}
        <div className="payment-left">
          <button className="back-btn" onClick={() => navigate('/book')}>
            <ArrowLeft size={14} /> Back to Seats
          </button>

          {/* Payment Method Tabs */}
          <div className="payment-methods">
            {[
              { id: 'card', icon: <CreditCard size={20} />, label: 'Card' },
              { id: 'upi', icon: <Smartphone size={20} />, label: 'UPI' },
              { id: 'netbanking', icon: <Building2 size={20} />, label: 'Net Banking' },
            ].map((method) => (
              <button
                key={method.id}
                className={`method-tab ${paymentMethod === method.id ? 'active' : ''}`}
                onClick={() => setPaymentMethod(method.id)}
              >
                <div className="method-tab-icon">{method.icon}</div>
                <div className="method-tab-label">{method.label}</div>
              </button>
            ))}
          </div>

          {/* Card Payment Form */}
          {paymentMethod === 'card' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="payment-form"
            >
              <div className="form-group">
                <label className="form-label">Card Number</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="4242 4242 4242 4242"
                  maxLength="19"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Cardholder Name</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="John Doe"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Expiry Date</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="MM/YY"
                    maxLength="5"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">CVV</label>
                  <input
                    className="form-input"
                    type="password"
                    placeholder="•••"
                    maxLength="4"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/[^0-9]/g, ''))}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* UPI Payment Form */}
          {paymentMethod === 'upi' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="payment-form"
            >
              <div className="upi-apps">
                {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => (
                  <button
                    key={app}
                    className={`upi-app ${selectedUpiApp === app ? 'active' : ''}`}
                    onClick={() => setSelectedUpiApp(app)}
                  >
                    <div className="upi-app-icon">
                      {app === 'GPay' && '💳'}
                      {app === 'PhonePe' && '📱'}
                      {app === 'Paytm' && '💰'}
                      {app === 'BHIM' && '🏛️'}
                    </div>
                    <div className="upi-app-name">{app}</div>
                  </button>
                ))}
              </div>

              <div className="form-group">
                <label className="form-label">UPI ID</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="yourname@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
              </div>
            </motion.div>
          )}

          {/* Net Banking */}
          {paymentMethod === 'netbanking' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="payment-form"
            >
              <div className="upi-apps">
                {[
                  { name: 'SBI', icon: '🏦' },
                  { name: 'HDFC', icon: '🏧' },
                  { name: 'ICICI', icon: '🏛️' },
                  { name: 'Axis', icon: '💼' },
                ].map((bank) => (
                  <button
                    key={bank.name}
                    className={`upi-app ${selectedUpiApp === bank.name ? 'active' : ''}`}
                    onClick={() => setSelectedUpiApp(bank.name)}
                  >
                    <div className="upi-app-icon">{bank.icon}</div>
                    <div className="upi-app-name">{bank.name}</div>
                  </button>
                ))}
              </div>
              <p style={{ color: '#555', fontSize: '0.75rem', textAlign: 'center', marginTop: '1rem' }}>
                You will be redirected to your bank's secure portal to complete the payment.
              </p>
            </motion.div>
          )}

          {/* Secure Badge */}
          <div className="secure-badge">
            <Lock size={12} />
            <span>256-bit SSL Encrypted • Secure Payment</span>
          </div>
        </div>

        {/* RIGHT — Order Summary */}
        <div className="payment-right">
          <div className="order-summary">
            <h3 className="order-title">Order Summary</h3>

            <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
              {seats.map((seat) => (
                <div key={seat.id} className="order-seat-item">
                  <div>
                    <div className="order-seat-name">{seat.id}</div>
                    <div style={{ fontSize: '0.6rem', color: '#444', marginTop: '0.15rem' }}>
                      {seat.zone}
                    </div>
                  </div>
                  <div className="order-seat-price">₹{seat.price.toLocaleString()}</div>
                </div>
              ))}
            </div>

            <div className="order-total">
              <span className="order-total-label">Total</span>
              <span className="order-total-amount">₹{total.toLocaleString()}</span>
            </div>

            <button
              className="pay-btn"
              onClick={handlePayment}
              disabled={processing || !canSubmitPayment}
            >
              {processing ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'inline-block' }}
                  >
                    ⏳
                  </motion.span>
                  Processing...
                </span>
              ) : (
                <>
                  <Shield size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }} />
                  Pay ₹{total.toLocaleString()}
                </>
              )}
            </button>

            <div className="secure-badge" style={{ marginTop: '1rem' }}>
              <Lock size={10} />
              <span>Powered by SkyDesk360 Payments</span>
            </div>
          </div>
        </div>
      </div>

      {/* ──── SUCCESS MODAL ──── */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="success-overlay"
          >
            <div className="success-modal">
              <div className="success-checkmark">
                <Check size={36} color="#00f2fe" strokeWidth={3} />
              </div>
              <h2>Booking Confirmed!</h2>
              <p>Your workspace has been reserved successfully.</p>
              <div className="booking-id">{bookingId}</div>
              <div style={{ marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.7rem', color: '#666' }}>
                  {seats.length} seat{seats.length > 1 ? 's' : ''} • ₹{total.toLocaleString()} paid
                </span>
              </div>
              <button
                className="go-home-btn"
                onClick={() => navigate('/')}
              >
                Go to Home
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaymentPage;
