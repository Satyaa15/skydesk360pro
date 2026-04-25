/**
 * Shared floor-plan constants and SVG component.
 * Used by both BookingPage (user) and AdminCRM (admin New Booking tab).
 */
import React from 'react';
import '../pages/BookingPage.css'; // SVG seat-marker styles

// These workspace types must be booked as a whole unit.
export const WHOLE_UNIT_TYPES = new Set(['cabin', 'conference', 'meeting_room']);

// Zone → primary seat CODE sent to the backend (one booking = one price).
export const ZONE_PRIMARY_SEAT = {
  "CEO's Cabin":                      'CEO-1',
  "Director's Cabin":                 'DIR-1',
  "Convertible 10 Seater Conference": 'CONF-1',
  "2 Seater Meeting Room":            'MR-1',
};

export const ZONE_DISPLAY_LABEL = {
  "CEO's Cabin":                      "CEO's Cabin (3-seat unit)",
  "Director's Cabin":                 "Director's Cabin (5-seat unit)",
  "Convertible 10 Seater Conference": "Conference Room (10-seat unit)",
  "2 Seater Meeting Room":            "Meeting Room (2-seat unit)",
};

// Must stay in sync with backend pricing.SEAT_PRICES
export const SEAT_PRICES = {
  workstation:  { hourly: 100,  daily: 500,   monthly: 7_500,   yearly: 81_000  },
  cabin:        { hourly: 500,  daily: 2_500, monthly: 40_000,  yearly: 432_000 },
  conference:   { hourly: 700,  daily: 4_500, monthly: 90_000,  yearly: 972_000 },
  meeting_room: { hourly: 700,  daily: 4_500, monthly: 16_000,  yearly: 900_000 },
};

export const computeDurationPrice = (workspaceType, durationUnit, quantity = 1) => {
  const prices = SEAT_PRICES[workspaceType] || SEAT_PRICES.workstation;
  let rate;
  if (durationUnit === 'hourly') rate = prices.hourly;
  else if (durationUnit === 'daily') rate = prices.daily;
  else if (durationUnit === 'yearly') rate = prices.yearly !== undefined ? prices.yearly : prices.monthly * 12 * 0.9;
  else rate = prices.monthly;
  return rate * quantity;
};

export const formatPrice = (value) => {
  const rounded = Math.round(value * 100) / 100;
  return rounded.toLocaleString();
};

export const ZONE_COLORS = {
  workstation: { fill: 'rgba(56,189,248,0.10)',  stroke: '#38bdf8', label: '#38bdf8' },
  reception:   { fill: 'rgba(251,191,36,0.08)',  stroke: '#fbbf24', label: '#fbbf24' },
  conference:  { fill: 'rgba(52,211,153,0.10)',  stroke: '#34d399', label: '#34d399' },
  cabin:       { fill: 'rgba(168,85,247,0.10)',  stroke: '#a855f7', label: '#a855f7' },
  meeting:     { fill: 'rgba(251,191,36,0.10)',  stroke: '#fbbf24', label: '#fbbf24' },
  utility:     { fill: 'rgba(148,163,184,0.06)', stroke: '#64748b', label: '#94a3b8' },
  passage:     { fill: 'rgba(148,163,184,0.04)', stroke: '#475569', label: '#64748b' },
};

