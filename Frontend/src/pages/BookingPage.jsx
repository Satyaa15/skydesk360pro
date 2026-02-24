import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Armchair, X, ChevronRight, Users, Building2, BriefcaseBusiness } from 'lucide-react';
import './BookingPage.css';

const WORKSPACE_LABELS = {
  workstation: 'Workstation',
  cabin: 'Cabin',
  meeting_room: 'Meeting Room',
  conference: 'Conference',
};

const WORKSPACE_FILTERS = [
  { id: 'all', label: 'All Options' },
  { id: 'workstation', label: 'Workstations' },
  { id: 'cabin', label: 'Cabins' },
  { id: 'meeting_room', label: 'Meeting Room' },
  { id: 'conference', label: 'Conference' },
];

// Layout blocks recreated from uploaded blueprint (code-only map, no background image).
const FLOOR_BLOCKS = [
  { id: 'ws-1', label: 'WORKSTATIONS', x: 13, y: 7, w: 53, h: 11, kind: 'workspace' },
  { id: 'ws-2', label: 'WORKSTATIONS', x: 13, y: 20, w: 53, h: 11, kind: 'workspace' },
  { id: 'reception', label: 'RECEPTION AREA', x: 13, y: 35, w: 53, h: 14, kind: 'reception' },
  { id: 'conf', label: 'CONVERTIBLE 10 SEATER CONFERENCE', x: 69, y: 6, w: 24, h: 52, kind: 'conference' },
  { id: 'ceo', label: "CEO'S CABIN", x: 13, y: 58, w: 21, h: 32, kind: 'cabin' },
  { id: 'director', label: "DIRECTOR'S CABIN", x: 36, y: 58, w: 22, h: 32, kind: 'cabin' },
  { id: 'meeting', label: '2 SEATER MEETING ROOM', x: 60, y: 58, w: 21, h: 18, kind: 'meeting' },
  { id: 'coffee', label: 'COFFEE', x: 82, y: 58, w: 11, h: 18, kind: 'utility' },
  { id: 'toilet', label: 'TOILET M/F', x: 60, y: 78, w: 33, h: 12, kind: 'utility' },
  { id: 'passage', label: "PASSAGE 5' WIDE", x: 4, y: 54, w: 6, h: 36, kind: 'passage' },
];

