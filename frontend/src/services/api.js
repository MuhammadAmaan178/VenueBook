// src/services/api.js
export const API_BASE_URL = 'https://huggingface.co/spaces/Amaan909/Venue_Finder';

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));

    // Provide more specific error messages based on status code
    if (response.status === 401) {
      throw new Error(error.error || error.message || 'Invalid email or password. Please check your credentials and try again.');
    } else if (response.status === 400) {
      throw new Error(error.error || error.message || 'Invalid request. Please check your input.');
    } else if (response.status === 404) {
      throw new Error(error.error || error.message || 'Resource not found.');
    } else if (response.status === 500) {
      throw new Error(error.error || error.message || 'Server error. Please try again later.');
    }

    throw new Error(error.error || error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Helper function to convert local filters to API filters
const convertToAPIFilters = (filters) => {
  const apiFilters = {};

  if (filters.search) {
    apiFilters.search = filters.search;
  }

  if (filters.city && filters.city !== "All Cities") {
    apiFilters.city = filters.city;
  }

  if (filters.type && filters.type !== "All Types") {
    apiFilters.type = filters.type;
  }

  if (filters.capacity && filters.capacity !== "All Capacity") {
    // Convert capacity string to min/max
    const capacityRange = filters.capacity.split('-');
    if (capacityRange.length === 2) {
      apiFilters.capacity_min = capacityRange[0];
      apiFilters.capacity_max = capacityRange[1];
    } else if (filters.capacity.endsWith('+')) {
      apiFilters.capacity_min = filters.capacity.replace('+', '');
    }
  }

  if (filters.range && filters.range !== "All Range") {
    switch (filters.range) {
      case "Under 50,000":
        apiFilters.price_max = "50000";
        break;
      case "50,000 - 100,000":
        apiFilters.price_min = "50000";
        apiFilters.price_max = "100000";
        break;
      case "100,000 - 200,000":
        apiFilters.price_min = "100000";
        apiFilters.price_max = "200000";
        break;
      case "200,000+":
        apiFilters.price_min = "200000";
        break;
    }
  }

  if (filters.sort_by) {
    apiFilters.sort_by = filters.sort_by;
    apiFilters.sort_order = filters.sort_order || 'desc';
  }

  return apiFilters;
};

export const authAPI = {
  signup: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return handleResponse(response);
  },

  logout: async (token) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },
};

export const venueService = {
  getVenues: async (filters = {}) => {
    try {
      // Convert local filter names to API parameter names
      const apiFilters = convertToAPIFilters(filters);
      const queryParams = new URLSearchParams(apiFilters).toString();
      const url = `${API_BASE_URL}/api/venues${queryParams ? `?${queryParams}` : ''}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching venues:', error);
      throw error;
    }
  },

  getVenueDetails: async (venueId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/venues/${venueId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching venue details:', error);
      throw error;
    }
  },

  getBookingData: async (venueId, eventDate) => {
    const queryParams = new URLSearchParams({ event_date: eventDate }).toString();
    const response = await fetch(`${API_BASE_URL}/api/venues/${venueId}/booking-data?${queryParams}`);
    return handleResponse(response);
  },

  getFilters: async () => {
    const response = await fetch(`${API_BASE_URL}/api/venues/filters`);
    return handleResponse(response);
  },
  submitReview: async (venueId, reviewData, token) => {
    const response = await fetch(`${API_BASE_URL}/api/venues/${venueId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(reviewData),
    });
    return handleResponse(response);
  },
};

