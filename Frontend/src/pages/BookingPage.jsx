import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Armchair, X, ChevronRight, Users, Building2, BriefcaseBusiness, ZoomIn, ZoomOut, RotateCcw, Box, Layers, Move } from 'lucide-react';
import './BookingPage.css';
import { fetchSeats } from '../lib/api';
import {
  FloorPlanSVG, FLOOR_PLAN_SEATS, ZONE_COLORS,
  WHOLE_UNIT_TYPES, ZONE_PRIMARY_SEAT, ZONE_DISPLAY_LABEL,
  SEAT_PRICES, computeDurationPrice, formatPrice,
} from '../components/FloorPlan';

/* ─── BookingPage-only constants ─── */
const WORKSPACE_LABELS = {
  workstation: 'Workstation',
  cabin: 'Private Cabin',
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

  const enrichedSeats = useMemo(() => {
    // First pass: enrich individual seats
    const base = FLOOR_PLAN_SEATS.map((seat) => {
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
    });

    // Second pass: for whole-unit zones, propagate primary seat's availability
    // to every seat in that zone so they all show the same state.
    const zoneStatus = {};
    Object.entries(ZONE_PRIMARY_SEAT).forEach(([zone, primaryId]) => {
      const primary = base.find((s) => s.id === primaryId);
      if (primary) zoneStatus[zone] = { booked: primary.booked, locked: primary.locked, lockedUntil: primary.lockedUntil };
    });

    return base.map((seat) => {
      if (!WHOLE_UNIT_TYPES.has(seat.workspaceType)) return seat;
      const status = zoneStatus[seat.zone];
      if (!status) return seat;
      return { ...seat, booked: status.booked, locked: status.locked, lockedUntil: status.lockedUntil };
    });
  }, [backendSeatMap]);

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

  // Whole-unit types: clicking any seat selects the PRIMARY seat only.
  // One seat_id → backend → price charged once for the whole room/cabin.
  const toggleSeat = useCallback((seat) => {
    if (WHOLE_UNIT_TYPES.has(seat.workspaceType)) {
      const primaryId = ZONE_PRIMARY_SEAT[seat.zone];
      const primarySeat = enrichedSeats.find((s) => s.id === primaryId);
      if (!primarySeat || !primarySeat.dbId) return;
      setSelectedSeats((prev) => {
        const exists = prev.find((s) => s.id === primaryId);
        return exists
          ? prev.filter((s) => s.id !== primaryId)
          : [...prev, { ...primarySeat, _unitZone: seat.zone }];
      });
    } else {
      setSelectedSeats((prev) => {
        const exists = prev.find((s) => s.id === seat.id);
        return exists ? prev.filter((s) => s.id !== seat.id) : [...prev, seat];
      });
    }
  }, [enrichedSeats]);

  // A whole-unit seat appears "selected" when its zone's primary seat is selected.
  const isSeatSelected = useCallback((seatId) => {
    const seat = enrichedSeats.find((s) => s.id === seatId);
    if (seat && WHOLE_UNIT_TYPES.has(seat.workspaceType)) {
      const primaryId = ZONE_PRIMARY_SEAT[seat.zone];
      return selectedSeats.some((s) => s.id === primaryId);
    }
    return selectedSeats.some((s) => s.id === seatId);
  }, [selectedSeats, enrichedSeats]);

  const removeSeat = (seatId) => setSelectedSeats((prev) => prev.filter((s) => s.id !== seatId));

  // Cabins charge once per zone (not per individual seat).
  const totalPrice = useMemo(() => {
    return selectedSeats.reduce((sum, s) => sum + computeDurationPrice(s.workspaceType, durationUnit, durationQuantity), 0);
  }, [selectedSeats, durationUnit, durationQuantity]);

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
            Selected {selectedSeats.length} unit{selectedSeats.length !== 1 ? 's' : ''} of {workspaceStats.availableSeats} remaining
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
                    {selectedSeats.map((seat) => {
                      const isUnit = WHOLE_UNIT_TYPES.has(seat.workspaceType);
                      const displayName = isUnit
                        ? (ZONE_DISPLAY_LABEL[seat._unitZone || seat.zone] || seat.zone)
                        : seat.id;
                      const displayZone = isUnit ? 'Whole unit — booked exclusively' : seat.zone;
                      return (
                        <motion.div
                          key={seat.id}
                          initial={{ opacity: 0, x: -16 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 16 }}
                          className="bp-seat-row"
                        >
                          <div className="bp-seat-info">
                            <span className="bp-seat-name">{displayName}</span>
                            <span className="bp-seat-zone">{displayZone}</span>
                            <span className="bp-seat-type">{WORKSPACE_LABELS[seat.workspaceType]}</span>
                          </div>
                          <div className="bp-seat-actions">
                            <span className="bp-seat-price">₹{formatPrice(computeDurationPrice(seat.workspaceType, durationUnit, durationQuantity))}</span>
                            <button className="bp-remove-btn" onClick={() => removeSeat(seat.id)} title="Remove"><X size={13} /></button>
                          </div>
                        </motion.div>
                      );
                    })}
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
