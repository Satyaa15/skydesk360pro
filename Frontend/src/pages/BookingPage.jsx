import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Armchair, X, ChevronRight, Users, Building2, BriefcaseBusiness, ZoomIn, ZoomOut, RotateCcw, Box, Layers, Move } from 'lucide-react';
import './BookingPage.css';
import { fetchSeats } from '../lib/api';

/* ─── Constants ─── */
const WORKSPACE_LABELS = {
  workstation: 'Workstation',
  cabin: 'Cabin',
  meeting_room: 'Meeting Room',
  conference: 'Conference',
};

const WORKSPACE_FILTERS = [
  { id: 'all', label: 'All Spaces' },
  { id: 'workstation', label: 'Workstations' },
  { id: 'cabin', label: 'Cabins' },
  { id: 'meeting_room', label: 'Meeting Room' },
  { id: 'conference', label: 'Conference' },
];

const DURATION_OPTIONS = [
  { id: 'hourly', label: 'Hourly' },
  { id: 'daily', label: 'Daily' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
];

// Matches backend pricing.SEAT_PRICES — must stay in sync with pricing.py
const SEAT_PRICES = {
  workstation:  { hourly: 100,  daily: 500,   monthly: 7500  },
  cabin:        { hourly: 500,  daily: 2500,  monthly: 40000 },
  conference:   { hourly: 700,  daily: 4500,  monthly: 90000 },
  meeting_room: { hourly: 700,  daily: 4500,  monthly: 90000 },
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
  return rounded.toLocaleString();
};

const ZONE_COLORS = {
  workstation: { fill: 'rgba(56,189,248,0.10)', stroke: '#38bdf8', label: '#38bdf8' },
  reception: { fill: 'rgba(251,191,36,0.08)', stroke: '#fbbf24', label: '#fbbf24' },
  conference: { fill: 'rgba(52,211,153,0.10)', stroke: '#34d399', label: '#34d399' },
  cabin: { fill: 'rgba(168,85,247,0.10)', stroke: '#a855f7', label: '#a855f7' },
  meeting: { fill: 'rgba(251,191,36,0.10)', stroke: '#fbbf24', label: '#fbbf24' },
  utility: { fill: 'rgba(148,163,184,0.06)', stroke: '#64748b', label: '#94a3b8' },
  passage: { fill: 'rgba(148,163,184,0.04)', stroke: '#475569', label: '#64748b' },
};

/* ─── Seat Data (same business data, refined positions) ─── */
const FLOOR_PLAN_SEATS = [
  // Workstations Row A (top row)
  { id: 'WS-A1', zone: 'Workstations Row A', workspaceType: 'workstation', price: 500, cx: 178, cy: 98, booked: false },
  { id: 'WS-A2', zone: 'Workstations Row A', workspaceType: 'workstation', price: 500, cx: 218, cy: 98, booked: false },
  { id: 'WS-A3', zone: 'Workstations Row A', workspaceType: 'workstation', price: 500, cx: 258, cy: 98, booked: false },
  { id: 'WS-A4', zone: 'Workstations Row A', workspaceType: 'workstation', price: 500, cx: 298, cy: 98, booked: false },
  { id: 'WS-A5', zone: 'Workstations Row A', workspaceType: 'workstation', price: 500, cx: 338, cy: 98, booked: false },
  { id: 'WS-A6', zone: 'Workstations Row A', workspaceType: 'workstation', price: 500, cx: 378, cy: 98, booked: false },

  // Workstations Row B (second row)
  { id: 'WS-B1', zone: 'Workstations Row B', workspaceType: 'workstation', price: 500, cx: 178, cy: 148, booked: false },
  { id: 'WS-B2', zone: 'Workstations Row B', workspaceType: 'workstation', price: 500, cx: 218, cy: 148, booked: false },
  { id: 'WS-B3', zone: 'Workstations Row B', workspaceType: 'workstation', price: 500, cx: 258, cy: 148, booked: false },
  { id: 'WS-B4', zone: 'Workstations Row B', workspaceType: 'workstation', price: 500, cx: 298, cy: 148, booked: false },
  { id: 'WS-B5', zone: 'Workstations Row B', workspaceType: 'workstation', price: 500, cx: 338, cy: 148, booked: false },
  { id: 'WS-B6', zone: 'Workstations Row B', workspaceType: 'workstation', price: 500, cx: 378, cy: 148, booked: false },

  // Reception facing workstations
  { id: 'WS-R1', zone: 'Reception Workstations', workspaceType: 'workstation', price: 550, cx: 260, cy: 215, booked: false },
  { id: 'WS-R2', zone: 'Reception Workstations', workspaceType: 'workstation', price: 550, cx: 310, cy: 215, booked: false },
  { id: 'WS-R3', zone: 'Reception Workstations', workspaceType: 'workstation', price: 550, cx: 360, cy: 215, booked: false },

  // Conference Room (right side, 10 seats around table)
  { id: 'CONF-1', zone: 'Convertible 10 Seater Conference', workspaceType: 'conference', price: 3000, cx: 490, cy: 80, booked: false },
  { id: 'CONF-2', zone: 'Convertible 10 Seater Conference', workspaceType: 'conference', price: 3000, cx: 560, cy: 80, booked: false },
  { id: 'CONF-3', zone: 'Convertible 10 Seater Conference', workspaceType: 'conference', price: 3000, cx: 490, cy: 120, booked: false },
  { id: 'CONF-4', zone: 'Convertible 10 Seater Conference', workspaceType: 'conference', price: 3000, cx: 560, cy: 120, booked: false },
  { id: 'CONF-5', zone: 'Convertible 10 Seater Conference', workspaceType: 'conference', price: 3000, cx: 490, cy: 160, booked: false },
  { id: 'CONF-6', zone: 'Convertible 10 Seater Conference', workspaceType: 'conference', price: 3000, cx: 560, cy: 160, booked: false },
  { id: 'CONF-7', zone: 'Convertible 10 Seater Conference', workspaceType: 'conference', price: 3000, cx: 490, cy: 200, booked: false },
  { id: 'CONF-8', zone: 'Convertible 10 Seater Conference', workspaceType: 'conference', price: 3000, cx: 560, cy: 200, booked: false },
  { id: 'CONF-9', zone: 'Convertible 10 Seater Conference', workspaceType: 'conference', price: 3000, cx: 490, cy: 240, booked: false },
  { id: 'CONF-10', zone: 'Convertible 10 Seater Conference', workspaceType: 'conference', price: 3000, cx: 560, cy: 240, booked: false },

  // CEO Cabin
  { id: 'CEO-1', zone: "CEO's Cabin", workspaceType: 'cabin', price: 2200, cx: 170, cy: 370, booked: false },
  { id: 'CEO-2', zone: "CEO's Cabin", workspaceType: 'cabin', price: 2200, cx: 210, cy: 370, booked: false },
  { id: 'CEO-3', zone: "CEO's Cabin", workspaceType: 'cabin', price: 2200, cx: 190, cy: 410, booked: false },

  // Director Cabin (5 seats)
  { id: 'DIR-1', zone: "Director's Cabin", workspaceType: 'cabin', price: 1800, cx: 290, cy: 370, booked: false },
  { id: 'DIR-2', zone: "Director's Cabin", workspaceType: 'cabin', price: 1800, cx: 320, cy: 370, booked: false },
  { id: 'DIR-3', zone: "Director's Cabin", workspaceType: 'cabin', price: 1800, cx: 350, cy: 370, booked: false },
  { id: 'DIR-4', zone: "Director's Cabin", workspaceType: 'cabin', price: 1800, cx: 305, cy: 410, booked: false },
  { id: 'DIR-5', zone: "Director's Cabin", workspaceType: 'cabin', price: 1800, cx: 335, cy: 410, booked: false },

  // Meeting Room
  { id: 'MR-1', zone: '2 Seater Meeting Room', workspaceType: 'meeting_room', price: 900, cx: 450, cy: 370, booked: false },
  { id: 'MR-2', zone: '2 Seater Meeting Room', workspaceType: 'meeting_room', price: 900, cx: 480, cy: 370, booked: false },
];


/* ─── SVG Floor Plan Component ─── */
const FloorPlanSVG = React.memo(({ visibleSeats, isSeatSelected, toggleSeat, hoveredSeat, setHoveredSeat, durationUnit }) => (
  <svg viewBox="0 0 640 480" className="floor-svg" xmlns="http://www.w3.org/2000/svg">
    <defs>
      {/* Glow filters */}
      <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feFlood floodColor="#00f2fe" floodOpacity="0.6" />
        <feComposite in2="blur" operator="in" />
        <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feFlood floodColor="#ef4444" floodOpacity="0.5" />
        <feComposite in2="blur" operator="in" />
        <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <filter id="glow-purple" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feFlood floodColor="#a855f7" floodOpacity="0.5" />
        <feComposite in2="blur" operator="in" />
        <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>

      {/* Grid pattern */}
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(148,163,184,0.06)" strokeWidth="0.5" />
      </pattern>

      {/* Desk pattern */}
      <pattern id="deskHatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="4" stroke="rgba(148,163,184,0.08)" strokeWidth="1" />
      </pattern>
    </defs>

    {/* Background grid */}
    <rect width="640" height="480" fill="url(#grid)" />

    {/* ==================== OUTER WALLS ==================== */}
    <g className="walls-group">
      {/* Main building outline */}
      <rect x="60" y="30" width="580" height="440" rx="3" fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth="2" />

      {/* ── TOP SECTION: Workstations Area ── */}
      <rect x="130" y="50" width="290" height="130" rx="3"
        fill={ZONE_COLORS.workstation.fill} stroke={ZONE_COLORS.workstation.stroke} strokeWidth="1.2" strokeDasharray="0" className="zone-rect zone-workstation" />

      {/* Workstation desks Row A */}
      <rect x="155" y="75" width="250" height="8" rx="2" fill="rgba(56,189,248,0.06)" stroke="rgba(56,189,248,0.2)" strokeWidth="0.5" />
      {/* Workstation desks Row B */}
      <rect x="155" y="130" width="250" height="8" rx="2" fill="rgba(56,189,248,0.06)" stroke="rgba(56,189,248,0.2)" strokeWidth="0.5" />

      <text x="275" y="66" className="zone-label" fill={ZONE_COLORS.workstation.label}>WORKSTATIONS</text>

      {/* ── RECEPTION AREA ── */}
      <rect x="130" y="185" width="290" height="55" rx="3"
        fill={ZONE_COLORS.reception.fill} stroke={ZONE_COLORS.reception.stroke} strokeWidth="1.2" className="zone-rect zone-reception" />
      {/* Reception desk */}
      <rect x="155" y="200" width="80" height="25" rx="6" fill="rgba(251,191,36,0.08)" stroke="rgba(251,191,36,0.25)" strokeWidth="0.8" />
      <text x="195" y="216" className="zone-label-sm" fill={ZONE_COLORS.reception.label}>RECEPTION</text>

      <text x="275" y="200" className="zone-label" fill={ZONE_COLORS.reception.label}>RECEPTION AREA</text>

      {/* ── CONFERENCE ROOM (right side) ── */}
      <rect x="445" y="50" width="170" height="220" rx="3"
        fill={ZONE_COLORS.conference.fill} stroke={ZONE_COLORS.conference.stroke} strokeWidth="1.2" className="zone-rect zone-conference" />

      {/* Sliding glass partition markers */}
      <line x1="445" y1="50" x2="445" y2="68" stroke={ZONE_COLORS.conference.stroke} strokeWidth="2" strokeDasharray="4 2" />
      <line x1="445" y1="252" x2="445" y2="270" stroke={ZONE_COLORS.conference.stroke} strokeWidth="2" strokeDasharray="4 2" />

      {/* Conference table */}
      <rect x="505" y="70" width="30" height="190" rx="6" fill="rgba(52,211,153,0.06)" stroke="rgba(52,211,153,0.2)" strokeWidth="0.8" />

      <text x="530" y="62" className="zone-label" fill={ZONE_COLORS.conference.label}>CONFERENCE</text>
      <text x="530" y="280" className="zone-label-sm" fill={ZONE_COLORS.conference.label}>CONVERTIBLE 10 SEATER</text>

      {/* Sliding glass labels */}
      <text x="445" y="46" className="zone-label-xs" fill="rgba(52,211,153,0.6)">SLIDING GLASS</text>

      {/* ── PASSAGE ── */}
      <rect x="62" y="260" width="30" height="200" rx="1"
        fill={ZONE_COLORS.passage.fill} stroke={ZONE_COLORS.passage.stroke} strokeWidth="0.8" className="zone-rect" />
      <text x="77" y="360" className="zone-label-vertical" fill={ZONE_COLORS.passage.label} transform="rotate(-90 77 360)">PASSAGE 5' WIDE</text>

      {/* ── ENTRANCE ── */}
      <g className="entrance-group">
        <rect x="60" y="270" width="34" height="3" fill="#00f2fe" rx="1" />
        <text x="77" y="266" className="entrance-label" fill="#00f2fe">ENTRANCE</text>
        <path d="M 64 273 L 54 283 L 64 293" fill="none" stroke="#00f2fe" strokeWidth="1.5" className="entrance-arrow" />
      </g>

      {/* ── CEO'S CABIN ── */}
      <rect x="100" y="310" width="140" height="130" rx="3"
        fill={ZONE_COLORS.cabin.fill} stroke={ZONE_COLORS.cabin.stroke} strokeWidth="1.2" className="zone-rect zone-cabin" />
      {/* CEO desk */}
      <rect x="155" y="350" width="60" height="12" rx="3" fill="rgba(168,85,247,0.06)" stroke="rgba(168,85,247,0.2)" strokeWidth="0.5" />
      {/* Door arc */}
      <path d="M 100 310 Q 120 295 140 310" fill="none" stroke="rgba(168,85,247,0.3)" strokeWidth="0.8" strokeDasharray="3 2" />
      <text x="170" y="328" className="zone-label" fill={ZONE_COLORS.cabin.label}>CEO'S CABIN</text>

      {/* ── DIRECTOR'S CABIN ── */}
      <rect x="250" y="310" width="160" height="130" rx="3"
        fill={ZONE_COLORS.cabin.fill} stroke={ZONE_COLORS.cabin.stroke} strokeWidth="1.2" className="zone-rect zone-cabin" />
      {/* Director desk */}
      <rect x="300" y="350" width="60" height="12" rx="3" fill="rgba(168,85,247,0.06)" stroke="rgba(168,85,247,0.2)" strokeWidth="0.5" />
      <path d="M 250 310 Q 270 295 290 310" fill="none" stroke="rgba(168,85,247,0.3)" strokeWidth="0.8" strokeDasharray="3 2" />
      <text x="330" y="328" className="zone-label" fill={ZONE_COLORS.cabin.label}>DIRECTOR'S CABIN</text>

      {/* ── 2-SEATER MEETING ROOM ── */}
      <rect x="420" y="310" width="110" height="80" rx="3"
        fill={ZONE_COLORS.meeting.fill} stroke={ZONE_COLORS.meeting.stroke} strokeWidth="1.2" className="zone-rect zone-meeting" />
      {/* Meeting table */}
      <circle cx="465" cy="355" r="18" fill="rgba(251,191,36,0.05)" stroke="rgba(251,191,36,0.2)" strokeWidth="0.8" />
      <text x="475" y="328" className="zone-label-sm" fill={ZONE_COLORS.meeting.label}>MEETING ROOM</text>
      <text x="475" y="340" className="zone-label-xs" fill="rgba(251,191,36,0.5)">2 SEATER</text>

      {/* ── COFFEE MACHINE ── */}
      <rect x="540" y="310" width="80" height="80" rx="3"
        fill={ZONE_COLORS.utility.fill} stroke={ZONE_COLORS.utility.stroke} strokeWidth="0.8" className="zone-rect" />
      <text x="580" y="350" className="zone-label-sm" fill={ZONE_COLORS.utility.label}>COFFEE</text>
      <text x="580" y="362" className="zone-label-xs" fill="rgba(148,163,184,0.5)">MACHINE</text>
      {/* Coffee machine icon */}
      <rect x="565" y="370" width="30" height="12" rx="3" fill="rgba(148,163,184,0.06)" stroke="rgba(148,163,184,0.15)" strokeWidth="0.5" />

      {/* ── TOILET ── */}
      <rect x="420" y="400" width="200" height="60" rx="3"
        fill={ZONE_COLORS.utility.fill} stroke={ZONE_COLORS.utility.stroke} strokeWidth="0.8" className="zone-rect" />
      <text x="520" y="434" className="zone-label" fill={ZONE_COLORS.utility.label}>TOILET M/F</text>
      {/* Toilet fixtures */}
      <circle cx="480" cy="435" r="8" fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="0.5" />
      <circle cx="540" cy="435" r="8" fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="0.5" />
    </g>

    {/* ── Dimension lines ── */}
    <g className="dimensions-group" opacity="0.3">
      <line x1="60" y1="475" x2="640" y2="475" stroke="#64748b" strokeWidth="0.5" strokeDasharray="2 3" />
      <text x="350" y="473" fill="#64748b" fontSize="6" textAnchor="middle" fontFamily="Inter">32'-4"</text>

      <line x1="635" y1="30" x2="635" y2="470" stroke="#64748b" strokeWidth="0.5" strokeDasharray="2 3" />
      <text x="632" y="250" fill="#64748b" fontSize="6" textAnchor="end" fontFamily="Inter" transform="rotate(-90 632 250)">39'-9"</text>
    </g>

    {/* ==================== SEAT MARKERS (Office Chair Icons) ==================== */}
    {visibleSeats.map((seat) => {
      const selected = isSeatSelected(seat.id);
      const isHovered = hoveredSeat === seat.id;
      const isUnavailable = seat.booked || seat.locked || !seat.dbId;
      const seatClass = seat.locked
        ? 'seat-marker locked'
        : seat.booked
          ? 'seat-marker booked'
          : selected
            ? 'seat-marker selected'
            : 'seat-marker available';
      const cx = seat.cx;
      const cy = seat.cy;

      return (
        <g key={seat.id} className={seatClass}
          onMouseEnter={() => setHoveredSeat(seat.id)}
          onMouseLeave={() => setHoveredSeat(null)}
          onClick={(e) => { e.stopPropagation(); if (!isUnavailable) toggleSeat(seat); }}
          style={{ cursor: isUnavailable ? 'not-allowed' : 'pointer' }}
        >
          {/* Selected glow background */}
          {selected && (
            <circle cx={cx} cy={cy} r="15" className="seat-glow-ring" />
          )}

          {/* ── Office Chair SVG ── */}
          {/* Chair backrest (curved top) */}
          <path
            d={`M ${cx-7} ${cy-4} Q ${cx-8} ${cy-11} ${cx-4} ${cy-13} Q ${cx} ${cy-15} ${cx+4} ${cy-13} Q ${cx+8} ${cy-11} ${cx+7} ${cy-4}`}
            className="chair-backrest"
            filter={selected ? 'url(#glow-cyan)' : seat.booked ? 'url(#glow-red)' : undefined}
          />
          {/* Chair seat pad */}
          <rect x={cx-8} y={cy-4} width="16" height="7" rx="2" className="chair-seat" />
          {/* Left armrest */}
          <line x1={cx-9} y1={cy-4} x2={cx-9} y2={cy+2} className="chair-arm" />
          <line x1={cx-9} y1={cy-4} x2={cx-6} y2={cy-4} className="chair-arm" />
          {/* Right armrest */}
          <line x1={cx+9} y1={cy-4} x2={cx+9} y2={cy+2} className="chair-arm" />
          <line x1={cx+9} y1={cy-4} x2={cx+6} y2={cy-4} className="chair-arm" />
          {/* Center pole */}
          <line x1={cx} y1={cy+3} x2={cx} y2={cy+7} className="chair-pole" />
          {/* Base star (5-point) */}
          <line x1={cx-6} y1={cy+9} x2={cx+6} y2={cy+9} className="chair-base" />
          <line x1={cx-5} y1={cy+9} x2={cx-7} y2={cy+11} className="chair-base" />
          <line x1={cx+5} y1={cy+9} x2={cx+7} y2={cy+11} className="chair-base" />
          <line x1={cx} y1={cy+7} x2={cx} y2={cy+9} className="chair-base" />
          {/* Wheels (small circles) */}
          <circle cx={cx-7} cy={cy+11} r="1.2" className="chair-wheel" />
          <circle cx={cx+7} cy={cy+11} r="1.2" className="chair-wheel" />
          <circle cx={cx} cy={cy+9} r="1" className="chair-wheel" />

          {/* Seat label */}
          <text x={cx} y={cy + 20} className="seat-label-svg">
            {seat.id}
          </text>

          {/* Hover tooltip — available */}
          {isHovered && !seat.booked && !seat.locked && (
            <g className="seat-tooltip-group">
              <rect x={cx - 55} y={cy - 32} width="110" height="34" rx="6"
                fill="rgba(15,23,42,0.95)" stroke="rgba(0,242,254,0.3)" strokeWidth="0.8" />
              <text x={cx} y={cy - 19} className="tooltip-title">{seat.id} — {seat.zone}</text>
              <text x={cx} y={cy - 7} className="tooltip-price">₹{formatPrice(seat.displayPrice ?? seat.price)}/{durationUnit}</text>
            </g>
          )}
          {/* Hover tooltip — admin locked or booked */}
          {isHovered && seat.booked && (
            <g className="seat-tooltip-group">
              <rect x={cx - 42} y={cy - 30} width="84" height="20" rx="5"
                fill="rgba(127,29,29,0.92)" stroke="rgba(239,68,68,0.3)" strokeWidth="0.8" />
              <text x={cx} y={cy - 16} className="tooltip-booked">
                {seat.adminLocked ? '🔒 LOCKED BY ADMIN' : 'UNAVAILABLE'}
              </text>
            </g>
          )}
          {/* Hover tooltip — time-locked */}
          {isHovered && seat.locked && (
            <g className="seat-tooltip-group">
              <rect x={cx - 55} y={cy - 38} width="110" height="42" rx="6"
                fill="rgba(28,20,5,0.95)" stroke="rgba(251,191,36,0.35)" strokeWidth="0.8" />
              <text x={cx} y={cy - 25} className="tooltip-locked">🔒 {seat.id} — LOCKED</text>
              <text x={cx} y={cy - 14} className="tooltip-title">
                {seat.lockedUntil
                  ? `Until ${seat.lockedUntil.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`
                  : 'Currently occupied'}
              </text>
            </g>
          )}
        </g>
      );
    })}
  </svg>
));


/* ─── Main Component ─── */
const BookingPage = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [durationUnit, setDurationUnit] = useState('monthly');
  const [durationQuantity, setDurationQuantity] = useState(1);
  const [backendSeats, setBackendSeats] = useState([]);
  const [seatError, setSeatError] = useState('');
  const [loadingSeats, setLoadingSeats] = useState(true);
  const [viewMode, setViewMode] = useState('2d'); // '2d' | '3d'
  const [hoveredSeat, setHoveredSeat] = useState(null);

  // Zoom (no drag-to-pan — it interferes with seat clicks)
  const [zoom, setZoom] = useState(1);
  const mapRef = useRef(null);

  useEffect(() => {
    let active = true;
    setLoadingSeats(true);
    fetchSeats()
      .then((data) => {
        if (!active) return;
        setBackendSeats(Array.isArray(data) ? data : []);
        setSeatError('');
      })
      .catch((err) => {
        if (!active) return;
        setSeatError(err?.message || 'Failed to load seats');
      })
      .finally(() => {
        if (active) setLoadingSeats(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const backendSeatMap = useMemo(() => {
    const map = new Map();
    backendSeats.forEach((seat) => {
      map.set(seat.code, seat);
    });
    return map;
  }, [backendSeats]);

  const enrichedSeats = useMemo(() => (
    FLOOR_PLAN_SEATS.map((seat) => {
      const backendSeat = backendSeatMap.get(seat.id);
      if (!backendSeat) {
        return { ...seat, booked: true, locked: false, lockedUntil: null, dbId: null, backendAvailable: false };
      }
      const isLocked = !!backendSeat.locked_until;
      const isAdminLocked = !backendSeat.is_available && !isLocked;
      return {
        ...seat,
        dbId: backendSeat.id,
        code: backendSeat.code,
        price: backendSeat.price,
        booked: !backendSeat.is_available && !isLocked,
        locked: isLocked,
        adminLocked: isAdminLocked,
        lockedUntil: backendSeat.locked_until ? new Date(backendSeat.locked_until) : null,
        backendAvailable: backendSeat.is_available,
      };
    })
  ), [backendSeatMap]);

  const visibleSeats = useMemo(() => {
    const filtered = activeFilter === 'all'
      ? enrichedSeats
      : enrichedSeats.filter((s) => s.workspaceType === activeFilter);
    return filtered.map((seat) => ({
      ...seat,
      displayPrice: computeDurationPrice(seat.workspaceType, durationUnit, durationQuantity),
    }));
  }, [activeFilter, enrichedSeats, durationUnit, durationQuantity]);

  const workspaceStats = useMemo(() => {
    const seatTotal = enrichedSeats.length;
    const availableSeats = enrichedSeats.filter((s) => s.backendAvailable).length;
    return { seatTotal, availableSeats };
  }, [enrichedSeats]);

  const toggleSeat = useCallback((seat) => {
    setSelectedSeats((prev) => {
      const exists = prev.find((s) => s.id === seat.id);
      return exists ? prev.filter((s) => s.id !== seat.id) : [...prev, seat];
    });
  }, []);

  const removeSeat = (seatId) => setSelectedSeats((prev) => prev.filter((s) => s.id !== seatId));
  const isSeatSelected = useCallback((seatId) => selectedSeats.some((s) => s.id === seatId), [selectedSeats]);
  const totalPrice = useMemo(
    () => selectedSeats.reduce((sum, s) => sum + computeDurationPrice(s.workspaceType, durationUnit, durationQuantity), 0),
    [selectedSeats, durationUnit, durationQuantity]
  );
  const selectionBreakdown = useMemo(() =>
    selectedSeats.reduce((acc, s) => { acc[s.workspaceType] = (acc[s.workspaceType] || 0) + 1; return acc; }, {}),
    [selectedSeats]
  );

  const handleProceed = () => {
    navigate('/payment', {
      state: { seats: selectedSeats, total: totalPrice, durationUnit, durationQuantity, floor: '14th Floor - SkyDesk360 Baner Layout' },
    });
  };

  /* Zoom controls */
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleResetView = () => setZoom(1);

  /* Mouse wheel zoom */
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((z) => Math.min(Math.max(z + delta, 0.5), 3));
  }, []);

  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  return (
    <div className="bp-page">
      {/* ─── Ambient background effects ─── */}
      <div className="bp-ambient-glow bp-glow-1" />
      <div className="bp-ambient-glow bp-glow-2" />

      {/* ─── Header ─── */}
      <div className="bp-header">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="bp-header-inner">
          <span className="bp-header-badge">PREMIUM WORKSPACE</span>
          <h1 className="bp-title">
            Floor <span className="bp-title-accent">Blueprint</span>
          </h1>
          <p className="bp-subtitle">Interactive 2D & 3D seat selection • 14th Floor, Baner</p>
        </motion.div>
      </div>

      {(loadingSeats || seatError || (!loadingSeats && backendSeats.length === 0)) && (
        <div className={`bp-seat-alert ${seatError ? 'error' : ''}`}>
          {loadingSeats && 'Loading seat availability...'}
          {seatError && `Seat load failed: ${seatError}`}
          {!loadingSeats && !seatError && backendSeats.length === 0 && 'No seats found in the database. Ask admin to initialize seats.'}
        </div>
      )}

      {/* ─── Filters ─── */}
      <div className="bp-filters">
        {WORKSPACE_FILTERS.map((f) => (
          <button key={f.id} className={`bp-filter-btn ${activeFilter === f.id ? 'active' : ''}`} onClick={() => setActiveFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {/* ─── Stats bar ─── */}
      <div className="bp-stats">
        <span className="bp-stat"><Users size={13} /> Remaining seats: {workspaceStats.availableSeats} / {workspaceStats.seatTotal}</span>
        <span className="bp-stat"><BriefcaseBusiness size={13} /> SVG precision floor plan</span>
        <span className="bp-stat"><Building2 size={13} /> 4 workspace categories</span>
      </div>

      {/* ─── Main Container ─── */}
      <div className="bp-container">
        {/* ─── Map Section ─── */}
        <div className="bp-map-section">
          {/* Toolbar */}
          <div className="bp-toolbar">
            <div className="bp-toolbar-left">
              <span className="bp-toolbar-title">Floor Map</span>
              <span className="bp-toolbar-hint">Click seats to select • Scroll to zoom</span>
            </div>
            <div className="bp-toolbar-controls">
              <button className={`bp-view-btn ${viewMode === '2d' ? 'active' : ''}`} onClick={() => setViewMode('2d')} title="2D View">
                <Layers size={14} /> 2D
              </button>
              <button className={`bp-view-btn ${viewMode === '3d' ? 'active' : ''}`} onClick={() => setViewMode('3d')} title="3D View">
                <Box size={14} /> 3D
              </button>
              <div className="bp-toolbar-divider" />
              <button className="bp-zoom-btn" onClick={handleZoomIn} title="Zoom In"><ZoomIn size={14} /></button>
              <button className="bp-zoom-btn" onClick={handleZoomOut} title="Zoom Out"><ZoomOut size={14} /></button>
              <button className="bp-zoom-btn" onClick={handleResetView} title="Reset View"><RotateCcw size={14} /></button>
              <span className="bp-zoom-level">{Math.round(zoom * 100)}%</span>
            </div>
          </div>

          {/* Map canvas */}
          <div className="bp-map-canvas-wrapper" ref={mapRef}>
            <div className={`bp-map-transform ${viewMode === '3d' ? 'bp-3d-active' : ''}`}
              style={{ transform: `scale(${zoom})` }}
            >
              <FloorPlanSVG
                visibleSeats={visibleSeats}
                isSeatSelected={isSeatSelected}
                toggleSeat={toggleSeat}
                hoveredSeat={hoveredSeat}
                setHoveredSeat={setHoveredSeat}
                durationUnit={durationUnit}
              />
            </div>
          </div>

          {/* Legend */}
          <div className="bp-legend">
            <div className="bp-legend-item">
              <div className="bp-legend-dot available" />
              <span>Available</span>
            </div>
            <div className="bp-legend-item">
              <div className="bp-legend-dot selected" />
              <span>Selected</span>
            </div>
            <div className="bp-legend-item">
              <div className="bp-legend-dot locked" />
              <span>Locked</span>
            </div>
            <div className="bp-legend-item">
              <div className="bp-legend-dot booked" />
              <span>Unavailable</span>
            </div>
            <div className="bp-legend-sep" />
            <div className="bp-legend-item">
              <div className="bp-legend-swatch" style={{ background: ZONE_COLORS.workstation.stroke }} />
              <span>Workstation</span>
            </div>
            <div className="bp-legend-item">
              <div className="bp-legend-swatch" style={{ background: ZONE_COLORS.cabin.stroke }} />
              <span>Cabin</span>
            </div>
            <div className="bp-legend-item">
              <div className="bp-legend-swatch" style={{ background: ZONE_COLORS.conference.stroke }} />
              <span>Conference</span>
            </div>
            <div className="bp-legend-item">
              <div className="bp-legend-swatch" style={{ background: ZONE_COLORS.meeting.stroke }} />
              <span>Meeting</span>
            </div>
          </div>
        </div>

        {/* ─── Sidebar ─── */}
        <div className="bp-sidebar">
        <div className="bp-summary-card">
          <div className="bp-summary-accent" />
          <h3 className="bp-summary-title">Booking Summary</h3>

          <div className="bp-duration">
            <div className="bp-duration-label">Billing Duration</div>
            <div className="bp-duration-options">
              {DURATION_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  className={`bp-duration-btn ${durationUnit === option.id ? 'active' : ''}`}
                  onClick={() => { setDurationUnit(option.id); setDurationQuantity(1); }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity selector */}
          <div className="bp-duration" style={{ marginTop: '0.75rem' }}>
            <div className="bp-duration-label">
              {durationUnit === 'hourly' ? 'Number of Hours' : durationUnit === 'daily' ? 'Number of Days' : durationUnit === 'monthly' ? 'Number of Months' : 'Number of Years'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                onClick={() => setDurationQuantity((q) => Math.max(1, q - 1))}
                style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#94a3b8', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >−</button>
              <span style={{ minWidth: '32px', textAlign: 'center', fontSize: '1rem', fontWeight: 800, color: '#e2e8f0' }}>{durationQuantity}</span>
              <button
                onClick={() => setDurationQuantity((q) => Math.min(durationUnit === 'hourly' ? 24 : durationUnit === 'daily' ? 30 : 12, q + 1))}
                style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid rgba(0,242,254,0.3)', background: 'rgba(0,242,254,0.06)', color: '#00f2fe', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >+</button>
              <span style={{ fontSize: '0.62rem', fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {durationUnit === 'hourly' ? 'hr(s)' : durationUnit === 'daily' ? 'day(s)' : durationUnit === 'monthly' ? 'mo(s)' : 'yr(s)'}
              </span>
            </div>
          </div>

          <div className="bp-duration-summary">
            Selected {selectedSeats.length} of {workspaceStats.availableSeats} remaining
          </div>

          {selectedSeats.length === 0 ? (
              <div className="bp-empty-state">
                <div className="bp-empty-icon-wrap">
                  <Armchair className="bp-empty-icon" />
                </div>
                <p className="bp-empty-text">Select seats on the interactive floor map to build your booking.</p>
              </div>
            ) : (
              <>
                <div className="bp-seats-list">
                  <AnimatePresence>
                    {selectedSeats.map((seat) => (
                      <motion.div
                        key={seat.id}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 16 }}
                        className="bp-seat-row"
                      >
                        <div className="bp-seat-info">
                          <span className="bp-seat-name">{seat.id}</span>
                          <span className="bp-seat-zone">{seat.zone}</span>
                          <span className="bp-seat-type">{WORKSPACE_LABELS[seat.workspaceType]}</span>
                        </div>
                        <div className="bp-seat-actions">
                          <span className="bp-seat-price">₹{formatPrice(computeDurationPrice(seat.workspaceType, durationUnit, durationQuantity))}</span>
                          <button className="bp-remove-btn" onClick={() => removeSeat(seat.id)} title="Remove"><X size={13} /></button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="bp-divider" />

                <div className="bp-breakdown">
                  {Object.entries(selectionBreakdown).map(([type, count]) => (
                    <span key={type} className="bp-breakdown-chip">{WORKSPACE_LABELS[type]}: {count}</span>
                  ))}
                </div>

                <div className="bp-total-row">
                  <span className="bp-total-label">Total</span>
                  <span className="bp-total-amount">₹{formatPrice(totalPrice)}</span>
                </div>

                <div className="bp-duration-summary">Billing: {durationQuantity} × {durationUnit.charAt(0).toUpperCase() + durationUnit.slice(1)}</div>
              </>
            )}

            <button className="bp-proceed-btn" disabled={selectedSeats.length === 0} onClick={handleProceed}>
              <span className="bp-proceed-text">Proceed to Payment</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