export const FLOOR_PLAN_SEATS = [
  // Workstations Row A
  { id: 'WS-A1', zone: 'Workstations Row A', workspaceType: 'workstation', price: 500, cx: 178, cy: 98,  booked: false },
  { id: 'WS-A2', zone: 'Workstations Row A', workspaceType: 'workstation', price: 500, cx: 218, cy: 98,  booked: false },
  { id: 'WS-A3', zone: 'Workstations Row A', workspaceType: 'workstation', price: 500, cx: 258, cy: 98,  booked: false },
  { id: 'WS-A4', zone: 'Workstations Row A', workspaceType: 'workstation', price: 500, cx: 298, cy: 98,  booked: false },
  { id: 'WS-A5', zone: 'Workstations Row A', workspaceType: 'workstation', price: 500, cx: 338, cy: 98,  booked: false },
  { id: 'WS-A6', zone: 'Workstations Row A', workspaceType: 'workstation', price: 500, cx: 378, cy: 98,  booked: false },
  // Workstations Row B
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
  // Conference Room
  { id: 'CONF-1',  zone: 'Convertible 10 Seater Conference', workspaceType: 'conference', price: 3000, cx: 490, cy: 80,  booked: false },
  { id: 'CONF-2',  zone: 'Convertible 10 Seater Conference', workspaceType: 'conference', price: 3000, cx: 560, cy: 80,  booked: false },
  { id: 'CONF-3',  zone: 'Convertible 10 Seater Conference', workspaceType: 'conference', price: 3000, cx: 490, cy: 120, booked: false },
  { id: 'CONF-4',  zone: 'Convertible 10 Seater Conference', workspaceType: 'conference', price: 3000, cx: 560, cy: 120, booked: false },
  { id: 'CONF-5',  zone: 'Convertible 10 Seater Conference', workspaceType: 'conference', price: 3000, cx: 490, cy: 160, booked: false },
  { id: 'CONF-6',  zone: 'Convertible 10 Seater Conference', workspaceType: 'conference', price: 3000, cx: 560, cy: 160, booked: false },
  { id: 'CONF-7',  zone: 'Convertible 10 Seater Conference', workspaceType: 'conference', price: 3000, cx: 490, cy: 200, booked: false },
  { id: 'CONF-8',  zone: 'Convertible 10 Seater Conference', workspaceType: 'conference', price: 3000, cx: 560, cy: 200, booked: false },
  { id: 'CONF-9',  zone: 'Convertible 10 Seater Conference', workspaceType: 'conference', price: 3000, cx: 490, cy: 240, booked: false },
  { id: 'CONF-10', zone: 'Convertible 10 Seater Conference', workspaceType: 'conference', price: 3000, cx: 560, cy: 240, booked: false },
  // CEO Cabin
  { id: 'CEO-1', zone: "CEO's Cabin", workspaceType: 'cabin', price: 2200, cx: 170, cy: 370, booked: false },
  { id: 'CEO-2', zone: "CEO's Cabin", workspaceType: 'cabin', price: 2200, cx: 210, cy: 370, booked: false },
  { id: 'CEO-3', zone: "CEO's Cabin", workspaceType: 'cabin', price: 2200, cx: 190, cy: 410, booked: false },
  // Director Cabin
  { id: 'DIR-1', zone: "Director's Cabin", workspaceType: 'cabin', price: 1800, cx: 290, cy: 370, booked: false },
  { id: 'DIR-2', zone: "Director's Cabin", workspaceType: 'cabin', price: 1800, cx: 320, cy: 370, booked: false },
  { id: 'DIR-3', zone: "Director's Cabin", workspaceType: 'cabin', price: 1800, cx: 350, cy: 370, booked: false },
  { id: 'DIR-4', zone: "Director's Cabin", workspaceType: 'cabin', price: 1800, cx: 305, cy: 410, booked: false },
  { id: 'DIR-5', zone: "Director's Cabin", workspaceType: 'cabin', price: 1800, cx: 335, cy: 410, booked: false },
  // Meeting Room
  { id: 'MR-1', zone: '2 Seater Meeting Room', workspaceType: 'meeting_room', price: 900, cx: 450, cy: 370, booked: false },
  { id: 'MR-2', zone: '2 Seater Meeting Room', workspaceType: 'meeting_room', price: 900, cx: 480, cy: 370, booked: false },
];