const FLOOR_PLAN_SEATS = [
  // Workstations Row A
  { id: 'WS-A1', zone: 'Workstations Row A', workspaceType: 'workstation', price: 500, x: 19.3, y: 15.9, rotation: 0, booked: false },
  { id: 'WS-A2', zone: 'Workstations Row A', workspaceType: 'workstation', price: 500, x: 27.9, y: 15.9, rotation: 0, booked: true },
  { id: 'WS-A3', zone: 'Workstations Row A', workspaceType: 'workstation', price: 500, x: 36.6, y: 15.9, rotation: 0, booked: false },
  { id: 'WS-A4', zone: 'Workstations Row A', workspaceType: 'workstation', price: 500, x: 45.5, y: 15.9, rotation: 0, booked: false },
  { id: 'WS-A5', zone: 'Workstations Row A', workspaceType: 'workstation', price: 500, x: 54.2, y: 15.9, rotation: 0, booked: false },
  { id: 'WS-A6', zone: 'Workstations Row A', workspaceType: 'workstation', price: 500, x: 62.8, y: 15.9, rotation: 0, booked: false },

  // Workstations Row B
  { id: 'WS-B1', zone: 'Workstations Row B', workspaceType: 'workstation', price: 500, x: 19.3, y: 26.8, rotation: 0, booked: false },
  { id: 'WS-B2', zone: 'Workstations Row B', workspaceType: 'workstation', price: 500, x: 27.9, y: 26.8, rotation: 0, booked: false },
  { id: 'WS-B3', zone: 'Workstations Row B', workspaceType: 'workstation', price: 500, x: 36.6, y: 26.8, rotation: 0, booked: true },
  { id: 'WS-B4', zone: 'Workstations Row B', workspaceType: 'workstation', price: 500, x: 45.5, y: 26.8, rotation: 0, booked: false },
  { id: 'WS-B5', zone: 'Workstations Row B', workspaceType: 'workstation', price: 500, x: 54.2, y: 26.8, rotation: 0, booked: false },
  { id: 'WS-B6', zone: 'Workstations Row B', workspaceType: 'workstation', price: 500, x: 62.8, y: 26.8, rotation: 0, booked: false },

  // Reception-facing workstations
  { id: 'WS-R1', zone: 'Reception Workstations', workspaceType: 'workstation', price: 550, x: 38.2, y: 37.8, rotation: 0, booked: true },
  { id: 'WS-R2', zone: 'Reception Workstations', workspaceType: 'workstation', price: 550, x: 46.6, y: 37.8, rotation: 0, booked: false },
  { id: 'WS-R3', zone: 'Reception Workstations', workspaceType: 'workstation', price: 550, x: 55, y: 37.8, rotation: 0, booked: false },

  // Convertible conference (10 seater)
  { id: 'CONF-1', zone: 'Convertible 10 Seater Conference', workspaceType: 'conference', price: 3000, x: 72.2, y: 17.2, rotation: 90, booked: false },
  { id: 'CONF-2', zone: 'Convertible 10 Seater Conference', workspaceType: 'conference', price: 3000, x: 84.3, y: 17.2, rotation: 270, booked: false },
  { id: 'CONF-3', zone: 'Convertible 10 Seater Conference', workspaceType: 'conference', price: 3000, x: 72.2, y: 26.2, rotation: 90, booked: false },
  { id: 'CONF-4', zone: 'Convertible 10 Seater Conference', workspaceType: 'conference', price: 3000, x: 84.3, y: 26.2, rotation: 270, booked: true },
  { id: 'CONF-5', zone: 'Convertible 10 Seater Conference', workspaceType: 'conference', price: 3000, x: 72.2, y: 34.9, rotation: 90, booked: false },
  { id: 'CONF-6', zone: 'Convertible 10 Seater Conference', workspaceType: 'conference', price: 3000, x: 84.3, y: 34.9, rotation: 270, booked: false },
  { id: 'CONF-7', zone: 'Convertible 10 Seater Conference', workspaceType: 'conference', price: 3000, x: 72.2, y: 43.7, rotation: 90, booked: false },
  { id: 'CONF-8', zone: 'Convertible 10 Seater Conference', workspaceType: 'conference', price: 3000, x: 84.3, y: 43.7, rotation: 270, booked: false },
  { id: 'CONF-9', zone: 'Convertible 10 Seater Conference', workspaceType: 'conference', price: 3000, x: 72.2, y: 52.5, rotation: 90, booked: false },
  { id: 'CONF-10', zone: 'Convertible 10 Seater Conference', workspaceType: 'conference', price: 3000, x: 84.3, y: 52.5, rotation: 270, booked: false },

  // CEO cabin
  { id: 'CEO-1', zone: "CEO's Cabin", workspaceType: 'cabin', price: 2200, x: 22.6, y: 73.3, rotation: 0, booked: false },
  { id: 'CEO-2', zone: "CEO's Cabin", workspaceType: 'cabin', price: 2200, x: 30.1, y: 73.3, rotation: 0, booked: true },
  { id: 'CEO-3', zone: "CEO's Cabin", workspaceType: 'cabin', price: 2200, x: 29.7, y: 85.1, rotation: 180, booked: false },

  // Director cabin
  { id: 'DIR-1', zone: "Director's Cabin", workspaceType: 'cabin', price: 1800, x: 43.5, y: 73.3, rotation: 0, booked: false },
  { id: 'DIR-2', zone: "Director's Cabin", workspaceType: 'cabin', price: 1800, x: 50.6, y: 73.3, rotation: 0, booked: false },
  { id: 'DIR-3', zone: "Director's Cabin", workspaceType: 'cabin', price: 1800, x: 50.2, y: 84.9, rotation: 180, booked: false },

  // 2-seater meeting room
  { id: 'MR-1', zone: '2 Seater Meeting Room', workspaceType: 'meeting_room', price: 900, x: 65.4, y: 79, rotation: 330, booked: false },
  { id: 'MR-2', zone: '2 Seater Meeting Room', workspaceType: 'meeting_room', price: 900, x: 70.4, y: 72.8, rotation: 35, booked: false },
];

const SeatGlyph = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4" />
    <rect x="3" y="11" width="18" height="6" rx="1" />
    <path d="M6 17v2" />
    <path d="M18 17v2" />
  </svg>
);

