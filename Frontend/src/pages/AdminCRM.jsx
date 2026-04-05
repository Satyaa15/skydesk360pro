import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Calendar,
  CreditCard,
  Armchair,
  Search,
  MoreVertical,
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
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import {
  fetchAdminStats,
  fetchAdminUsers,
  fetchAdminBookings,
  fetchAdminSeats,
  createAdminSeat,
  updateAdminSeat,
  resetSeatAvailability,
} from '../lib/api';

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

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      setSeatActionSuccess(`Seat ${updated.code} is now ${updated.is_available ? 'available' : 'unavailable'}.`);
      loadData();
    } catch (err) {
      setSeatActionError(err.message || 'Failed to update availability');
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

  const emptyColSpan = activeTab === 'bookings' ? 8 : activeTab === 'seats' ? 6 : 5;

  return (
    <div className="min-h-screen text-white pt-24 px-6 md:px-12 pb-20" style={{ background: '#020204', fontFamily: "'Inter', sans-serif" }}>
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
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '1.25rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {[
                { id: 'users',    label: `Users`,    count: users.length },
                { id: 'bookings', label: `Bookings`, count: bookings.length },
                { id: 'seats',    label: `Seats`,    count: seats.length },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    padding: '0.5rem 1.1rem', borderRadius: '999px', cursor: 'pointer',
                    fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em',
                    transition: 'all 0.2s',
                    background: activeTab === t.id ? 'rgba(0,242,254,0.08)' : 'transparent',
                    border: activeTab === t.id ? '1px solid rgba(0,242,254,0.25)' : '1px solid transparent',
                    color: activeTab === t.id ? '#00f2fe' : '#334155',
                  }}
                >
                  {t.label}
                  <span style={{
                    marginLeft: '0.4rem', fontSize: '0.52rem', fontWeight: 900,
                    background: activeTab === t.id ? 'rgba(0,242,254,0.15)' : 'rgba(255,255,255,0.05)',
                    borderRadius: '999px', padding: '0.1rem 0.45rem',
                    color: activeTab === t.id ? '#00f2fe' : '#1e293b',
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

          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-500">
              <Loader2 size={24} className="animate-spin mr-3" /> Loading live data...
            </div>
          ) : (
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
                        <td className="px-8 py-5">
                          {seat.is_locked ? (
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black tracking-widest border bg-orange-500/10 border-orange-500/20 text-orange-300">
                                <Clock size={12} /> LOCKED
                              </span>
                              {seat.locked_until && (
                                <span className="text-[10px] text-orange-200/70">
                                  Until {new Date(seat.locked_until).toLocaleString('en-IN')}
                                </span>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => handleToggleAvailability(seat)}
                              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black tracking-widest border ${
                                seat.is_available
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                  : 'bg-red-500/10 border-red-500/20 text-red-400'
                              }`}
                            >
                              {seat.is_available ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                              {seat.is_available ? 'AVAILABLE' : 'BLOCKED'}
                            </button>
                          )}
                        </td>
                        <td className="px-8 py-5">
                          {editingSeatId === seat.id ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={handleSaveSeat}
                                className="text-xs uppercase font-black tracking-widest text-emerald-400 flex items-center gap-1"
                              >
                                <Save size={12} /> Save
                              </button>
                              <button
                                onClick={cancelEditSeat}
                                className="text-xs uppercase font-black tracking-widest text-gray-500 flex items-center gap-1"
                              >
                                <CloseIcon size={12} /> Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEditSeat(seat)}
                              className="text-xs uppercase font-black tracking-widest text-blue-400 flex items-center gap-1"
                            >
                              <Pencil size={12} /> Edit
                            </button>
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
          )}
        </div>
      </div>
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