export const FloorPlanSVG = React.memo(({ visibleSeats, isSeatSelected, toggleSeat, hoveredSeat, setHoveredSeat, durationUnit }) => (
  <svg viewBox="0 0 640 480" className="floor-svg" xmlns="http://www.w3.org/2000/svg">
    <defs>
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
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(148,163,184,0.06)" strokeWidth="0.5" />
      </pattern>
      <pattern id="deskHatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="4" stroke="rgba(148,163,184,0.08)" strokeWidth="1" />
      </pattern>
    </defs>

    <rect width="640" height="480" fill="url(#grid)" />

    <g className="walls-group">
      <rect x="60" y="30" width="580" height="440" rx="3" fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth="2" />

      <rect x="130" y="50" width="290" height="130" rx="3"
        fill={ZONE_COLORS.workstation.fill} stroke={ZONE_COLORS.workstation.stroke} strokeWidth="1.2" className="zone-rect zone-workstation" />
      <rect x="155" y="75"  width="250" height="8" rx="2" fill="rgba(56,189,248,0.06)" stroke="rgba(56,189,248,0.2)" strokeWidth="0.5" />
      <rect x="155" y="130" width="250" height="8" rx="2" fill="rgba(56,189,248,0.06)" stroke="rgba(56,189,248,0.2)" strokeWidth="0.5" />
      <text x="275" y="66" className="zone-label" fill={ZONE_COLORS.workstation.label}>WORKSTATIONS</text>

      <rect x="130" y="185" width="290" height="55" rx="3"
        fill={ZONE_COLORS.reception.fill} stroke={ZONE_COLORS.reception.stroke} strokeWidth="1.2" className="zone-rect zone-reception" />
      <rect x="155" y="200" width="80" height="25" rx="6" fill="rgba(251,191,36,0.08)" stroke="rgba(251,191,36,0.25)" strokeWidth="0.8" />
      <text x="195" y="216" className="zone-label-sm" fill={ZONE_COLORS.reception.label}>RECEPTION</text>
      <text x="275" y="200" className="zone-label" fill={ZONE_COLORS.reception.label}>RECEPTION AREA</text>

      <rect x="445" y="50" width="170" height="220" rx="3"
        fill={ZONE_COLORS.conference.fill} stroke={ZONE_COLORS.conference.stroke} strokeWidth="1.2" className="zone-rect zone-conference" />
      <line x1="445" y1="50" x2="445" y2="68" stroke={ZONE_COLORS.conference.stroke} strokeWidth="2" strokeDasharray="4 2" />
      <line x1="445" y1="252" x2="445" y2="270" stroke={ZONE_COLORS.conference.stroke} strokeWidth="2" strokeDasharray="4 2" />
      <rect x="505" y="70" width="30" height="190" rx="6" fill="rgba(52,211,153,0.06)" stroke="rgba(52,211,153,0.2)" strokeWidth="0.8" />
      <text x="530" y="62" className="zone-label" fill={ZONE_COLORS.conference.label}>CONFERENCE</text>
      <text x="530" y="280" className="zone-label-sm" fill={ZONE_COLORS.conference.label}>CONVERTIBLE 10 SEATER</text>
      <text x="445" y="46" className="zone-label-xs" fill="rgba(52,211,153,0.6)">SLIDING GLASS</text>

      <rect x="62" y="260" width="30" height="200" rx="1"
        fill={ZONE_COLORS.passage.fill} stroke={ZONE_COLORS.passage.stroke} strokeWidth="0.8" className="zone-rect" />
      <text x="77" y="360" className="zone-label-vertical" fill={ZONE_COLORS.passage.label} transform="rotate(-90 77 360)">PASSAGE 5&apos; WIDE</text>

      <g className="entrance-group">
        <rect x="60" y="270" width="34" height="3" fill="#00f2fe" rx="1" />
        <text x="77" y="266" className="entrance-label" fill="#00f2fe">ENTRANCE</text>
        <path d="M 64 273 L 54 283 L 64 293" fill="none" stroke="#00f2fe" strokeWidth="1.5" className="entrance-arrow" />
      </g>

      <rect x="100" y="310" width="140" height="130" rx="3"
        fill={ZONE_COLORS.cabin.fill} stroke={ZONE_COLORS.cabin.stroke} strokeWidth="1.2" className="zone-rect zone-cabin" />
      <rect x="155" y="350" width="60" height="12" rx="3" fill="rgba(168,85,247,0.06)" stroke="rgba(168,85,247,0.2)" strokeWidth="0.5" />
      <path d="M 100 310 Q 120 295 140 310" fill="none" stroke="rgba(168,85,247,0.3)" strokeWidth="0.8" strokeDasharray="3 2" />
      <text x="170" y="328" className="zone-label" fill={ZONE_COLORS.cabin.label}>CEO&apos;S CABIN</text>

      <rect x="250" y="310" width="160" height="130" rx="3"
        fill={ZONE_COLORS.cabin.fill} stroke={ZONE_COLORS.cabin.stroke} strokeWidth="1.2" className="zone-rect zone-cabin" />
      <rect x="300" y="350" width="60" height="12" rx="3" fill="rgba(168,85,247,0.06)" stroke="rgba(168,85,247,0.2)" strokeWidth="0.5" />
      <path d="M 250 310 Q 270 295 290 310" fill="none" stroke="rgba(168,85,247,0.3)" strokeWidth="0.8" strokeDasharray="3 2" />
      <text x="330" y="328" className="zone-label" fill={ZONE_COLORS.cabin.label}>DIRECTOR&apos;S CABIN</text>

      <rect x="420" y="310" width="110" height="80" rx="3"
        fill={ZONE_COLORS.meeting.fill} stroke={ZONE_COLORS.meeting.stroke} strokeWidth="1.2" className="zone-rect zone-meeting" />
      <circle cx="465" cy="355" r="18" fill="rgba(251,191,36,0.05)" stroke="rgba(251,191,36,0.2)" strokeWidth="0.8" />
      <text x="475" y="328" className="zone-label-sm" fill={ZONE_COLORS.meeting.label}>MEETING ROOM</text>
      <text x="475" y="340" className="zone-label-xs" fill="rgba(251,191,36,0.5)">2 SEATER</text>

      <rect x="540" y="310" width="80" height="80" rx="3"
        fill={ZONE_COLORS.utility.fill} stroke={ZONE_COLORS.utility.stroke} strokeWidth="0.8" className="zone-rect" />
      <text x="580" y="350" className="zone-label-sm" fill={ZONE_COLORS.utility.label}>COFFEE</text>
      <text x="580" y="362" className="zone-label-xs" fill="rgba(148,163,184,0.5)">MACHINE</text>
      <rect x="565" y="370" width="30" height="12" rx="3" fill="rgba(148,163,184,0.06)" stroke="rgba(148,163,184,0.15)" strokeWidth="0.5" />

      <rect x="420" y="400" width="200" height="60" rx="3"
        fill={ZONE_COLORS.utility.fill} stroke={ZONE_COLORS.utility.stroke} strokeWidth="0.8" className="zone-rect" />
      <text x="520" y="434" className="zone-label" fill={ZONE_COLORS.utility.label}>TOILET M/F</text>
      <circle cx="480" cy="435" r="8" fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="0.5" />
      <circle cx="540" cy="435" r="8" fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="0.5" />
    </g>

    <g className="dimensions-group" opacity="0.3">
      <line x1="60" y1="475" x2="640" y2="475" stroke="#64748b" strokeWidth="0.5" strokeDasharray="2 3" />
      <text x="350" y="473" fill="#64748b" fontSize="6" textAnchor="middle" fontFamily="Inter">32&apos;-4&quot;</text>
      <line x1="635" y1="30" x2="635" y2="470" stroke="#64748b" strokeWidth="0.5" strokeDasharray="2 3" />
      <text x="632" y="250" fill="#64748b" fontSize="6" textAnchor="end" fontFamily="Inter" transform="rotate(-90 632 250)">39&apos;-9&quot;</text>
    </g>

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
      const { cx, cy } = seat;
      return (
        <g key={seat.id} className={seatClass}
          onMouseEnter={() => setHoveredSeat(seat.id)}
          onMouseLeave={() => setHoveredSeat(null)}
          onClick={(e) => { e.stopPropagation(); if (!isUnavailable) toggleSeat(seat); }}
          style={{ cursor: isUnavailable ? 'not-allowed' : 'pointer' }}
        >
          {selected && <circle cx={cx} cy={cy} r="15" className="seat-glow-ring" />}

          <path d={`M ${cx-7} ${cy-4} Q ${cx-8} ${cy-11} ${cx-4} ${cy-13} Q ${cx} ${cy-15} ${cx+4} ${cy-13} Q ${cx+8} ${cy-11} ${cx+7} ${cy-4}`}
            className="chair-backrest" filter={selected ? 'url(#glow-cyan)' : seat.booked ? 'url(#glow-red)' : undefined} />
          <rect x={cx-8} y={cy-4} width="16" height="7" rx="2" className="chair-seat" />
          <line x1={cx-9} y1={cy-4} x2={cx-9} y2={cy+2} className="chair-arm" />
          <line x1={cx-9} y1={cy-4} x2={cx-6} y2={cy-4} className="chair-arm" />
          <line x1={cx+9} y1={cy-4} x2={cx+9} y2={cy+2} className="chair-arm" />
          <line x1={cx+9} y1={cy-4} x2={cx+6} y2={cy-4} className="chair-arm" />
          <line x1={cx} y1={cy+3} x2={cx} y2={cy+7} className="chair-pole" />
          <line x1={cx-6} y1={cy+9} x2={cx+6} y2={cy+9} className="chair-base" />
          <line x1={cx-5} y1={cy+9} x2={cx-7} y2={cy+11} className="chair-base" />
          <line x1={cx+5} y1={cy+9} x2={cx+7} y2={cy+11} className="chair-base" />
          <line x1={cx} y1={cy+7} x2={cx} y2={cy+9} className="chair-base" />
          <circle cx={cx-7} cy={cy+11} r="1.2" className="chair-wheel" />
          <circle cx={cx+7} cy={cy+11} r="1.2" className="chair-wheel" />
          <circle cx={cx} cy={cy+9} r="1" className="chair-wheel" />

          <text x={cx} y={cy + 20} className="seat-label-svg">{seat.id}</text>

          {isHovered && !seat.booked && !seat.locked && (
            <g className="seat-tooltip-group">
              <rect x={cx - 65} y={cy - 38} width="130" height="42" rx="6"
                fill="rgba(15,23,42,0.95)" stroke="rgba(0,242,254,0.3)" strokeWidth="0.8" />
              <text x={cx} y={cy - 25} className="tooltip-title">
                {WHOLE_UNIT_TYPES.has(seat.workspaceType) ? seat.zone : `${seat.id} — ${seat.zone}`}
              </text>
              {WHOLE_UNIT_TYPES.has(seat.workspaceType) && (
                <text x={cx} y={cy - 14} className="tooltip-title" style={{ fontSize: '5.5px', fill: '#a855f7' }}>
                  Click to book entire unit exclusively
                </text>
              )}
              <text x={cx} y={cy - 4} className="tooltip-price">₹{formatPrice(seat.displayPrice ?? seat.price)}/{durationUnit}</text>
            </g>
          )}
          {isHovered && seat.booked && (
            <g className="seat-tooltip-group">
              <rect x={cx - 42} y={cy - 30} width="84" height="20" rx="5"
                fill="rgba(127,29,29,0.92)" stroke="rgba(239,68,68,0.3)" strokeWidth="0.8" />
              <text x={cx} y={cy - 16} className="tooltip-booked">
                {seat.adminLocked ? '🔒 LOCKED BY ADMIN' : 'UNAVAILABLE'}
              </text>
            </g>
          )}
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

export default FloorPlanSVG;
