import axios from 'axios';

// Get baseline URL
const getBackendUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) return apiUrl;
  
  const { protocol, hostname } = window.location;
  if (
    hostname === 'localhost' || 
    hostname === '127.0.0.1' || 
    hostname.startsWith('192.168.') || 
    hostname.startsWith('10.') || 
    hostname.startsWith('172.')
  ) {
    return `${protocol}//${hostname}:5000`;
  }
  return 'http://localhost:5000';
};

const api = axios.create({
  baseURL: getBackendUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Setup interceptor to inject Authorization token dynamically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response error handling interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error Response:', error.response || error);
    // Standardize error message extraction
    const message = error.response?.data?.message || 'Something went wrong. Please try again.';
    const errors = error.response?.data?.errors || [];
    
    const err = new Error(message);
    err.status = error.response?.status || 500;
    err.errors = errors;
    
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (name, email, password) => api.post('/api/auth/register', { name, email, password }),
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  getMe: () => api.get('/api/auth/me'),
  updateProfile: (data) => api.put('/api/auth/profile', data),
  uploadAvatar: (formData) => api.post('/api/auth/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getMatches: () => api.get('/api/auth/matches'),
  seedMatches: () => api.get('/api/auth/seed-matches')
};

export const groupsAPI = {
  getPublic: () => api.get('/api/groups'),
  create: (data) => api.post('/api/groups', data),
  join: (data) => api.post('/api/groups/join', data),
  getDetails: (id) => api.get(`/api/groups/${id}`),
  leave: (id) => api.delete(`/api/groups/${id}/leave`),
  scheduleSession: (id, data) => api.post(`/api/groups/${id}/sessions`, data),
  attendSession: (id, sessionId) => api.post(`/api/groups/${id}/sessions/${sessionId}/attend`)
};

export const messagesAPI = {
  getMessages: (groupId) => api.get(`/api/groups/${groupId}/messages`),
  sendMessage: (groupId, formData) => api.post(`/api/groups/${groupId}/messages`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

export const resourcesAPI = {
  getResources: (groupId) => api.get(`/api/groups/${groupId}/resources`),
  addResource: (groupId, formData) => api.post(`/api/groups/${groupId}/resources`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  likeResource: (resId) => api.post(`/api/resources/${resId}/like`),
  deleteResource: (resId) => api.delete(`/api/resources/${resId}`)
};

export const skillsAPI = {
  getPreset: () => api.get('/api/skills'),
  addSkill: (data) => api.post('/api/users/skills', data),
  updateSkill: (data) => api.put('/api/users/skills', data),
  deleteSkill: (id, type) => api.delete(`/api/users/skills/${id}?type=${type}`),
  
  getRecommendations: () => api.get('/api/marketplace/recommendations'),
  searchStudents: (params) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/api/marketplace/search?${query}`);
  },
  
  createRequest: (data) => api.post('/api/exchange/request', data),
  acceptRequest: (id) => api.put(`/api/exchange/request/${id}/accept`),
  rejectRequest: (id) => api.put(`/api/exchange/request/${id}/reject`),
  getHistory: () => api.get('/api/exchange/history'),
  
  bookSession: (data) => api.post('/api/session', data),
  submitReview: (data) => api.post('/api/session/review', data)
};

export default api;
