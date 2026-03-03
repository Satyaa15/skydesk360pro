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
} from 'lucide-react';
import { fetchAdminStats, fetchAdminUsers, fetchAdminBookings } from '../lib/api';

const AdminCRM = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Live data state
  const [stats, setStats] = useState({ total_users: 0, total_bookings: 0, total_seats: 0, available_seats: 0 });
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, usersData, bookingsData] = await Promise.all([
        fetchAdminStats(),
        fetchAdminUsers(),
        fetchAdminBookings(),
      ]);
      setStats(statsData);
      setUsers(usersData);
      setBookings(bookingsData);
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

  const occupiedSeats = stats.total_seats - stats.available_seats;
  const occupancyPct = stats.total_seats > 0 ? Math.round((occupiedSeats / stats.total_seats) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#020202] text-white pt-24 px-6 md:px-12 pb-20">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tight">
              Admin <span className="text-blue-500">Command.</span>
            </h1>
            <p className="text-gray-500 text-sm mt-2 flex items-center gap-2">
              <Shield size={14} className="text-blue-500/50" /> Live System Dashboard
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={loadData}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-blue-500 transition shadow-lg shadow-blue-600/20 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              {loading ? 'Loading...' : 'Refresh Data'}
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-8 flex items-center gap-3 text-red-400 text-sm">
            <AlertTriangle size={16} />
            <span>{error}</span>
            <button onClick={loadData} className="ml-auto text-xs font-bold uppercase underline">Retry</button>
          </div>
        )}

        {/* Stats cards — LIVE from API */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard title="Total Users" value={stats.total_users} icon={<Users className="text-purple-400" />} />
          <StatCard title="Total Bookings" value={stats.total_bookings} icon={<Calendar className="text-blue-400" />} />
          <StatCard title="Total Seats" value={stats.total_seats} icon={<Armchair className="text-emerald-400" />} />
          <StatCard title="Occupancy" value={`${occupancyPct}%`} sub={`${stats.available_seats} available`} icon={<CreditCard className="text-orange-400" />} />
        </div>

        {/* Data table */}
        <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-xl shadow-2xl">
          <div className="border-b border-white/5 px-8 py-6 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <button
                onClick={() => setActiveTab('users')}
                className={`text-[10px] uppercase tracking-[0.2em] font-black pb-1 border-b-2 transition-all ${
                  activeTab === 'users' ? 'border-blue-500 text-white' : 'border-transparent text-gray-500'
                }`}
              >
                Registered Users ({users.length})
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`text-[10px] uppercase tracking-[0.2em] font-black pb-1 border-b-2 transition-all ${
                  activeTab === 'bookings' ? 'border-blue-500 text-white' : 'border-transparent text-gray-500'
                }`}
              >
                Live Bookings ({bookings.length})
              </button>
            </div>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-xs focus:outline-none focus:border-blue-500/50 w-64 transition-all"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-500">
              <Loader2 size={24} className="animate-spin mr-3" /> Loading live data...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  {activeTab === 'users' ? (
                    <tr className="border-b border-white/5 bg-white/[0.01]">
                      <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Name</th>
                      <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Email</th>
                      <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Role</th>
                      <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Status</th>
                      <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Registered</th>
                    </tr>
                  ) : (
                    <tr className="border-b border-white/5 bg-white/[0.01]">
                      <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">ID</th>
                      <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Customer</th>
                      <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Seat</th>
                      <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Gov ID</th>
                      <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Status</th>
                      <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Date</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {activeTab === 'users'
                    ? filteredUsers.map((user) => (
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
                      ))
                    : filteredBookings.map((booking) => (
                        <tr key={booking.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                          <td className="px-8 py-5 text-sm font-mono text-blue-400">{booking.id.slice(0, 8)}...</td>
                          <td className="px-8 py-5 text-sm font-bold">{booking.user_name}</td>
                          <td className="px-8 py-5 text-sm text-gray-400">{booking.seat_code}</td>
                          <td className="px-8 py-5 text-sm text-gray-500">{booking.gov_id}</td>
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
                          <td className="px-8 py-5 text-sm text-gray-500">
                            {new Date(booking.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                        </tr>
                      ))}
                  {((activeTab === 'users' && filteredUsers.length === 0) || (activeTab === 'bookings' && filteredBookings.length === 0)) && (
                    <tr>
                      <td colSpan={6} className="px-8 py-16 text-center text-gray-500 text-sm">
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

const StatCard = ({ title, value, sub, icon }) => (
  <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl backdrop-blur-xl">
    <div className="flex items-center justify-between mb-4">
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
        {icon}
      </div>
    </div>
    <div className="text-2xl font-black italic uppercase tracking-tighter text-white">{value}</div>
    <div className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mt-1">{title}</div>
    {sub && <div className="text-[8px] uppercase tracking-widest text-gray-600 mt-0.5">{sub}</div>}
  </div>
);

export default AdminCRM;
