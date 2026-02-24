import React, { useMemo, useState } from 'react';
import {
  Users,
  Calendar,
  CreditCard,
  ArrowUpRight,
  Search,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
} from 'lucide-react';

const AdminCRM = () => {
  const [activeTab, setActiveTab] = useState('bookings');

  const stats = {
    revenue: 'Rs 1,42,000',
    bookings: 124,
    users: 48,
    occupancy: '82%',
  };

  const bookings = [
    { id: 'BK-9021', user: 'Aditi Sharma', seat: 'WS-A12', date: '2026-02-22', amount: 'Rs 399', status: 'PAID' },
    { id: 'BK-9022', user: 'Rahul Verma', seat: 'EC-04', date: '2026-02-23', amount: 'Rs 1,500', status: 'PENDING' },
    { id: 'BK-9023', user: 'Priya Das', seat: 'MB-01', date: '2026-02-22', amount: 'Rs 800', status: 'PAID' },
    { id: 'BK-9024', user: 'Karan Mehra', seat: 'WS-B05', date: '2026-02-24', amount: 'Rs 399', status: 'CANCELLED' },
  ];

  const users = useMemo(
    () => [
      { name: 'Aditi Sharma', email: 'aditi@example.com', govId: 'AADHAR: 1298-2234-8852', role: 'USER' },
      { name: 'Rahul Verma', email: 'rahul@example.com', govId: 'PAN: ABCPV2245R', role: 'USER' },
      { name: 'Priya Das', email: 'priya@example.com', govId: 'PASSPORT: S9081332', role: 'USER' },
      { name: 'Karan Mehra', email: 'karan@example.com', govId: 'DL: MH1220120091223', role: 'USER' },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-[#020202] text-white pt-24 px-6 md:px-12 pb-20">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tight">
              Admin <span className="text-blue-500">Command.</span>
            </h1>
            <p className="text-gray-500 text-sm mt-2 flex items-center gap-2">
              <Shield size={14} className="text-blue-500/50" /> System Control Center
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition">
              Export CSV
            </button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-blue-500 transition shadow-lg shadow-blue-600/20">
              System Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard title="Total Revenue" value={stats.revenue} trend="+12.5%" icon={<CreditCard className="text-emerald-400" />} />
          <StatCard title="Total Bookings" value={stats.bookings} trend="+8.2%" icon={<Calendar className="text-blue-400" />} />
          <StatCard title="Active Users" value={stats.users} trend="+5.4%" icon={<Users className="text-purple-400" />} />
          <StatCard title="Floor Occupancy" value={stats.occupancy} trend="+2.1%" icon={<ArrowUpRight className="text-orange-400" />} />
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-xl shadow-2xl">
          <div className="border-b border-white/5 px-8 py-6 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <button
                onClick={() => setActiveTab('bookings')}
                className={`text-[10px] uppercase tracking-[0.2em] font-black pb-1 border-b-2 transition-all ${
                  activeTab === 'bookings' ? 'border-blue-500 text-white' : 'border-transparent text-gray-500'
                }`}
              >
                Live Bookings
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`text-[10px] uppercase tracking-[0.2em] font-black pb-1 border-b-2 transition-all ${
                  activeTab === 'users' ? 'border-blue-500 text-white' : 'border-transparent text-gray-500'
                }`}
              >
                Member Base
              </button>
            </div>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search database..."
                className="bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-xs focus:outline-none focus:border-blue-500/50 w-64 transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                {activeTab === 'bookings' ? (
                  <tr className="border-b border-white/5 bg-white/[0.01]">
                    <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Booking ID</th>
                    <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Customer</th>
                    <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Workspace</th>
                    <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Date</th>
                    <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Amount</th>
                    <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Status</th>
                    <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Actions</th>
                  </tr>
                ) : (
                  <tr className="border-b border-white/5 bg-white/[0.01]">
                    <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Name</th>
                    <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Email</th>
                    <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Gov ID</th>
                    <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Role</th>
                    <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Actions</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {activeTab === 'bookings'
                  ? bookings.map((booking) => (
                      <tr key={booking.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                        <td className="px-8 py-5 text-sm font-mono text-blue-400">{booking.id}</td>
                        <td className="px-8 py-5 text-sm font-bold">{booking.user}</td>
                        <td className="px-8 py-5 text-sm text-gray-400">{booking.seat}</td>
                        <td className="px-8 py-5 text-sm text-gray-400">{booking.date}</td>
                        <td className="px-8 py-5 text-sm font-bold text-white">{booking.amount}</td>
                        <td className="px-8 py-5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black tracking-widest border ${
                              booking.status === 'PAID'
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : booking.status === 'PENDING'
                                  ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                                  : 'bg-red-500/10 border-red-500/20 text-red-400'
                            }`}
                          >
                            {booking.status === 'PAID' && <CheckCircle size={10} />}
                            {booking.status === 'PENDING' && <Clock size={10} />}
                            {booking.status === 'CANCELLED' && <XCircle size={10} />}
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <button className="text-gray-500 hover:text-white transition opacity-0 group-hover:opacity-100">
                            <MoreVertical size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  : users.map((user) => (
                      <tr key={user.email} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                        <td className="px-8 py-5 text-sm font-bold">{user.name}</td>
                        <td className="px-8 py-5 text-sm text-gray-400">{user.email}</td>
                        <td className="px-8 py-5 text-sm text-gray-400">{user.govId}</td>
                        <td className="px-8 py-5 text-sm font-bold text-blue-400">{user.role}</td>
                        <td className="px-8 py-5">
                          <button className="text-gray-500 hover:text-white transition opacity-0 group-hover:opacity-100">
                            <MoreVertical size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, trend, icon }) => (
  <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl backdrop-blur-xl">
    <div className="flex items-center justify-between mb-4">
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
        {icon}
      </div>
      <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">{trend}</span>
    </div>
    <div className="text-2xl font-black italic uppercase tracking-tighter text-white">{value}</div>
    <div className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mt-1">{title}</div>
  </div>
);

export default AdminCRM;