const BookingPage = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedSeats, setSelectedSeats] = useState([]);

  const visibleSeats = useMemo(() => {
    if (activeFilter === 'all') {
      return FLOOR_PLAN_SEATS;
    }
    return FLOOR_PLAN_SEATS.filter((seat) => seat.workspaceType === activeFilter);
  }, [activeFilter]);

  const workspaceStats = useMemo(() => {
    const seatTotal = FLOOR_PLAN_SEATS.length;
    const availableSeats = FLOOR_PLAN_SEATS.filter((seat) => !seat.booked).length;

    return { seatTotal, availableSeats };
  }, []);

  const toggleSeat = (seat) => {
    setSelectedSeats((previous) => {
      const exists = previous.find((selected) => selected.id === seat.id);
      if (exists) {
        return previous.filter((selected) => selected.id !== seat.id);
      }
      return [...previous, seat];
    });
  };

  const removeSeat = (seatId) => {
    setSelectedSeats((previous) => previous.filter((seat) => seat.id !== seatId));
  };

  const isSeatSelected = (seatId) => selectedSeats.some((seat) => seat.id === seatId);

  const totalPrice = useMemo(() => selectedSeats.reduce((sum, seat) => sum + seat.price, 0), [selectedSeats]);

  const selectionBreakdown = useMemo(
    () =>
      selectedSeats.reduce((accumulator, seat) => {
        const key = seat.workspaceType;
        accumulator[key] = (accumulator[key] || 0) + 1;
        return accumulator;
      }, {}),
    [selectedSeats]
  );

  const handleProceed = () => {
    navigate('/payment', {
      state: {
        seats: selectedSeats,
        total: totalPrice,
        floor: '14th Floor - SkyDesk360 Baner Layout',
      },
    });
  };

  return (
    <div className="booking-page">
      <div className="booking-header">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          Blueprint <span>Booking</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          Full floor converted to code layout
        </motion.p>
      </div>

      <div className="workspace-filters">
        {WORKSPACE_FILTERS.map((filter) => (
          <button
            key={filter.id}
            className={`workspace-btn ${activeFilter === filter.id ? 'active' : ''}`}
            onClick={() => setActiveFilter(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="floor-meta">
        <span>
          <Users size={13} /> {workspaceStats.availableSeats} available / {workspaceStats.seatTotal} total
        </span>
        <span>
          <BriefcaseBusiness size={13} /> Code-drawn blueprint map
        </span>
        <span>
          <Building2 size={13} /> Workstation + Cabin + Meeting + Conference
        </span>
      </div>

      <div className="booking-container">
        <div className="floor-plan-wrapper">
          <div className="blueprint-shell">
            <div className="blueprint-toolbar">Click seats directly on the coded floor map</div>

            <div className="blueprint-canvas">
              <div className="plan-grid-overlay" />

              {FLOOR_BLOCKS.map((block) => (
                <div
                  key={block.id}
                  className={`plan-block ${block.kind}`}
                  style={{ left: `${block.x}%`, top: `${block.y}%`, width: `${block.w}%`, height: `${block.h}%` }}
                >
                  <span>{block.label}</span>
                </div>
              ))}

              <div className="plan-entrance">ENTRANCE</div>

              {visibleSeats.map((seat) => (
                <div key={seat.id} className="seat-pin-wrap" style={{ left: `${seat.x}%`, top: `${seat.y}%` }}>
                  <button
                    className={`seat-pin ${seat.workspaceType} ${seat.booked ? 'booked' : ''} ${isSeatSelected(seat.id) ? 'selected' : ''}`}
                    style={{ '--seat-rotation': `${seat.rotation ?? 0}deg` }}
                    onClick={() => !seat.booked && toggleSeat(seat)}
                    disabled={seat.booked}
                    title={seat.booked ? 'Already booked' : `${seat.id} - Rs ${seat.price}`}
                  >
                    <SeatGlyph />
                  </button>
                  <span className="seat-pin-label">{seat.id}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="legend blueprint-legend">
            <div className="legend-item">
              <div className="legend-dot available" />
              <span className="legend-label">Available</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot selected-legend" />
              <span className="legend-label">Selected</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot booked-legend" />
              <span className="legend-label">Booked</span>
            </div>
          </div>
        </div>

        <div className="booking-sidebar">
          <div className="summary-card">
            <h3 className="summary-title">Booking Summary</h3>

            {selectedSeats.length === 0 ? (
              <div className="empty-state">
                <Armchair className="empty-icon" />
                <p className="empty-text">Select seats directly on the coded blueprint map to continue.</p>
              </div>
            ) : (
              <>
                <div className="selected-seats-list">
                  <AnimatePresence>
                    {selectedSeats.map((seat) => (
                      <motion.div
                        key={seat.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="selected-seat-item"
                      >
                        <div className="seat-info">
                          <span className="seat-info-name">{seat.id}</span>
                          <span className="seat-info-zone">{seat.zone}</span>
                          <span className="seat-info-type">{WORKSPACE_LABELS[seat.workspaceType]}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span className="seat-info-price">Rs {seat.price.toLocaleString()}</span>
                          <button className="remove-seat-btn" onClick={() => removeSeat(seat.id)} title="Remove seat">
                            <X size={14} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="summary-divider" />

                <div className="selection-breakdown">
                  {Object.entries(selectionBreakdown).map(([type, count]) => (
                    <span key={type}>{WORKSPACE_LABELS[type]}: {count}</span>
                  ))}
                </div>

                <div className="summary-total">
                  <span className="total-label">Total</span>
                  <span className="total-amount">Rs {totalPrice.toLocaleString()}</span>
                </div>
              </>
            )}

            <button className="proceed-btn" disabled={selectedSeats.length === 0} onClick={handleProceed}>
              Proceed to Payment <ChevronRight size={16} style={{ display: 'inline', verticalAlign: 'middle' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
