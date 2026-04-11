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

/**
 * Draw a left→right gradient bar.
 * fromRgb / toRgb = [r, g, b]
 */
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
/**
 * @param {object} opts
 * @param {{ fullName?: string; full_name?: string; name?: string; email?: string }} opts.user
 * @param {Array<{ id: string; zone: string; workspaceType: string }>} opts.seats
 * @param {string}   opts.durationUnit      – 'hourly' | 'daily' | 'monthly' | 'yearly'
 * @param {number}   opts.durationQuantity  – multiplier (e.g. 3 months)
 * @param {string[]} opts.bookingIds        – backend booking IDs
 * @param {number}   opts.total             – total amount paid (INR)
 */
export function generateInvoice({ user, seats, durationUnit, durationQuantity, bookingIds, total }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const W = 210;
  const H = 297;
  const ML = 14;   // margin left
  const MR = 14;   // margin right
  const IW = W - ML - MR;

  const CYAN    = [0, 210, 230];
  const PURPLE  = [168, 85, 247];
  const WHITE   = [226, 232, 240];
  const GRAY1   = [100, 116, 139];
  const GRAY2   = [71, 85, 105];
  const GRAY3   = [30, 41, 59];
  const GREEN   = [34, 197, 94];
  const BG_CARD = [10, 18, 36];
  const BG_ROW0 = [5, 10, 22];
  const BG_ROW1 = [8, 16, 32];

  // ── Background ────────────────────────────────────────────────────────────
  doc.setFillColor(2, 2, 4);
  doc.rect(0, 0, W, H, 'F');

  // ── Top gradient accent bar ───────────────────────────────────────────────
  gradientRect(doc, 0, 0, W, 4, CYAN, PURPLE);

  // ── Logo ─────────────────────────────────────────────────────────────────
  let y = 20;
  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(22);

  doc.setTextColor(...WHITE);
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
  doc.setTextColor(...GRAY3);
  doc.text('PRO', ML + wSky + wDesk + w360 + 1.5, y - 5.5);

  // Tagline
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(...GRAY2);
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
  doc.setTextColor(...WHITE);
  doc.text('TAX INVOICE', W - MR, y - 2, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...GRAY1);
  doc.text(`Invoice No: ${invoiceNo}`, W - MR, y + 5, { align: 'right' });
  doc.text(`Date: ${dateStr}`, W - MR, y + 10, { align: 'right' });

  // ── Divider ───────────────────────────────────────────────────────────────
  y = 35;
  doc.setDrawColor(...GRAY3);
  doc.setLineWidth(0.3);
  doc.line(ML, y, W - MR, y);

  // ── FROM / BILL TO ────────────────────────────────────────────────────────
  y = 44;
  const col2X = W / 2 + 5;

  // FROM
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(...CYAN);
  doc.text('FROM', ML, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...WHITE);
  doc.text('SkyDesk360 Pro', ML, y + 6.5);

  const fromLines = [
    '14th Floor, Prestige Tech Park',
    'Bangalore, Karnataka — 560103',
    'support@skydesk360.com',
  ];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...GRAY1);
  fromLines.forEach((line, i) => doc.text(line, ML, y + 12.5 + i * 5.5));

  // BILL TO
  const memberName = user?.fullName || user?.full_name || user?.name || 'Member';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(...PURPLE);
  doc.text('BILL TO', col2X, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...WHITE);
  doc.text(memberName, col2X, y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...GRAY1);
  doc.text(user?.email || '', col2X, y + 12.5);
  doc.text('SkyDesk360 Member', col2X, y + 18);

  // ── Booking reference box ─────────────────────────────────────────────────
  y = 76;
  const boxW = 90;
  const boxH = 14;
  const boxX = (W - boxW) / 2;

  doc.setFillColor(...BG_CARD);
  doc.setDrawColor(0, 150, 180);
  doc.setLineWidth(0.4);
  doc.roundedRect(boxX, y, boxW, boxH, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(...GRAY2);
  doc.text('BOOKING REFERENCE', W / 2, y + 4.5, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setTextColor(...CYAN);
  doc.text(
    bookingIds?.length ? bookingIds.join('  ·  ') : invoiceNo,
    W / 2, y + 10.5, { align: 'center' }
  );

  // ── Section separator ─────────────────────────────────────────────────────
  y = 97;
  doc.setDrawColor(...GRAY3);
  doc.setLineWidth(0.3);
  doc.line(ML, y, W - MR, y);

  // ── Table ─────────────────────────────────────────────────────────────────
  y = 101;
  const rowH = 9.5;

  // Column left-edges
  const COL = {
    seat:      ML,
    zone:      ML + 34,
    type:      ML + 60,
    period:    ML + 105,
    unitPrice: ML + 140,
    amount:    W - MR,  // right-aligned
  };

  // Header background
  doc.setFillColor(12, 22, 44);
  doc.rect(ML, y, IW, rowH, 'F');
  // Cyan top-border for header
  doc.setFillColor(...CYAN);
  doc.rect(ML, y, IW, 0.6, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.8);
  doc.setTextColor(...GRAY2);
  const headers = [
    { label: 'SEAT ID',        x: COL.seat + 2,      align: 'left'  },
    { label: 'ZONE',           x: COL.zone + 2,      align: 'left'  },
    { label: 'WORKSPACE TYPE', x: COL.type + 2,      align: 'left'  },
    { label: 'BILLING PERIOD', x: COL.period + 2,    align: 'left'  },
    { label: 'UNIT PRICE',     x: COL.unitPrice + 2, align: 'left'  },
    { label: 'AMOUNT',         x: COL.amount - 2,    align: 'right' },
  ];
  headers.forEach(({ label, x, align }) =>
    doc.text(label, x, y + rowH - 3, { align })
  );

  y += rowH;

  // Data rows
  seats.forEach((seat, i) => {
    const rowY = y + i * rowH;

    doc.setFillColor(...(i % 2 === 0 ? BG_ROW0 : BG_ROW1));
    doc.rect(ML, rowY, IW, rowH, 'F');

    // Row separator
    doc.setDrawColor(18, 28, 50);
    doc.setLineWidth(0.2);
    doc.line(ML, rowY + rowH, W - MR, rowY + rowH);

    const wType    = seat.workspaceType || 'workstation';
    const rate1    = unitRate(wType, durationUnit);
    const seatAmt  = rate1 * durationQuantity;
    const period   = `${durationQuantity} x ${DURATION_LABELS[durationUnit] || 'Monthly'}`;
    const textY    = rowY + rowH - 3;

    // Seat ID — cyan + bold
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...CYAN);
    doc.text(seat.id || '—', COL.seat + 2, textY);

    // Other text columns
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...[WHITE[0] - 30, WHITE[1] - 30, WHITE[2] - 30]);  // slightly muted

    doc.text(seat.zone || '—',                  COL.zone + 2,      textY);
    doc.text(TYPE_LABELS[wType] || wType,        COL.type + 2,      textY);
    doc.text(period,                             COL.period + 2,    textY);
    doc.text(fmtPrice(rate1),                   COL.unitPrice + 2, textY);

    // Amount — white bold, right-aligned
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...WHITE);
    doc.text(fmtPrice(seatAmt), COL.amount - 2, textY, { align: 'right' });
  });

  y = y + seats.length * rowH + 10;

  // ── Totals ────────────────────────────────────────────────────────────────
  const totX = W / 2 + 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY1);
  doc.text('Subtotal', totX, y);
  doc.setTextColor(...WHITE);
  doc.text(fmtPrice(total), W - MR, y, { align: 'right' });

  y += 6.5;
  doc.setTextColor(...GRAY1);
  doc.text('GST & Applicable Taxes', totX, y);
  doc.text('Inclusive', W - MR, y, { align: 'right' });

  y += 5;
  doc.setDrawColor(...GRAY3);
  doc.setLineWidth(0.3);
  doc.line(totX, y, W - MR, y);

  y += 9;
  const tBoxH = 17;
  const tBoxW = W - MR - totX;

  // Total box with cyan border
  doc.setFillColor(...BG_CARD);
  doc.setDrawColor(...CYAN);
  doc.setLineWidth(0.6);
  doc.roundedRect(totX, y - 5, tBoxW, tBoxH, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(...GRAY2);
  doc.text('TOTAL AMOUNT PAID', totX + 4, y + 1);

  doc.setFontSize(13);
  doc.setTextColor(...CYAN);
  doc.text(fmtPrice(total), W - MR - 3, y + 8, { align: 'right' });

  y += tBoxH + 9;

  // ── Payment status badge ──────────────────────────────────────────────────
  const badgeW = 62;
  doc.setFillColor(5, 28, 15);
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.4);
  doc.roundedRect(ML, y - 4, badgeW, 11, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...GREEN);
  doc.text('PAYMENT SUCCESSFUL', ML + badgeW / 2, y + 2.8, { align: 'center' });

  y += 13;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...GRAY2);
  doc.text(`Paid via Razorpay   ·   ${dateStr}`, ML, y);
  doc.text(
    `${seats.length} seat${seats.length > 1 ? 's' : ''} booked   ·   ${DURATION_LABELS[durationUnit] || 'Monthly'} plan`,
    ML, y + 5.5
  );

  // ── Footer ───────────────────────────────────────────────────────────────
  const footerY = H - 22;
  gradientRect(doc, 0, footerY, W, 0.5, CYAN, PURPLE);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  doc.text('Thank you for choosing SkyDesk360 Pro!', W / 2, footerY + 6.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(...GRAY3);
  doc.text(
    'This is a computer-generated invoice and does not require a physical signature.',
    W / 2, footerY + 12, { align: 'center' }
  );
  doc.text(
    'For support: support@skydesk360.com  |  skydesk360.com',
    W / 2, footerY + 17, { align: 'center' }
  );

  // ── Save ─────────────────────────────────────────────────────────────────
  doc.save(`SkyDesk360_Invoice_${invoiceNo}.pdf`);
}
