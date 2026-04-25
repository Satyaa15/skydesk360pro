import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  Users,
  Calendar,
  CreditCard,
  Armchair,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Plus,
  Pencil,
  Save,
  X as CloseIcon,
  Lock,
  Unlock,
  ShieldCheck,
  Download,
  FileText,
  Eye,
  ShoppingCart,
  IndianRupee,
  Zap,
} from 'lucide-react';
import {
  fetchAdminStats,
  fetchAdminUsers,
  fetchAdminBookings,
  fetchAdminSeats,
  fetchAdminKYC,
  fetchKYCDocument,
  createAdminSeat,
  updateAdminSeat,
  lockAdminSeat,
  resetSeatAvailability,
  createAdminBookingOrder,
  verifyPayment,
} from '../lib/api';

const ADMIN_SEAT_PRICES = {
  workstation:  { hourly: 100,  daily: 500,   monthly: 7500  },
  cabin:        { hourly: 500,  daily: 2500,  monthly: 40000 },
  conference:   { hourly: 700,  daily: 4500,  monthly: 90000 },
  meeting_room: { hourly: 700,  daily: 4500,  monthly: 90000 },
};
const computeSeatPrice = (type, unit, qty = 1) => {
  const prices = ADMIN_SEAT_PRICES[type] || ADMIN_SEAT_PRICES.workstation;
  const rate = unit === 'hourly' ? prices.hourly : unit === 'daily' ? prices.daily : prices.monthly;
  return rate * qty;
};

const loadRazorpayScript = () => new Promise((resolve) => {
  if (window.Razorpay) { resolve(true); return; }
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.onload = () => resolve(true);
  script.onerror = () => resolve(false);
  document.body.appendChild(script);
});