export const bookingService = {
  createBooking: async (bookingData, token) => {
    const response = await fetch(`${API_BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(bookingData),
    });
    return handleResponse(response);
  },
};

export const userService = {
  getProfile: async (userId, token) => {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/profile`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  updateProfile: async (userId, profileData, token) => {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });
    return handleResponse(response);
  },

  getUserBookings: async (userId, filters = {}, token) => {
    const queryParams = new URLSearchParams(filters).toString();
    const url = `${API_BASE_URL}/api/users/${userId}/bookings${queryParams ? `?${queryParams}` : ''}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  getBookingDetails: async (userId, bookingId, token) => {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/bookings/${bookingId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },
};

// Owner Panel Services
export const ownerService = {
  getDashboard: async (ownerId, token) => {
    const response = await fetch(`${API_BASE_URL}/api/owner/${ownerId}/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  getAnalytics: async (ownerId, token, year = null) => {
    const url = year
      ? `${API_BASE_URL}/api/owner/${ownerId}/analytics?year=${year}`
      : `${API_BASE_URL}/api/owner/${ownerId}/analytics`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  getVenues: async (ownerId, filters = {}, token) => {
    const queryParams = new URLSearchParams(filters).toString();
    const url = `${API_BASE_URL}/api/owner/${ownerId}/venues${queryParams ? `?${queryParams}` : ''}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  addVenue: async (ownerId, venueData, token) => {
    const response = await fetch(`${API_BASE_URL}/api/owner/${ownerId}/venues`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(venueData),
    });
    return handleResponse(response);
  },

  updateVenue: async (ownerId, venueId, venueData, token) => {
    const response = await fetch(`${API_BASE_URL}/api/owner/${ownerId}/venues/${venueId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(venueData),
    });
    return handleResponse(response);
  },

  deleteVenue: async (ownerId, venueId, token) => {
    const response = await fetch(`${API_BASE_URL}/api/owner/${ownerId}/venues/${venueId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  getVenueDetails: async (ownerId, venueId, token) => {
    const response = await fetch(`${API_BASE_URL}/api/owner/${ownerId}/venues/${venueId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  getBookingDetails: async (ownerId, bookingId, token) => {
    const response = await fetch(`${API_BASE_URL}/api/owner/${ownerId}/bookings/${bookingId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  updateBookingStatus: async (ownerId, bookingId, statusData, token) => {
    const response = await fetch(`${API_BASE_URL}/api/owner/${ownerId}/bookings/${bookingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(statusData),
    });
    return handleResponse(response);
  },

  getBookings: async (ownerId, filters = {}, token) => {
    const queryParams = new URLSearchParams(filters).toString();
    const url = `${API_BASE_URL}/api/owner/${ownerId}/bookings${queryParams ? `?${queryParams}` : ''}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  getPayments: async (ownerId, filters = {}, token) => {
    const queryParams = new URLSearchParams(filters).toString();
    const url = `${API_BASE_URL}/api/owner/${ownerId}/payments${queryParams ? `?${queryParams}` : ''}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  getPaymentDetails: async (ownerId, paymentId, token) => {
    const response = await fetch(`${API_BASE_URL}/api/owner/${ownerId}/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  getReviews: async (ownerId, filters = {}, token) => {
    const queryParams = new URLSearchParams(filters).toString();
    const url = `${API_BASE_URL}/api/owner/${ownerId}/reviews${queryParams ? `?${queryParams}` : ''}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  updatePaymentStatus: async (ownerId, paymentId, status, token) => {
    const response = await fetch(`${API_BASE_URL}/api/owner/${ownerId}/payments/${paymentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ payment_status: status }),
    });
    return handleResponse(response);
  },
};

// Admin Panel Services
export const adminService = {
  getDashboard: async (token) => {
    const response = await fetch(`${API_BASE_URL}/api/admin/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  getUsers: async (filters = {}, token) => {
    const queryParams = new URLSearchParams(filters).toString();
    const url = `${API_BASE_URL}/api/admin/users${queryParams ? `?${queryParams}` : ''}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  getOwners: async (filters = {}, token) => {
    const queryParams = new URLSearchParams(filters).toString();
    const url = `${API_BASE_URL}/api/admin/owners${queryParams ? `?${queryParams}` : ''}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  getOwnerDetails: async (ownerId, token) => {
    const response = await fetch(`${API_BASE_URL}/api/admin/owners/${ownerId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  getVenues: async (filters = {}, token) => {
    const queryParams = new URLSearchParams(filters).toString();
    const url = `${API_BASE_URL}/api/admin/venues${queryParams ? `?${queryParams}` : ''}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  getVenueDetails: async (venueId, token) => {
    const response = await fetch(`${API_BASE_URL}/api/admin/venues/${venueId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  getUserDetails: async (userId, token) => {
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  getBookings: async (filters = {}, token) => {
    const queryParams = new URLSearchParams(filters).toString();
    const url = `${API_BASE_URL}/api/admin/bookings${queryParams ? `?${queryParams}` : ''}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  getBookingDetails: async (bookingId, token) => {
    const response = await fetch(`${API_BASE_URL}/api/admin/bookings/${bookingId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  getPayments: async (filters = {}, token) => {
    const queryParams = new URLSearchParams(filters).toString();
    const url = `${API_BASE_URL}/api/admin/payments${queryParams ? `?${queryParams}` : ''}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  getPaymentDetails: async (paymentId, token) => {
    const response = await fetch(`${API_BASE_URL}/api/admin/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  getReviews: async (filters = {}, token) => {
    const queryParams = new URLSearchParams(filters).toString();
    const url = `${API_BASE_URL}/api/admin/reviews${queryParams ? `?${queryParams}` : ''}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  getAnalytics: async (filters = {}, token) => {
    const queryParams = new URLSearchParams(filters).toString();
    const url = `${API_BASE_URL}/api/admin/analytics${queryParams ? `?${queryParams}` : ''}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  getLogs: async (filters = {}, token) => {
    const queryParams = new URLSearchParams(filters).toString();
    const url = `${API_BASE_URL}/api/admin/logs${queryParams ? `?${queryParams}` : ''}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  approveVenue: async (venueId, token) => {
    const response = await fetch(`${API_BASE_URL}/api/admin/venues/${venueId}/approve`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  updateVenueStatus: async (venueId, status, token) => {
    const response = await fetch(`${API_BASE_URL}/api/admin/venues/${venueId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    return handleResponse(response);
  },
};

export const notificationService = {
  getAll: async (userId, token) => {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/notifications`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  markAsRead: async (notificationId, token) => {
    const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  markAllAsRead: async (userId, token) => {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/notifications/read-all`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return handleResponse(response);
  },
};

// Default export for generic API calls
const api = {
  get: async (endpoint) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    return handleResponse(response);
  },
};

export default api;
