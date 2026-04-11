import jsPDF from 'jspdf';

// ── Constants (kept in sync with PaymentPage) ──────────────────────────────
const DURATION_LABELS = {
  hourly: 'Hourly',
  daily: 'Daily',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

const TYPE_LABELS = {
  workstation: 'Open Workstation',
  cabin: 'Private Cabin',
  conference: 'Conference Room',
  meeting_room: 'Meeting Room',
};

const SEAT_PRICES = {
  workstation:  { hourly: 100,  daily: 400,   monthly: 7000  },
  cabin:        { hourly: 400,  daily: 2500,  monthly: 35000 },
  conference:   { hourly: 550,  daily: 4500,  monthly: 60000 },
  meeting_room: { hourly: 550,  daily: 4500,  monthly: 60000 },
};

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtPrice(v) {
  return 'Rs. ' + Math.round(v).toLocaleString('en-IN');
}

function unitRate(workspaceType, durationUnit) {
  const p = SEAT_PRICES[workspaceType] || SEAT_PRICES.workstation;
  if (durationUnit === 'hourly')  return p.hourly;
  if (durationUnit === 'daily')   return p.daily;
  if (durationUnit === 'yearly')  return p.monthly * 12 * 0.9;
  return p.monthly;
}

/** Draw a left→right gradient bar. fromRgb / toRgb = [r, g, b] */
function gradientRect(doc, x, y, w, h, fromRgb, toRgb) {
  for (let i = 0; i <= w; i++) {
    const t = i / w;
    doc.setFillColor(
      Math.round(fromRgb[0] + (toRgb[0] - fromRgb[0]) * t),
      Math.round(fromRgb[1] + (toRgb[1] - fromRgb[1]) * t),
      Math.round(fromRgb[2] + (toRgb[2] - fromRgb[2]) * t),
    );
    doc.rect(x + i, y, 1.5, h, 'F');
  }
}

// ── Main export ────────────────────────────────────────────────────────────
export function generateInvoice({ user, seats, durationUnit, durationQuantity, bookingIds, total }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const W  = 210;
  const H  = 297;
  const ML = 14;
  const MR = 14;
  const IW = W - ML - MR;

  // ── Light-mode colour palette ─────────────────────────────────────────────
  const CYAN        = [0,  190, 215];   // slightly deepened for readability on white
  const PURPLE      = [140, 60, 220];   // slightly deepened purple
  const HEADING     = [15,  23,  42];   // near-black navy  — primary text
  const BODY        = [51,  65,  85];   // dark slate       — secondary text
  const MUTED       = [100, 116, 139];  // medium gray      — labels / meta
  const SUBTLE      = [148, 163, 184];  // light gray       — hints / PRO badge
  const DIVIDER     = [226, 232, 240];  // very light gray  — rules / row borders
  const GREEN       = [22,  163,  74];  // slightly darker green for white bg
  const BG_PAGE     = [255, 255, 255];  // white
  const BG_HEADER   = [241, 248, 252];  // pale cyan-gray   — table header row
  const BG_ROW_ALT  = [248, 250, 253];  // off-white        — alternating rows
  const BG_REF_BOX  = [236, 252, 255];  // pale cyan        — booking reference box
  const BG_TOT_BOX  = [236, 252, 255];  // pale cyan        — total box
  const BG_BADGE    = [240, 253, 244];  // pale green       — status badge

  // ── White background ──────────────────────────────────────────────────────
  doc.setFillColor(...BG_PAGE);
  doc.rect(0, 0, W, H, 'F');

  // ── Top gradient accent bar (cyan → purple) ───────────────────────────────
  gradientRect(doc, 0, 0, W, 5, CYAN, PURPLE);

  // ── Logo ─────────────────────────────────────────────────────────────────
  let y = 21;
  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(22);

  // "SKY" in dark heading colour (visible on white)
  doc.setTextColor(...HEADING);
  doc.text('SKY', ML, y);
  const wSky = doc.getTextWidth('SKY');

  doc.setTextColor(...CYAN);
  doc.text('DESK', ML + wSky, y);
  const wDesk = doc.getTextWidth('DESK');

  doc.setTextColor(...PURPLE);
  doc.text('360', ML + wSky + wDesk, y);
  const w360 = doc.getTextWidth('360');

  // PRO superscript
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5);
  doc.setTextColor(...SUBTLE);
  doc.text('PRO', ML + wSky + wDesk + w360 + 1.5, y - 5.5);

  // Tagline
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(...MUTED);
  doc.text('PREMIUM COWORKING SPACE  ·  14TH FLOOR  ·  BANGALORE', ML, y + 5.5);

  // ── TAX INVOICE (right-aligned) ───────────────────────────────────────────
  const now       = new Date();
  const dateStr   = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const idPart    = bookingIds?.[0]
    ? bookingIds[0].replace('SKY-', '')
    : Math.random().toString(36).slice(2, 8).toUpperCase();
  const invoiceNo = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${idPart}`;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...HEADING);
  doc.text('TAX INVOICE', W - MR, y - 2, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text(`Invoice No: ${invoiceNo}`, W - MR, y + 5,  { align: 'right' });
  doc.text(`Date: ${dateStr}`,         W - MR, y + 10, { align: 'right' });

  // ── Divider ───────────────────────────────────────────────────────────────
  y = 36;
  doc.setDrawColor(...DIVIDER);
  doc.setLineWidth(0.4);
  doc.line(ML, y, W - MR, y);

  // ── FROM / BILL TO ────────────────────────────────────────────────────────
  y = 44;
  const col2X = W / 2 + 5;

  // FROM label
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(...CYAN);
  doc.text('FROM', ML, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...HEADING);
  doc.text('SkyDesk360 Pro', ML, y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  ['14th Floor, Prestige Tech Park', 'Bangalore, Karnataka — 560103', 'support@skydesk360.com']
    .forEach((line, i) => doc.text(line, ML, y + 12.5 + i * 5.5));

  // BILL TO label
  const memberName = user?.fullName || user?.full_name || user?.name || 'Member';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(...PURPLE);
  doc.text('BILL TO', col2X, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...HEADING);
  doc.text(memberName, col2X, y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text(user?.email || '',     col2X, y + 12.5);
  doc.text('SkyDesk360 Member',   col2X, y + 18);

  // ── Booking reference box ─────────────────────────────────────────────────
  y = 76;
  const boxW = 90, boxH = 14, boxX = (W - boxW) / 2;

  doc.setFillColor(...BG_REF_BOX);
  doc.setDrawColor(...CYAN);
  doc.setLineWidth(0.5);
  doc.roundedRect(boxX, y, boxW, boxH, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(...MUTED);
  doc.text('BOOKING REFERENCE', W / 2, y + 4.5, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setTextColor(...CYAN);
  doc.text(
    bookingIds?.length ? bookingIds.join('  ·  ') : invoiceNo,
    W / 2, y + 10.5, { align: 'center' }
  );

  // ── Section separator ─────────────────────────────────────────────────────
  y = 97;
  doc.setDrawColor(...DIVIDER);
  doc.setLineWidth(0.4);
  doc.line(ML, y, W - MR, y);

  // ── Table ─────────────────────────────────────────────────────────────────
  y = 101;
  const rowH = 9.5;

  const COL = {
    seat:      ML,
    zone:      ML + 34,
    type:      ML + 60,
    period:    ML + 110,
    unitPrice: ML + 142,
    amount:    W - MR,
  };

  // Header row
  doc.setFillColor(...BG_HEADER);
  doc.rect(ML, y, IW, rowH, 'F');

  // Cyan accent bar on top of header
  gradientRect(doc, ML, y, IW, 0.7, CYAN, PURPLE);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.8);
  doc.setTextColor(...BODY);
  [
    { label: 'SEAT ID',        x: COL.seat + 2,      align: 'left'  },
    { label: 'ZONE',           x: COL.zone + 2,      align: 'left'  },
    { label: 'WORKSPACE TYPE', x: COL.type + 2,      align: 'left'  },
    { label: 'BILLING PERIOD', x: COL.period + 2,    align: 'left'  },
    { label: 'UNIT PRICE',     x: COL.unitPrice + 2, align: 'left'  },
    { label: 'AMOUNT',         x: COL.amount - 2,    align: 'right' },
  ].forEach(({ label, x, align }) => doc.text(label, x, y + rowH - 3, { align }));

  y += rowH;

  // Data rows
  seats.forEach((seat, i) => {
    const rowY  = y + i * rowH;
    const textY = rowY + rowH - 3;

    // Alternating row background
    if (i % 2 !== 0) {
      doc.setFillColor(...BG_ROW_ALT);
      doc.rect(ML, rowY, IW, rowH, 'F');
    }

    // Row bottom separator
    doc.setDrawColor(...DIVIDER);
    doc.setLineWidth(0.2);
    doc.line(ML, rowY + rowH, W - MR, rowY + rowH);

    const wType   = seat.workspaceType || 'workstation';
    const rate1   = unitRate(wType, durationUnit);
    const seatAmt = rate1 * durationQuantity;
    const period  = `${durationQuantity} x ${DURATION_LABELS[durationUnit] || 'Monthly'}`;

    // Seat ID — cyan + bold
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...CYAN);
    doc.text(seat.id || '—', COL.seat + 2, textY);

    // Rest of columns — dark body text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...BODY);
    doc.text(seat.zone || '—',               COL.zone + 2,      textY);
    doc.text(TYPE_LABELS[wType] || wType,     COL.type + 2,      textY);
    doc.text(period,                          COL.period + 2,    textY);
    doc.text(fmtPrice(rate1),                 COL.unitPrice + 2, textY);

    // Amount — heading colour, bold, right-aligned
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...HEADING);
    doc.text(fmtPrice(seatAmt), COL.amount - 2, textY, { align: 'right' });
  });

  y = y + seats.length * rowH + 10;

  // ── Totals ────────────────────────────────────────────────────────────────
  const totX = W / 2 + 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text('Subtotal', totX, y);
  doc.setTextColor(...HEADING);
  doc.text(fmtPrice(total), W - MR, y, { align: 'right' });

  y += 6.5;
  doc.setTextColor(...MUTED);
  doc.text('GST & Applicable Taxes', totX, y);
  doc.text('Inclusive', W - MR, y, { align: 'right' });

  y += 5;
  doc.setDrawColor(...DIVIDER);
  doc.setLineWidth(0.4);
  doc.line(totX, y, W - MR, y);

  y += 9;
  const tBoxH = 17;
  const tBoxW = W - MR - totX;

  // Total box — pale cyan fill with cyan border
  doc.setFillColor(...BG_TOT_BOX);
  doc.setDrawColor(...CYAN);
  doc.setLineWidth(0.7);
  doc.roundedRect(totX, y - 5, tBoxW, tBoxH, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(...MUTED);
  doc.text('TOTAL AMOUNT PAID', totX + 4, y + 1);

  doc.setFontSize(13);
  doc.setTextColor(...CYAN);
  doc.text(fmtPrice(total), W - MR - 3, y + 8, { align: 'right' });

  y += tBoxH + 9;

  // ── Payment status badge ──────────────────────────────────────────────────
  const badgeW = 62;
  doc.setFillColor(...BG_BADGE);
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.5);
  doc.roundedRect(ML, y - 4, badgeW, 11, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...GREEN);
  doc.text('PAYMENT SUCCESSFUL', ML + badgeW / 2, y + 2.8, { align: 'center' });

  y += 13;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text(`Paid via Razorpay   ·   ${dateStr}`, ML, y);
  doc.text(
    `${seats.length} seat${seats.length > 1 ? 's' : ''} booked   ·   ${DURATION_LABELS[durationUnit] || 'Monthly'} plan`,
    ML, y + 5.5
  );

  // ── Footer ───────────────────────────────────────────────────────────────
  const footerY = H - 22;

  // Light gray separator
  doc.setDrawColor(...DIVIDER);
  doc.setLineWidth(0.4);
  doc.line(ML, footerY, W - MR, footerY);

  // Thin gradient accent line below divider
  gradientRect(doc, 0, footerY + 1, W, 0.6, CYAN, PURPLE);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...HEADING);
  doc.text('Thank you for choosing SkyDesk360 Pro!', W / 2, footerY + 7, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(...MUTED);
  doc.text(
    'This is a computer-generated invoice and does not require a physical signature.',
    W / 2, footerY + 12.5, { align: 'center' }
  );
  doc.text(
    'For support: support@skydesk360.com  |  skydesk360.com',
    W / 2, footerY + 17.5, { align: 'center' }
  );

  // ── Save ─────────────────────────────────────────────────────────────────
  doc.save(`SkyDesk360_Invoice_${invoiceNo}.pdf`);
}
