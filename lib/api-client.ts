const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// ─── Token management ────────────────────────────────────────────────────────

export const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('host_token');
  }
  return null;
};

export const setAuthToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('host_token', token);
  }
};

export const getRefreshToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('host_refresh_token');
  }
  return null;
};

export const setRefreshToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('host_refresh_token', token);
  }
};

export const clearTokens = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('host_token');
    localStorage.removeItem('host_refresh_token');
  }
};

// ─── Fetch wrapper ───────────────────────────────────────────────────────────

async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  if (response.status === 401) {
    // Try refreshing the token once
    const rt = getRefreshToken();
    if (rt && !endpoint.includes('/auth/')) {
      try {
        const refreshRes = await fetch(`${API_URL}/auth/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: rt }),
        });
        const refreshData = await refreshRes.json();
        if (refreshData.success) {
          setAuthToken(refreshData.data.accessToken);
          setRefreshToken(refreshData.data.refreshToken);
          // Retry original request with new token
          headers['Authorization'] = `Bearer ${refreshData.data.accessToken}`;
          const retryRes = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
          const retryJson = await retryRes.json();
          if (!retryJson.success) throw new Error(retryJson.message || 'Request failed');
          if (!retryJson.data) {
            const { success, message, ...rest } = retryJson;
            retryJson.data = rest;
          }
          return retryJson;
        }
      } catch {
        // Refresh failed — fall through to throw
      }
    }
    clearTokens();
    throw new Error('Unauthorized');
  }

  const json = await response.json();

  if (!json.success) {
    throw new Error(json.message || json.error || 'Request failed');
  }

  // Normalize: some endpoints spread fields at root (e.g. { success, listings, pagination })
  // instead of wrapping in { data }. Ensure res.data always works.
  if (!json.data) {
    const { success, message, ...rest } = json;
    json.data = rest;
  }

  return json;
}

async function apiUpload(endpoint: string, formData: FormData) {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (response.status === 401) {
    clearTokens();
    throw new Error('Unauthorized');
  }

  const json = await response.json();
  if (!json.success) throw new Error(json.message || 'Upload failed');
  if (!json.data) {
    const { success, message, ...rest } = json;
    json.data = rest;
  }
  return json;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export const auth = {
  sendOtp: (phone: string) =>
    apiCall('/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone }) }),

  verifyOtp: (phone: string, otp: string) =>
    apiCall('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone, otp }) }),

  refreshToken: (refreshToken: string) =>
    apiCall('/auth/refresh-token', { method: 'POST', body: JSON.stringify({ refreshToken }) }),

  logout: (refreshToken: string) =>
    apiCall('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }),

  getCurrentUser: () => apiCall('/users/me'),
};

// ─── Host Dashboard ──────────────────────────────────────────────────────────

export const hostDashboard = {
  getOverview: () => apiCall('/host/overview'),

  getEarnings: (params?: { from?: string; to?: string; listingId?: string }) => {
    const q = new URLSearchParams();
    if (params?.from) q.set('from', params.from);
    if (params?.to) q.set('to', params.to);
    if (params?.listingId) q.set('listingId', params.listingId);
    return apiCall(`/host/earnings?${q.toString()}`);
  },

  getAnalytics: (params?: { listingId?: string }) => {
    const q = new URLSearchParams();
    if (params?.listingId) q.set('listingId', params.listingId);
    return apiCall(`/host/analytics?${q.toString()}`);
  },
};

// ─── Listings ────────────────────────────────────────────────────────────────

export const listings = {
  getAll: (params?: { status?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return apiCall(`/listings?${q.toString()}`);
  },

  getById: (id: string) => apiCall(`/listings/${id}`),

  create: (payload: Record<string, unknown>) =>
    apiCall('/listings', { method: 'POST', body: JSON.stringify(payload) }),

  update: (id: string, payload: Record<string, unknown>) =>
    apiCall(`/listings/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  updateStatus: (id: string, status: 'PUBLISHED' | 'UNLISTED') =>
    apiCall(`/listings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  delete: (id: string) =>
    apiCall(`/listings/${id}`, { method: 'DELETE' }),

  getAmenities: () => apiCall('/listings/amenities'),

  // House rules
  addHouseRules: (id: string, rules: { ruleText: string }[]) =>
    apiCall(`/listings/${id}/house-rules`, { method: 'POST', body: JSON.stringify({ rules }) }),

  deleteHouseRule: (listingId: string, ruleId: string) =>
    apiCall(`/listings/${listingId}/house-rules/${ruleId}`, { method: 'DELETE' }),

  // Availability
  getAvailability: (id: string, from: string, to: string) => {
    const q = new URLSearchParams({ from, to });
    return apiCall(`/listings/${id}/availability?${q.toString()}`);
  },

  setAvailability: (id: string, dates: { date: string; isAvailable: boolean; customPrice?: number }[]) =>
    apiCall(`/listings/${id}/availability`, { method: 'PUT', body: JSON.stringify({ dates }) }),

  // Images
  addImage: (id: string, file: File, isCover?: boolean) => {
    const formData = new FormData();
    formData.append('image', file);
    if (isCover) formData.append('isCover', 'true');
    return apiUpload(`/listings/${id}/images`, formData);
  },

  deleteImage: (listingId: string, imageId: string) =>
    apiCall(`/listings/${listingId}/images/${imageId}`, { method: 'DELETE' }),

  setCoverImage: (listingId: string, imageId: string) =>
    apiCall(`/listings/${listingId}/images/${imageId}/cover`, { method: 'PATCH' }),
};

// ─── Bookings ────────────────────────────────────────────────────────────────

export const bookings = {
  getAll: (params?: { status?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams({ role: 'host' });
    if (params?.status) q.set('status', params.status);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return apiCall(`/bookings?${q.toString()}`);
  },

  getById: (id: string) => apiCall(`/bookings/${id}`),

  accept: (id: string) =>
    apiCall(`/bookings/${id}/accept`, { method: 'PATCH' }),

  decline: (id: string, reason: string) =>
    apiCall(`/bookings/${id}/decline`, { method: 'PATCH', body: JSON.stringify({ reason }) }),

  cancel: (id: string, reason: string) =>
    apiCall(`/bookings/${id}/cancel`, { method: 'PATCH', body: JSON.stringify({ reason }) }),

  checkIn: (id: string) =>
    apiCall(`/bookings/${id}/check-in`, { method: 'POST' }),

  checkOut: (id: string) =>
    apiCall(`/bookings/${id}/check-out`, { method: 'POST' }),
};

// ─── Reviews ─────────────────────────────────────────────────────────────────

export const reviews = {
  getByListing: (listingId: string, params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return apiCall(`/reviews/listing/${listingId}?${q.toString()}`);
  },

  respond: (reviewId: string, response: string) =>
    apiCall(`/reviews/${reviewId}/response`, { method: 'POST', body: JSON.stringify({ response }) }),
};

// ─── Messages ────────────────────────────────────────────────────────────────

export const conversations = {
  getAll: (params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return apiCall(`/conversations?${q.toString()}`);
  },

  getMessages: (id: string, params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return apiCall(`/conversations/${id}/messages?${q.toString()}`);
  },

  sendMessage: (id: string, content: string) =>
    apiCall(`/conversations/${id}/messages`, { method: 'POST', body: JSON.stringify({ content }) }),

  archive: (id: string) =>
    apiCall(`/conversations/${id}/archive`, { method: 'PATCH' }),

  markRead: (messageId: string) =>
    apiCall(`/messages/${messageId}/read`, { method: 'PATCH' }),
};

// ─── Notifications ───────────────────────────────────────────────────────────

export const notifications = {
  getAll: (params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return apiCall(`/notifications?${q.toString()}`);
  },

  getUnreadCount: () => apiCall('/notifications/unread-count'),

  markRead: (id: string) =>
    apiCall(`/notifications/${id}/read`, { method: 'PATCH' }),

  markAllRead: () =>
    apiCall('/notifications/read-all', { method: 'PATCH' }),
};

// ─── User Profile ────────────────────────────────────────────────────────────

export const profile = {
  get: () => apiCall('/users/me'),

  update: (payload: { firstName?: string; lastName?: string; email?: string; bio?: string; dateOfBirth?: string; gender?: string }) =>
    apiCall('/users/me', { method: 'PUT', body: JSON.stringify(payload) }),

  updateAvatar: (avatarUrl: string) =>
    apiCall('/users/me/avatar', { method: 'PUT', body: JSON.stringify({ avatarUrl }) }),
};