const AdminCRM = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Live data state
  const [stats, setStats] = useState({ total_users: 0, total_bookings: 0, total_seats: 0, available_seats: 0 });
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [seats, setSeats] = useState([]);
  const [seatActionError, setSeatActionError] = useState(null);
  const [seatActionSuccess, setSeatActionSuccess] = useState(null);

  const [editingSeatId, setEditingSeatId] = useState(null);
  const [editingSeat, setEditingSeat] = useState({ code: '', type: 'workstation', section: '', price: '', is_available: true });
  const [newSeat, setNewSeat] = useState({ code: '', type: 'workstation', section: '', price: '', is_available: true });

  // KYC state
  const [kycRecords, setKycRecords] = useState([]);
  const [kycLoading, setKycLoading] = useState(false);
  const [kycDocModal, setKycDocModal] = useState(null); // { name, data }
  const [kycDocLoading, setKycDocLoading] = useState(false);

  // Confirmation dialog for destructive admin actions
  const [confirmDialog, setConfirmDialog] = useState(null); // { seat, action: 'lock' | 'force-release' }
  // Timed lock dialog
  const [lockDialog, setLockDialog] = useState(null); // { seat }
  const [lockUntilInput, setLockUntilInput] = useState('');

  // Admin manual booking state
  const [adminSelectedIds, setAdminSelectedIds] = useState([]);
  const [adminDurationUnit, setAdminDurationUnit] = useState('monthly');
  const [adminDurationQty, setAdminDurationQty] = useState(1);
  const [adminUseCustom, setAdminUseCustom] = useState(false);
  const [adminCustomAmount, setAdminCustomAmount] = useState('');
  const [adminBookingLoading, setAdminBookingLoading] = useState(false);
  const [adminBookingError, setAdminBookingError] = useState(null);
  const [adminBookingSuccess, setAdminBookingSuccess] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, usersData, bookingsData, seatsData] = await Promise.all([
        fetchAdminStats(),
        fetchAdminUsers(),
        fetchAdminBookings(),
        fetchAdminSeats(),
      ]);
      setStats(statsData);
      setUsers(usersData);
      setBookings(bookingsData);
      setSeats(seatsData);
    } catch (err) {
      setError(err.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadKYC = useCallback(async () => {
    setKycLoading(true);
    try {
      const data = await fetchAdminKYC();
      setKycRecords(data);
    } catch {
      // KYC endpoint failing shouldn't crash the whole panel
    } finally {
      setKycLoading(false);
    }
  }, []);

  const viewKYCDocument = async (userId) => {
    setKycDocLoading(true);
    try {
      const doc = await fetchKYCDocument(userId);
      setKycDocModal(doc);
    } catch (err) {
      alert(err.message || 'Failed to load document');
    } finally {
      setKycDocLoading(false);
    }
  };

  const exportKYCToExcel = () => {
    const rows = kycRecords.map((u) => ({
      'Full Name': u.full_name,
      'Email': u.email,
      'Mobile': u.mobile || '—',
      'Gov ID Type': u.gov_id_type,
      'Gov ID Number': u.gov_id_number,
      'Occupation Sector': u.occupation_sector || '—',
      'Role / Designation': u.occupation_role || '—',
      'Document Uploaded': u.has_document ? 'Yes' : 'No',
      'Document Name': u.kyc_document_name || '—',
      'Registered On': new Date(u.created_at).toLocaleDateString('en-IN'),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    // Auto-width columns
    const colWidths = Object.keys(rows[0] || {}).map((k) => ({
      wch: Math.max(k.length, ...rows.map((r) => String(r[k] || '').length)) + 2,
    }));
    ws['!cols'] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'KYC Records');
    XLSX.writeFile(wb, `SkyDesk360_KYC_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeTab === 'kyc' && kycRecords.length === 0) loadKYC();
  }, [activeTab, loadKYC, kycRecords.length]);

  // Search filter
  const filteredUsers = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBookings = bookings.filter(
    (b) =>
      b.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.seat_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSeats = seats.filter((s) => {
    const query = searchQuery.toLowerCase();
    return (
      (s.code || '').toLowerCase().includes(query) ||
      (s.section || '').toLowerCase().includes(query) ||
      (s.type || '').toLowerCase().includes(query)
    );
  });

  const occupiedSeats = stats.total_seats - stats.available_seats;
  const occupancyPct = stats.total_seats > 0 ? Math.round((occupiedSeats / stats.total_seats) * 100) : 0;

  const startEditSeat = (seat) => {
    setEditingSeatId(seat.id);
    setEditingSeat({
      code: seat.code,
      type: seat.type,
      section: seat.section,
      price: seat.price,
      is_available: seat.is_available,
    });
  };

  const cancelEditSeat = () => {
    setEditingSeatId(null);
    setEditingSeat({ code: '', type: 'workstation', section: '', price: '', is_available: true });
  };

  const handleCreateSeat = async () => {
    setSeatActionError(null);
    setSeatActionSuccess(null);
    try {
      const payload = {
        code: newSeat.code.trim(),
        type: newSeat.type,
        section: newSeat.section.trim(),
        price: Number(newSeat.price),
        is_available: !!newSeat.is_available,
      };
      if (!payload.code || !payload.section || Number.isNaN(payload.price)) {
        setSeatActionError('Please fill seat code, section, and price.');
        return;
      }
      const created = await createAdminSeat(payload);
      setSeats((prev) => [created, ...prev]);
      setNewSeat({ code: '', type: 'workstation', section: '', price: '', is_available: true });
      setSeatActionSuccess('Seat created successfully.');
      loadData();
    } catch (err) {
      setSeatActionError(err.message || 'Failed to create seat');
    }
  };

  const handleSaveSeat = async () => {
    if (!editingSeatId) return;
    setSeatActionError(null);
    setSeatActionSuccess(null);
    try {
      const payload = {
        code: editingSeat.code.trim(),
        type: editingSeat.type,
        section: editingSeat.section.trim(),
        price: Number(editingSeat.price),
        is_available: !!editingSeat.is_available,
      };
      if (!payload.code || !payload.section || Number.isNaN(payload.price)) {
        setSeatActionError('Please fill seat code, section, and price.');
        return;
      }
      const updated = await updateAdminSeat(editingSeatId, payload);
      setSeats((prev) => prev.map((seat) => (seat.id === editingSeatId ? updated : seat)));
      setSeatActionSuccess('Seat updated.');
      cancelEditSeat();
      loadData();
    } catch (err) {
      setSeatActionError(err.message || 'Failed to update seat');
    }
  };

  const handleToggleAvailability = async (seat) => {
    setSeatActionError(null);
    setSeatActionSuccess(null);
    try {
      const updated = await updateAdminSeat(seat.id, { is_available: !seat.is_available });
      setSeats((prev) => prev.map((s) => (s.id === seat.id ? updated : s)));
      setSeatActionSuccess(`Seat ${updated.code} ${updated.is_available ? 'unlocked — now visible & bookable by users.' : 'locked — hidden from user booking map.'}`);
      loadData();
    } catch (err) {
      setSeatActionError(err.message || 'Failed to update availability');
    }
  };

  // Force-release: overrides any lock type including active customer bookings
  const handleForceRelease = async (seat) => {
    setSeatActionError(null);
    setSeatActionSuccess(null);
    setConfirmDialog(null);
    try {
      const updated = await updateAdminSeat(seat.id, { is_available: true, locked_until: null });
      setSeats((prev) => prev.map((s) => (s.id === seat.id ? updated : s)));
      setSeatActionSuccess(`Seat ${updated.code} force-released by admin — seat is now open for booking.`);
      loadData();
    } catch (err) {
      setSeatActionError(err.message || 'Failed to force-release seat');
    }
  };

  const handleTimedLock = async () => {
    if (!lockDialog || !lockUntilInput) return;
    setSeatActionError(null);
    setSeatActionSuccess(null);
    try {
      const isoDate = new Date(lockUntilInput).toISOString();
      const updated = await lockAdminSeat(lockDialog.seat.id, isoDate);
      setSeats((prev) => prev.map((s) => (s.id === lockDialog.seat.id ? updated : s)));
      setSeatActionSuccess(`Seat ${updated.code} manually locked until ${new Date(isoDate).toLocaleString('en-IN')}.`);
      setLockDialog(null);
      setLockUntilInput('');
      loadData();
    } catch (err) {
      setSeatActionError(err.message || 'Failed to apply timed lock');
    }
  };

  const handleManualUnlock = async (seat) => {
    setSeatActionError(null);
    setSeatActionSuccess(null);
    try {
      const updated = await lockAdminSeat(seat.id, null);
      setSeats((prev) => prev.map((s) => (s.id === seat.id ? updated : s)));
      setSeatActionSuccess(`Manual lock removed from ${updated.code}. Seat is now available.`);
      loadData();
    } catch (err) {
      setSeatActionError(err.message || 'Failed to remove manual lock');
    }
  };

  const handleResetAvailability = async () => {
    setSeatActionError(null);
    setSeatActionSuccess(null);
    try {
      await resetSeatAvailability();
      setSeatActionSuccess('All seats marked available.');
      loadData();
    } catch (err) {
      setSeatActionError(err.message || 'Failed to reset availability');
    }
  };

  const handleAdminPayment = async () => {
    if (adminBookingLoading || adminSelectedIds.length === 0) return;
    setAdminBookingLoading(true);
    setAdminBookingError(null);
    try {
      const payload = {
        seat_ids: adminSelectedIds,
        duration_unit: adminDurationUnit,
        duration_quantity: adminDurationQty,
        custom_amount: adminUseCustom && adminCustomAmount ? Number(adminCustomAmount) : null,
      };
      const order = await createAdminBookingOrder(payload);
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error('Failed to load Razorpay checkout.');

      const adminUser = (() => { try { return JSON.parse(sessionStorage.getItem('user') || '{}'); } catch { return {}; } })();
      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'SkyDesk Pro',
        description: `Admin booking: ${adminSelectedIds.length} seat(s) — ${adminDurationQty}× ${adminDurationUnit}`,
        order_id: order.razorpay_order_id,
        prefill: { name: adminUser?.full_name || '', email: adminUser?.email || '' },
        theme: { color: '#00f2fe' },
        config: {
          display: {
            blocks: {
              qr: { name: 'Scan & Pay (QR)', instruments: [{ method: 'upi', flows: ['qr'] }] },
            },
            sequence: ['block.qr'],
            preferences: { show_default_blocks: true },
          },
        },
        handler: async (response) => {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setAdminBookingSuccess({ bookingIds: order.booking_ids, amount: order.computed_amount });
            setAdminSelectedIds([]);
            setAdminCustomAmount('');
            setAdminUseCustom(false);
            loadData();
          } catch (err) {
            setAdminBookingError(err?.message || 'Payment verification failed.');
          } finally {
            setAdminBookingLoading(false);
          }
        },
        modal: { ondismiss: () => setAdminBookingLoading(false) },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        setAdminBookingError(resp?.error?.description || 'Payment failed.');
        setAdminBookingLoading(false);
      });
      rzp.open();
    } catch (err) {
      setAdminBookingError(err?.message || 'Failed to initiate booking.');
      setAdminBookingLoading(false);
    }
  };

  const adminAvailableSeats = seats.filter((s) => s.is_available && !s.is_locked);
  const adminSelectedSeats = adminAvailableSeats.filter((s) => adminSelectedIds.includes(s.id));
  const adminComputedTotal = adminSelectedSeats.reduce(
    (sum, s) => sum + computeSeatPrice(s.type, adminDurationUnit, adminDurationQty), 0
  );
  const adminFinalAmount = adminUseCustom && adminCustomAmount && Number(adminCustomAmount) > 0
    ? Number(adminCustomAmount)
    : adminComputedTotal;

  const emptyColSpan = activeTab === 'bookings' ? 8 : activeTab === 'seats' ? 6 : 5;

  return (
    <div className="min-h-screen text-white pt-20 sm:pt-24 px-3 sm:px-6 md:px-12 pb-20" style={{ background: '#020204', fontFamily: "'Inter', sans-serif" }}>
      {/* Ambient background */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(0,242,254,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(0,242,254,0.015) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none', zIndex: 0 }} />

      <div className="max-w-7xl mx-auto" style={{ position: 'relative', zIndex: 1 }}>
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <p style={{ fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.35em', color: '#334155', marginBottom: '0.6rem' }}>
              Admin Panel
            </p>
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.03em', lineHeight: 1, margin: 0 }}>
              Command{' '}
              <span style={{ background: 'linear-gradient(135deg, #00f2fe, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Centre.
              </span>
            </h1>
            <p style={{ color: '#334155', fontSize: '0.78rem', marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Shield size={13} color="#00f2fe" /> Live system dashboard
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.7rem 1.5rem', borderRadius: '999px',
              background: 'linear-gradient(135deg, rgba(0,242,254,0.1), rgba(168,85,247,0.1))',
              border: '1px solid rgba(0,242,254,0.2)',
              color: '#00f2fe', fontSize: '0.62rem', fontWeight: 800,
              textTransform: 'uppercase', letterSpacing: '0.15em', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1, transition: 'all 0.2s',
            }}
          >
            {loading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={13} />}
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '14px', padding: '0.9rem 1.25rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#fca5a5', fontSize: '0.8rem' }}>
            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
            <span>{error}</span>
            <button onClick={loadData} style={{ marginLeft: 'auto', fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#fca5a5', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              Retry
            </button>
          </div>
        )}

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <StatCard title="Total Users"     value={stats.total_users}     icon={<Users size={18} />}    accent="#a855f7" />
          <StatCard title="Total Bookings"  value={stats.total_bookings}  icon={<Calendar size={18} />} accent="#00f2fe" />
          <StatCard title="Total Seats"     value={stats.total_seats}     icon={<Armchair size={18} />} accent="#22c55e" />
          <StatCard title="Occupancy"       value={`${occupancyPct}%`}    icon={<CreditCard size={18}/>} accent="#f97316" sub={`${stats.available_seats} available`} />
        </div>

        {/* ── Data Panel ── */}
        <div style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', overflow: 'hidden', backdropFilter: 'blur(24px)' }}>
          {/* Tab bar */}
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              {[
                { id: 'users',       label: 'Users',       count: users.length },
                { id: 'bookings',    label: 'Bookings',    count: bookings.length },
                { id: 'seats',       label: 'Seats',       count: seats.length },
                { id: 'kyc',         label: 'KYC',         count: kycRecords.length, accent: '#a855f7' },
                { id: 'new-booking', label: 'New Booking', count: adminAvailableSeats.length, accent: '#22c55e' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    padding: '0.5rem 1.1rem', borderRadius: '999px', cursor: 'pointer',
                    fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em',
                    transition: 'all 0.2s',
                    background: activeTab === t.id ? `rgba(${t.accent === '#a855f7' ? '168,85,247' : t.accent === '#22c55e' ? '34,197,94' : '0,242,254'},0.08)` : 'transparent',
                    border: activeTab === t.id ? `1px solid rgba(${t.accent === '#a855f7' ? '168,85,247' : t.accent === '#22c55e' ? '34,197,94' : '0,242,254'},0.25)` : '1px solid transparent',
                    color: activeTab === t.id ? (t.accent || '#00f2fe') : '#334155',
                  }}
                >
                  {t.label}
                  <span style={{
                    marginLeft: '0.4rem', fontSize: '0.52rem', fontWeight: 900,
                    background: activeTab === t.id ? `rgba(${t.accent === '#a855f7' ? '168,85,247' : t.accent === '#22c55e' ? '34,197,94' : '0,242,254'},0.15)` : 'rgba(255,255,255,0.05)',
                    borderRadius: '999px', padding: '0.1rem 0.45rem',
                    color: activeTab === t.id ? (t.accent || '#00f2fe') : '#1e293b',
                  }}>
                    {t.count}
                  </span>
                </button>
              ))}
            </div>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#334155', width: '14px', height: '14px' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '999px', padding: '0.55rem 1rem 0.55rem 2.5rem',
                  color: '#e2e8f0', fontSize: '0.75rem', outline: 'none', width: '220px',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(0,242,254,0.3)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.07)')}
              />
            </div>
          </div>

          {activeTab === 'seats' && (
            <div className="px-8 py-6 border-b border-white/5 bg-white/[0.01]">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-white">Seat Control Center</h3>
                  <p className="text-xs text-gray-500 mt-1">Create, edit, and toggle availability in real time.</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={handleResetAvailability}
                    className="bg-white/5 border border-white/10 px-4 py-2 rounded-full text-[10px] uppercase tracking-widest font-black text-gray-200 hover:border-emerald-400/50 transition"
                  >
                    Reset Availability
                  </button>
                </div>
              </div>

              {(seatActionError || seatActionSuccess) && (
                <div className={`mt-4 px-4 py-3 rounded-xl text-xs border ${
                  seatActionError
                    ? 'border-red-500/30 bg-red-500/10 text-red-300'
                    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                }`}>
                  {seatActionError || seatActionSuccess}
                </div>
              )}

              <div className="mt-6 grid grid-cols-1 lg:grid-cols-6 gap-3">
                <input
                  value={newSeat.code}
                  onChange={(e) => setNewSeat({ ...newSeat, code: e.target.value })}
                  placeholder="Seat Code"
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                />
                <select
                  value={newSeat.type}
                  onChange={(e) => setNewSeat({ ...newSeat, type: e.target.value })}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="workstation">Workstation</option>
                  <option value="cabin">Cabin</option>
                  <option value="meeting_room">Meeting Room</option>
                  <option value="conference">Conference</option>
                </select>
                <input
                  value={newSeat.section}
                  onChange={(e) => setNewSeat({ ...newSeat, section: e.target.value })}
                  placeholder="Section"
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                />
                <input
                  value={newSeat.price}
                  onChange={(e) => setNewSeat({ ...newSeat, price: e.target.value })}
                  placeholder="Price"
                  type="number"
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                />
                <label className="flex items-center gap-2 text-xs text-gray-400">
                  <input
                    type="checkbox"
                    checked={newSeat.is_available}
                    onChange={(e) => setNewSeat({ ...newSeat, is_available: e.target.checked })}
                    className="accent-blue-500"
                  />
                  Available
                </label>
                <button
                  onClick={handleCreateSeat}
                  className="bg-blue-600 text-white rounded-lg px-4 py-2 text-[10px] uppercase tracking-widest font-black flex items-center justify-center gap-2 hover:bg-blue-500 transition"
                >
                  <Plus size={12} /> Add Seat
                </button>
              </div>
            </div>
          )}

          {activeTab !== 'kyc' && activeTab !== 'new-booking' && loading ? (
            <div className="flex items-center justify-center py-20 text-gray-500">
              <Loader2 size={24} className="animate-spin mr-3" /> Loading live data...
            </div>
          ) : activeTab !== 'kyc' && activeTab !== 'new-booking' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  {activeTab === 'users' && (
                    <tr className="border-b border-white/5 bg-white/[0.01]">
                      <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Name</th>
                      <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Email</th>
                      <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Role</th>
                      <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Status</th>
                      <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Registered</th>
                    </tr>
                  )}
                  {activeTab === 'bookings' && (
                    <tr className="border-b border-white/5 bg-white/[0.01]">
                      <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">ID</th>
                      <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Customer</th>
                      <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Seat</th>
                      <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Duration</th>
                      <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Amount</th>
                      <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Payment</th>
                      <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Lock Start</th>
                      <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Lock Until</th>
                    </tr>
                  )}
                  {activeTab === 'seats' && (
                    <tr className="border-b border-white/5 bg-white/[0.01]">
                      <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Code</th>
                      <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Type</th>
                      <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Section</th>
                      <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Price</th>
                      <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Availability</th>
                      <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Actions</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {activeTab === 'users' &&
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                        <td className="px-8 py-5 text-sm font-bold">{user.full_name}</td>
                        <td className="px-8 py-5 text-sm text-gray-400">{user.email}</td>
                        <td className="px-8 py-5">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black tracking-widest border ${
                            user.role === 'admin'
                              ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                              : 'bg-white/5 border-white/10 text-gray-400'
                          }`}>
                            {user.role === 'admin' && <Shield size={10} />}
                            {user.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black tracking-widest border ${
                            user.is_active
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : 'bg-red-500/10 border-red-500/20 text-red-400'
                          }`}>
                            {user.is_active ? <CheckCircle size={10} /> : <XCircle size={10} />}
                            {user.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}

                  {activeTab === 'bookings' &&
                    filteredBookings.map((booking) => (
                      <tr key={booking.id} className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors group relative ${booking.status === 'paid' ? 'bg-emerald-500/[0.02]' : ''}`}>
                        <td className="px-8 py-5">
                          {booking.status === 'paid' && (
                            <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-emerald-500/40 rounded-r" />
                          )}
                          <span className="text-xs font-mono text-blue-400/80">{booking.id.slice(0, 8)}…</span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="text-sm font-bold text-white">{booking.user_name}</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">{booking.user_email}</div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-md text-[10px] font-black text-blue-300 tracking-wider">
                            {booking.seat_code}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-xs text-gray-400">
                          {booking.duration_quantity} {booking.duration_unit}
                        </td>
                        <td className="px-8 py-5 text-sm font-bold text-white">
                          ₹{Number(booking.amount || 0).toLocaleString()}
                        </td>
                        <td className="px-8 py-5">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black tracking-widest border ${
                            booking.status === 'paid'
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : booking.status === 'pending'
                                ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                                : 'bg-red-500/10 border-red-500/20 text-red-400'
                          }`}>
                            {booking.status === 'paid' && <CheckCircle size={10} />}
                            {booking.status === 'pending' && <Clock size={10} />}
                            {booking.status === 'cancelled' && <XCircle size={10} />}
                            {booking.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-xs text-gray-500">
                          {booking.start_time
                            ? new Date(booking.start_time).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </td>
                        <td className="px-8 py-5 text-xs text-gray-500">
                          {booking.end_time
                            ? new Date(booking.end_time).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </td>
                      </tr>
                    ))}

                  {activeTab === 'seats' &&
                    filteredSeats.map((seat) => (
                      <tr key={seat.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-8 py-5 text-sm font-mono text-blue-400">
                          {editingSeatId === seat.id ? (
                            <input
                              value={editingSeat.code}
                              onChange={(e) => setEditingSeat({ ...editingSeat, code: e.target.value })}
                              className="bg-white/10 border border-white/10 rounded-md px-2 py-1 text-xs"
                            />
                          ) : (
                            seat.code
                          )}
                        </td>
                        <td className="px-8 py-5 text-sm text-gray-400">
                          {editingSeatId === seat.id ? (
                            <select
                              value={editingSeat.type}
                              onChange={(e) => setEditingSeat({ ...editingSeat, type: e.target.value })}
                              className="bg-white/10 border border-white/10 rounded-md px-2 py-1 text-xs"
                            >
                              <option value="workstation">Workstation</option>
                              <option value="cabin">Cabin</option>
                              <option value="meeting_room">Meeting Room</option>
                              <option value="conference">Conference</option>
                            </select>
                          ) : (
                            seat.type.replace('_', ' ')
                          )}
                        </td>
                        <td className="px-8 py-5 text-sm text-gray-400">
                          {editingSeatId === seat.id ? (
                            <input
                              value={editingSeat.section}
                              onChange={(e) => setEditingSeat({ ...editingSeat, section: e.target.value })}
                              className="bg-white/10 border border-white/10 rounded-md px-2 py-1 text-xs w-48"
                            />
                          ) : (
                            seat.section
                          )}
                        </td>
                        <td className="px-8 py-5 text-sm text-gray-400">
                          {editingSeatId === seat.id ? (
                            <input
                              value={editingSeat.price}
                              onChange={(e) => setEditingSeat({ ...editingSeat, price: e.target.value })}
                              type="number"
                              className="bg-white/10 border border-white/10 rounded-md px-2 py-1 text-xs w-24"
                            />
                          ) : (
                            `₹${seat.price.toLocaleString()}`
                          )}
                        </td>
                        {/* ── Status badge (read-only) ── */}
                        <td className="px-8 py-5">
                          {seat.is_locked ? (
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black tracking-widest border bg-orange-500/10 border-orange-500/20 text-orange-300">
                                <Clock size={10} /> BOOKING LOCKED
                              </span>
                              {seat.locked_until && (
                                <span className="text-[10px] text-orange-200/60">
                                  Until {new Date(seat.locked_until).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                          ) : seat.is_available ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black tracking-widest border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                              <CheckCircle size={10} /> AVAILABLE
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black tracking-widest border bg-red-500/10 border-red-500/20 text-red-400">
                              <Lock size={10} /> ADMIN LOCKED
                            </span>
                          )}
                        </td>

                        {/* ── Actions: Edit + Lock / Unlock / Force Release ── */}
                        <td className="px-8 py-5">
                          {editingSeatId === seat.id ? (
                            <div className="flex items-center gap-3">
                              <button
                                onClick={handleSaveSeat}
                                className="text-xs uppercase font-black tracking-widest text-emerald-400 flex items-center gap-1 hover:text-emerald-300 transition-colors"
                              >
                                <Save size={12} /> Save
                              </button>
                              <button
                                onClick={cancelEditSeat}
                                className="text-xs uppercase font-black tracking-widest text-gray-500 flex items-center gap-1 hover:text-gray-400 transition-colors"
                              >
                                <CloseIcon size={12} /> Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-4">
                              <button
                                onClick={() => startEditSeat(seat)}
                                className="text-xs uppercase font-black tracking-widest text-blue-400 flex items-center gap-1 hover:text-blue-300 transition-colors"
                              >
                                <Pencil size={12} /> Edit
                              </button>

                              {seat.is_locked ? (
                                /* Booking-locked (active payment) OR manually locked — show unlock options */
                                <>
                                  <button
                                    onClick={() => handleManualUnlock(seat)}
                                    className="text-xs uppercase font-black tracking-widest text-emerald-400 flex items-center gap-1 hover:text-emerald-300 transition-colors"
                                    title="Remove manual timed lock"
                                  >
                                    <Unlock size={12} /> Unlock
                                  </button>
                                  <button
                                    onClick={() => setConfirmDialog({ seat, action: 'force-release' })}
                                    className="text-xs uppercase font-black tracking-widest text-orange-400 flex items-center gap-1 hover:text-orange-300 transition-colors"
                                    title="Force-release — overrides any lock including active bookings"
                                  >
                                    Force Release
                                  </button>
                                </>
                              ) : seat.is_available ? (
                                /* Available — admin can permanently lock or set a timed lock */
                                <>
                                  <button
                                    onClick={() => { setLockDialog({ seat }); setLockUntilInput(''); }}
                                    className="text-xs uppercase font-black tracking-widest text-yellow-400 flex items-center gap-1 hover:text-yellow-300 transition-colors"
                                    title="Set a timed lock — seat auto-unlocks after the chosen time"
                                  >
                                    <Clock size={12} /> Timed Lock
                                  </button>
                                  <button
                                    onClick={() => handleToggleAvailability(seat)}
                                    className="text-xs uppercase font-black tracking-widest text-red-400 flex items-center gap-1 hover:text-red-300 transition-colors"
                                    title="Permanent lock — seat hidden from booking until manually unlocked"
                                  >
                                    <Lock size={12} /> Perm Lock
                                  </button>
                                </>
                              ) : (
                                /* Permanently admin-locked — unlock */
                                <button
                                  onClick={() => setConfirmDialog({ seat, action: 'force-release' })}
                                  className="text-xs uppercase font-black tracking-widest text-emerald-400 flex items-center gap-1 hover:text-emerald-300 transition-colors"
                                  title="Unlock this seat"
                                >
                                  <Unlock size={12} /> Unlock
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}

                  {((activeTab === 'users' && filteredUsers.length === 0) ||
                    (activeTab === 'bookings' && filteredBookings.length === 0) ||
                    (activeTab === 'seats' && filteredSeats.length === 0)) && (
                    <tr>
                      <td colSpan={emptyColSpan} className="px-8 py-16 text-center text-gray-500 text-sm">
                        {searchQuery ? 'No results match your search.' : 'No data yet.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : null}
        {/* ── KYC Panel ── */}
        {activeTab === 'kyc' && (
          <div>
            {/* KYC toolbar */}
            <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', background: 'rgba(168,85,247,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <ShieldCheck size={16} color="#a855f7" />
                <span style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#a855f7' }}>KYC Verification Records</span>
                <span style={{ fontSize: '0.58rem', fontWeight: 700, background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '999px', padding: '0.15rem 0.55rem', color: '#a855f7' }}>
                  {kycRecords.length} users
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={loadKYC}
                  disabled={kycLoading}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.1rem', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#64748b', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', cursor: kycLoading ? 'not-allowed' : 'pointer' }}
                >
                  {kycLoading ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={11} />}
                  Refresh
                </button>
                <button
                  onClick={exportKYCToExcel}
                  disabled={kycRecords.length === 0}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem', borderRadius: '999px', border: '1px solid rgba(168,85,247,0.3)', background: 'rgba(168,85,247,0.08)', color: '#a855f7', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', cursor: kycRecords.length === 0 ? 'not-allowed' : 'pointer', opacity: kycRecords.length === 0 ? 0.4 : 1 }}
                >
                  <Download size={12} /> Export Excel
                </button>
              </div>
            </div>

            {kycLoading ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: '#334155', fontSize: '0.8rem' }}>
                <Loader2 size={22} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem', display: 'block', color: '#a855f7' }} />
                Loading KYC records…
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
                      {['Name', 'Email', 'Mobile', 'Gov ID', 'Sector', 'Role', 'Document', 'Registered'].map((h) => (
                        <th key={h} style={{ padding: '0.85rem 1.25rem', textAlign: 'left', fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#334155', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {kycRecords.length === 0 ? (
                      <tr><td colSpan={8} style={{ padding: '4rem', textAlign: 'center', color: '#334155', fontSize: '0.8rem' }}>No KYC records yet.</td></tr>
                    ) : kycRecords.filter((u) =>
                        !searchQuery ||
                        u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (u.mobile || '').includes(searchQuery) ||
                        (u.occupation_sector || '').toLowerCase().includes(searchQuery.toLowerCase())
                      ).map((u, i) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.008)', transition: 'background 0.15s' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(168,85,247,0.04)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.008)'}
                      >
                        <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: '#e2e8f0', whiteSpace: 'nowrap' }}>{u.full_name}</td>
                        <td style={{ padding: '0.85rem 1.25rem', color: '#64748b' }}>{u.email}</td>
                        <td style={{ padding: '0.85rem 1.25rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>{u.mobile || <span style={{ color: '#334155' }}>—</span>}</td>
                        <td style={{ padding: '0.85rem 1.25rem', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#00f2fe', background: 'rgba(0,242,254,0.06)', border: '1px solid rgba(0,242,254,0.15)', borderRadius: '6px', padding: '0.2rem 0.5rem', marginRight: '0.4rem' }}>{u.gov_id_type}</span>
                          <span style={{ color: '#64748b' }}>{u.gov_id_number}</span>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>{u.occupation_sector || <span style={{ color: '#334155' }}>—</span>}</td>
                        <td style={{ padding: '0.85rem 1.25rem', color: '#64748b' }}>{u.occupation_role || <span style={{ color: '#334155' }}>—</span>}</td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          {u.has_document ? (
                            <button
                              onClick={() => viewKYCDocument(u.id)}
                              disabled={kycDocLoading}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a855f7', background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '6px', padding: '0.3rem 0.65rem', cursor: 'pointer' }}
                            >
                              <Eye size={10} /> View
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.6rem', color: '#334155', fontWeight: 700 }}>Not uploaded</span>
                          )}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', color: '#475569', whiteSpace: 'nowrap' }}>{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── New Booking Panel ── */}
        {activeTab === 'new-booking' && (
          <div style={{ padding: '2rem' }}>
            {/* Header */}
            <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                  <ShoppingCart size={16} color="#22c55e" />
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#22c55e' }}>Manual Booking</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#475569', margin: 0 }}>Select available seats, set duration, and optionally override the price.</p>
              </div>
              {adminBookingSuccess && (
                <button
                  onClick={() => setAdminBookingSuccess(null)}
                  style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#22c55e', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '999px', padding: '0.4rem 1rem', cursor: 'pointer' }}
                >
                  + New Booking
                </button>
              )}
            </div>

            {/* Success state */}
            {adminBookingSuccess ? (
              <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '18px', padding: '2.5rem', textAlign: 'center', maxWidth: '480px', margin: '0 auto', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #22c55e, #00f2fe)' }} />
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                  <CheckCircle size={28} color="#22c55e" />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', color: '#fff', marginBottom: '0.4rem' }}>Booking Confirmed!</h3>
                <p style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '1rem' }}>
                  Payment of <span style={{ color: '#22c55e', fontWeight: 700 }}>₹{Number(adminBookingSuccess.amount).toLocaleString('en-IN')}</span> processed successfully.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', justifyContent: 'center' }}>
                  {adminBookingSuccess.bookingIds.map((id) => (
                    <span key={id} style={{ fontSize: '0.6rem', fontWeight: 800, fontFamily: 'monospace', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '6px', padding: '0.25rem 0.6rem', color: '#22c55e', letterSpacing: '0.08em' }}>
                      {id.slice(0, 8).toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>

                {/* LEFT — Seat selector */}
                <div>
                  <div style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#475569', marginBottom: '0.75rem' }}>
                    Available Seats <span style={{ color: '#334155', fontWeight: 700 }}>({adminAvailableSeats.length})</span>
                  </div>
                  {adminAvailableSeats.length === 0 ? (
                    <p style={{ fontSize: '0.78rem', color: '#334155', padding: '1.5rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      No available seats right now.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '320px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                      {['workstation', 'cabin', 'meeting_room', 'conference'].map((type) => {
                        const typeSeats = adminAvailableSeats.filter((s) => s.type === type);
                        if (typeSeats.length === 0) return null;
                        const typeLabel = { workstation: 'Workstations', cabin: 'Cabins', meeting_room: 'Meeting Rooms', conference: 'Conference Rooms' }[type];
                        const typeColor = { workstation: '#38bdf8', cabin: '#a855f7', meeting_room: '#fbbf24', conference: '#34d399' }[type];
                        return (
                          <div key={type}>
                            <div style={{ fontSize: '0.52rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: typeColor, marginBottom: '0.3rem', marginTop: '0.5rem', paddingLeft: '0.25rem' }}>{typeLabel}</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                              {typeSeats.map((seat) => {
                                const selected = adminSelectedIds.includes(seat.id);
                                return (
                                  <button
                                    key={seat.id}
                                    onClick={() => setAdminSelectedIds((prev) =>
                                      selected ? prev.filter((id) => id !== seat.id) : [...prev, seat.id]
                                    )}
                                    style={{
                                      padding: '0.4rem 0.7rem', borderRadius: '8px', cursor: 'pointer',
                                      background: selected ? `rgba(${typeColor === '#38bdf8' ? '56,189,248' : typeColor === '#a855f7' ? '168,85,247' : typeColor === '#fbbf24' ? '251,191,36' : '52,211,153'},0.12)` : 'rgba(255,255,255,0.04)',
                                      border: selected ? `1px solid ${typeColor}55` : '1px solid rgba(255,255,255,0.08)',
                                      transition: 'all 0.15s',
                                    }}
                                  >
                                    <div style={{ fontSize: '0.68rem', fontWeight: 800, color: selected ? typeColor : '#94a3b8', fontFamily: 'monospace' }}>{seat.code}</div>
                                    <div style={{ fontSize: '0.52rem', color: selected ? typeColor : '#334155', fontWeight: 700 }}>₹{computeSeatPrice(seat.type, adminDurationUnit, adminDurationQty).toLocaleString('en-IN')}</div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* RIGHT — Duration + Amount + Pay */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                  {/* Duration */}
                  <div>
                    <div style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#475569', marginBottom: '0.6rem' }}>Duration</div>
                    <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
                      {['hourly', 'daily', 'monthly'].map((unit) => (
                        <button key={unit} onClick={() => setAdminDurationUnit(unit)} style={{
                          flex: 1, padding: '0.55rem 0.25rem', borderRadius: '10px', cursor: 'pointer', textAlign: 'center',
                          background: adminDurationUnit === unit ? 'rgba(0,242,254,0.08)' : 'rgba(255,255,255,0.03)',
                          border: adminDurationUnit === unit ? '1px solid rgba(0,242,254,0.3)' : '1px solid rgba(255,255,255,0.07)',
                          fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em',
                          color: adminDurationUnit === unit ? '#00f2fe' : '#475569', transition: 'all 0.15s',
                        }}>
                          {unit}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <label style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#475569' }}>Qty</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button onClick={() => setAdminDurationQty((q) => Math.max(1, q - 1))} style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#e2e8f0', minWidth: '24px', textAlign: 'center' }}>{adminDurationQty}</span>
                        <button onClick={() => setAdminDurationQty((q) => q + 1)} style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      </div>
                    </div>
                  </div>

                  {/* Amount summary */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.62rem', color: '#475569', fontWeight: 700 }}>Computed total</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8' }}>₹{adminComputedTotal.toLocaleString('en-IN')}</span>
                    </div>

                    {/* Custom amount toggle */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: adminUseCustom ? '0.75rem' : 0 }}>
                      <input type="checkbox" checked={adminUseCustom} onChange={(e) => { setAdminUseCustom(e.target.checked); if (!e.target.checked) setAdminCustomAmount(''); }} style={{ accentColor: '#22c55e', width: '14px', height: '14px' }} />
                      <span style={{ fontSize: '0.6rem', fontWeight: 700, color: adminUseCustom ? '#22c55e' : '#475569', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Override with custom amount</span>
                    </label>

                    {adminUseCustom && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '10px', padding: '0.5rem 0.75rem' }}>
                        <IndianRupee size={13} color="#22c55e" />
                        <input
                          type="number"
                          min="1"
                          placeholder="Enter total amount"
                          value={adminCustomAmount}
                          onChange={(e) => setAdminCustomAmount(e.target.value)}
                          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#22c55e', fontSize: '0.85rem', fontWeight: 800 }}
                        />
                      </div>
                    )}

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.75rem', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#334155' }}>Final Amount</span>
                      <span style={{ fontSize: '1.4rem', fontWeight: 900, background: 'linear-gradient(135deg, #22c55e, #00f2fe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                        ₹{adminFinalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Selected seats summary */}
                  {adminSelectedIds.length > 0 && (
                    <div style={{ fontSize: '0.62rem', color: '#475569' }}>
                      <span style={{ fontWeight: 800, color: '#22c55e' }}>{adminSelectedIds.length}</span> seat{adminSelectedIds.length !== 1 ? 's' : ''} selected
                      {' · '}
                      <button onClick={() => setAdminSelectedIds([])} style={{ background: 'none', border: 'none', color: '#475569', fontSize: '0.6rem', cursor: 'pointer', textDecoration: 'underline' }}>Clear</button>
                    </div>
                  )}

                  {/* Error */}
                  {adminBookingError && (
                    <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '0.65rem 0.9rem', color: '#fca5a5', fontSize: '0.72rem' }}>
                      {adminBookingError}
                    </div>
                  )}

                  {/* Pay button */}
                  <button
                    onClick={handleAdminPayment}
                    disabled={adminBookingLoading || adminSelectedIds.length === 0}
                    style={{
                      width: '100%', padding: '0.9rem 1.5rem', borderRadius: '14px', border: 'none',
                      background: adminSelectedIds.length === 0 || adminBookingLoading
                        ? 'rgba(255,255,255,0.05)'
                        : 'linear-gradient(135deg, #22c55e, #00f2fe)',
                      color: adminSelectedIds.length === 0 || adminBookingLoading ? '#334155' : '#000',
                      fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.18em',
                      cursor: adminSelectedIds.length === 0 || adminBookingLoading ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                      boxShadow: adminSelectedIds.length > 0 && !adminBookingLoading ? '0 4px 24px rgba(34,197,94,0.25)' : 'none',
                      transition: 'all 0.25s',
                    }}
                  >
                    {adminBookingLoading ? (
                      <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Processing…</>
                    ) : (
                      <><Zap size={14} /> Process Payment — ₹{adminFinalAmount.toLocaleString('en-IN')}</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      </div>

      {/* ── Timed Lock Dialog ── */}
      {lockDialog && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(2,2,4,0.85)', backdropFilter: 'blur(18px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ width: '100%', maxWidth: '400px', background: 'rgba(15,23,42,0.97)', border: '1px solid rgba(234,179,8,0.25)', borderRadius: '22px', padding: '2rem', boxShadow: '0 40px 80px rgba(0,0,0,0.7)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #eab308, #f97316)' }} />
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', marginBottom: '1.2rem', background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} color="#eab308" />
            </div>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.01em', color: '#fff', marginBottom: '0.4rem' }}>
              Timed Lock — <span style={{ color: '#eab308' }}>{lockDialog.seat.code}</span>
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.6 }}>
              Seat will be locked until the chosen time, then automatically unlocked for new bookings.
            </p>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#64748b', marginBottom: '0.5rem' }}>Lock Until</label>
              <input
                type="datetime-local"
                value={lockUntilInput}
                onChange={(e) => setLockUntilInput(e.target.value)}
                min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(234,179,8,0.25)', borderRadius: '10px', padding: '0.7rem 1rem', color: '#e2e8f0', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => { setLockDialog(null); setLockUntilInput(''); }}
                style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleTimedLock}
                disabled={!lockUntilInput}
                style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: lockUntilInput ? 'linear-gradient(135deg, #eab308, #f97316)' : 'rgba(255,255,255,0.05)', border: 'none', color: lockUntilInput ? '#000' : '#334155', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', cursor: lockUntilInput ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                <Lock size={12} /> Apply Lock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── KYC Document Viewer Modal ── */}
      {kycDocModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(2,2,4,0.92)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ width: '100%', maxWidth: '600px', background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.7)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <FileText size={15} color="#a855f7" />
                <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#a855f7' }}>
                  {kycDocModal.document_name || 'KYC Document'}
                </span>
              </div>
              <button onClick={() => setKycDocModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}><CloseIcon size={18} /></button>
            </div>
            <div style={{ maxHeight: '70vh', overflow: 'auto', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a14' }}>
              {kycDocModal.document_data?.startsWith('data:image') ? (
                <img src={kycDocModal.document_data} alt="KYC Document" style={{ maxWidth: '100%', borderRadius: '8px' }} />
              ) : kycDocModal.document_data?.startsWith('data:application/pdf') ? (
                <iframe src={kycDocModal.document_data} title="KYC PDF" style={{ width: '100%', height: '60vh', border: 'none', borderRadius: '8px' }} />
              ) : (
                <span style={{ color: '#475569', fontSize: '0.8rem' }}>Preview not available. <a href={kycDocModal.document_data} download={kycDocModal.document_name} style={{ color: '#a855f7' }}>Download</a></span>
              )}
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <a
                href={kycDocModal.document_data}
                download={kycDocModal.document_name || 'kyc-document'}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.25rem', borderRadius: '999px', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)', color: '#a855f7', fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', textDecoration: 'none' }}
              >
                <Download size={12} /> Download
              </a>
              <button onClick={() => setKycDocModal(null)} style={{ padding: '0.55rem 1.25rem', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#64748b', fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation Dialog ── */}
      {confirmDialog && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(2,2,4,0.85)', backdropFilter: 'blur(18px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
        }}>
          <div style={{
            width: '100%', maxWidth: '420px',
            background: 'rgba(15,23,42,0.95)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '22px', padding: '2rem',
            boxShadow: '0 40px 80px rgba(0,0,0,0.7)',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Top accent */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #f97316, #ef4444)' }} />

            {/* Warning icon */}
            <div style={{
              width: '52px', height: '52px', borderRadius: '14px', marginBottom: '1.25rem',
              background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertTriangle size={22} color="#f97316" />
            </div>

            <h3 style={{ fontSize: '1rem', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.01em', color: '#fff', marginBottom: '0.5rem' }}>
              {confirmDialog.action === 'force-release' ? 'Force Release Seat?' : 'Confirm Action'}
            </h3>

            <p style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.65, marginBottom: '1rem' }}>
              You are about to force-release{' '}
              <span style={{ color: '#00f2fe', fontWeight: 700 }}>{confirmDialog.seat.code}</span>.
            </p>

            {/* Seat info card */}
            <div style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px', padding: '0.85rem 1rem', marginBottom: '1.25rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#334155' }}>Seat</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e2e8f0' }}>{confirmDialog.seat.code}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#334155' }}>Type</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{(confirmDialog.seat.type || '').replace('_', ' ')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#334155' }}>Current State</span>
                <span style={{ fontSize: '0.75rem', color: confirmDialog.seat.is_locked ? '#fb923c' : '#f87171', fontWeight: 700 }}>
                  {confirmDialog.seat.is_locked ? 'Booking in Progress' : 'Locked / Booked'}
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.7rem', color: '#475569', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              ⚠️ This will immediately make the seat available for new bookings.{' '}
              {confirmDialog.seat.is_locked
                ? 'Any ongoing payment process for this seat will be invalidated.'
                : 'Any existing customer booking records will NOT be automatically cancelled — handle refunds separately.'}
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setConfirmDialog(null)}
                style={{
                  flex: 1, padding: '0.85rem', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#64748b', fontSize: '0.65rem', fontWeight: 800,
                  textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#94a3b8'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#64748b'; }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleForceRelease(confirmDialog.seat)}
                style={{
                  flex: 1, padding: '0.85rem', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #f97316, #ef4444)',
                  border: 'none', color: '#fff',
                  fontSize: '0.65rem', fontWeight: 900,
                  textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(239,68,68,0.3)', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 6px 30px rgba(239,68,68,0.5)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(239,68,68,0.3)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <Unlock size={13} /> Force Release
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, sub, icon, accent = '#00f2fe' }) => (
  <div style={{
    background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '20px', padding: '1.5rem', position: 'relative', overflow: 'hidden',
    backdropFilter: 'blur(16px)',
  }}>
    {/* Top accent gradient */}
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
    {/* Ambient glow */}
    <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '100px', height: '100px', background: `radial-gradient(circle, ${accent}0a 0%, transparent 70%)`, borderRadius: '50%', pointerEvents: 'none' }} />

    <div style={{
      width: '42px', height: '42px', borderRadius: '12px', marginBottom: '1rem',
      background: `${accent}10`, border: `1px solid ${accent}20`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: accent,
    }}>
      {icon}
    </div>
    <div style={{ fontSize: '2rem', fontWeight: 900, fontStyle: 'italic', color: '#fff', lineHeight: 1, marginBottom: '0.3rem' }}>{value}</div>
    <div style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#334155' }}>{title}</div>
    {sub && <div style={{ fontSize: '0.55rem', color: '#1e293b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: '0.2rem' }}>{sub}</div>}
  </div>
);

export default AdminCRM;
