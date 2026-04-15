const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

/**
 * Ping the backend health endpoint.
 * Render free-tier services sleep after inactivity; the first request returns 502.
 * This retries up to `maxAttempts` times with a delay, returning true when alive.
 */
export const wakeBackend = async (maxAttempts = 8, delayMs = 4000) => {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`${API_BASE_URL}/`, { signal: AbortSignal.timeout(8000) });
      if (res.ok) return true;
    } catch {
      // network error or timeout — server still waking up
    }
    if (i < maxAttempts - 1) await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
};

const parseError = async (response) => {
  try {
    const data = await response.json();
    if (typeof data?.detail === 'string') {
      return data.detail;
    }
    if (Array.isArray(data?.detail) && data.detail.length > 0) {
      const first = data.detail[0];
      const path = Array.isArray(first?.loc) ? first.loc.join('.') : 'request';
      const message = first?.msg || 'Validation failed';
      return `${path}: ${message}`;
    }
  } catch {
    // Ignore JSON parsing errors and use fallback below.
  }
  return `Request failed with status ${response.status}`;
};

export const registerUser = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json();
};

export const loginUser = async (email, password) => {
  const body = new URLSearchParams({
    username: email,
    password,
  });

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json();
};

export const setAuthSession = ({ token, user }) => {
  sessionStorage.setItem('token', token);
  sessionStorage.setItem('user', JSON.stringify(user));
};

export const clearAuthSession = () => {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
};

/* ─── Admin API ─── */
const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${sessionStorage.getItem('token')}`,
});

export const fetchAdminStats = async () => {
  const res = await fetch(`${API_BASE_URL}/admin/stats`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
};

export const fetchAdminUsers = async () => {
  const res = await fetch(`${API_BASE_URL}/admin/users`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
};

export const fetchAdminBookings = async () => {
  const res = await fetch(`${API_BASE_URL}/admin/bookings`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
};

export const fetchAdminSeats = async () => {
  const res = await fetch(`${API_BASE_URL}/admin/seats`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
};

export const createAdminSeat = async (payload) => {
  const res = await fetch(`${API_BASE_URL}/admin/seats`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
};

export const updateAdminSeat = async (seatId, payload) => {
  const res = await fetch(`${API_BASE_URL}/admin/seats/${seatId}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
};

export const resetSeatAvailability = async () => {
  const res = await fetch(`${API_BASE_URL}/admin/seats/reset-availability`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
};

export const initializeSeats = async () => {
  const res = await fetch(`${API_BASE_URL}/seats/initialize-office`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
};

/* --- Seats & Payments --- */
export const fetchSeats = async () => {
  const res = await fetch(`${API_BASE_URL}/seats`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
};

export const createPaymentOrderBatch = async (payload) => {
  const res = await fetch(`${API_BASE_URL}/payment/create-order-batch`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
};

/* --- Admin KYC --- */
export const fetchAdminKYC = async () => {
  const res = await fetch(`${API_BASE_URL}/admin/kyc`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
};

export const fetchKYCDocument = async (userId) => {
  const res = await fetch(`${API_BASE_URL}/admin/kyc/${userId}/document`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
};

export const verifyPayment = async (payload) => {
  const res = await fetch(`${API_BASE_URL}/payment/verify`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
};
