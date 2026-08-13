import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('signal_token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally — clear token and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('signal_token');
      localStorage.removeItem('signal_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ---------------------------------------------------------------------------
// Auth API
// ---------------------------------------------------------------------------
export const authApi = {
  register: (data: {
    phone_number: string;
    password: string;
    display_name: string;
    username: string;
  }) => api.post('/auth/register', data),

  verifyOtp: (data: {
    phone_number: string;
    otp: string;
  }) => api.post('/auth/verify-otp', data),

  login: (data: { phone_number: string; password: string }) =>
    api.post('/auth/login', data),

  logout: () => api.post('/auth/logout'),
};

// ---------------------------------------------------------------------------
// Users API
// ---------------------------------------------------------------------------
export const usersApi = {
  getMe: () => api.get('/users/me'),
  updateMe: (data: { display_name?: string; avatar_url?: string; about_status?: string }) =>
    api.patch('/users/me', data),
  searchUsers: (q: string) => api.get('/users/', { params: { q } }),
  getUser: (userId: string) => api.get(`/users/${userId}`),
};

// ---------------------------------------------------------------------------
// Contacts API
// ---------------------------------------------------------------------------
export const contactsApi = {
  list: () => api.get('/contacts/'),
  add: (data: {
    contact_user_id?: string;
    phone_number?: string;
    username?: string;
    nickname?: string;
  }) => api.post('/contacts/', data),
  remove: (contactId: string) => api.delete(`/contacts/${contactId}`),
};

// ---------------------------------------------------------------------------
// Conversations API
// ---------------------------------------------------------------------------
export const conversationsApi = {
  list: () => api.get('/conversations/'),
  create: (data: {
    type: 'direct' | 'group';
    target_user_id?: string;
    group_name?: string;
    group_avatar_url?: string;
    member_ids?: string[];
  }) => api.post('/conversations/', data),
  get: (id: string) => api.get(`/conversations/${id}`),
  update: (id: string, data: { group_name?: string; group_avatar_url?: string }) =>
    api.patch(`/conversations/${id}`, data),
  // Messages
  getMessages: (id: string, limit = 50, before?: string) =>
    api.get(`/conversations/${id}/messages`, { params: { limit, before } }),
  sendMessage: (id: string, data: { content: string; reply_to_message_id?: string; client_temp_id?: string }) =>
    api.post(`/conversations/${id}/messages`, data),
  // Members
  getMembers: (id: string) => api.get(`/conversations/${id}/members`),
  addMember: (id: string, userId: string) =>
    api.post(`/conversations/${id}/members`, { user_id: userId }),
  removeMember: (id: string, userId: string) =>
    api.delete(`/conversations/${id}/members/${userId}`),
  // Reactions
  addReaction: (convId: string, msgId: string, emoji: string) =>
    api.post(`/conversations/${convId}/messages/${msgId}/reactions`, { emoji }),
};
