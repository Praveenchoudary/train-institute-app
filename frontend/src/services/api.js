// ══════════════════════════════════════════════════════════════════
//  api.js — Centralized Axios HTTP Client
//
//  Base URL: /api  (relative, works behind nginx proxy)
//
//  Request interceptor:  Attaches Bearer token if present
//  Response interceptor: On 401 → clears token + redirects to login
// ══════════════════════════════════════════════════════════════════

import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle token expiry globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────
export const authAPI = {
  login:          (data) => api.post('/auth/login', data),
  register:       (data) => api.post('/auth/register', data),
  me:             ()     => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// ── Courses ───────────────────────────────────────────────────────
export const coursesAPI = {
  getAll:      (params) => api.get('/courses', { params }),
  getById:     (id)     => api.get(`/courses/${id}`),
  create:      (data)   => api.post('/courses', data),
  update:      (id, d)  => api.put(`/courses/${id}`, d),
  delete:      (id)     => api.delete(`/courses/${id}`),
  getStudents: (id)     => api.get(`/courses/${id}/students`),
};

// ── Enrollments ───────────────────────────────────────────────────
export const enrollmentsAPI = {
  enroll:         (courseId) => api.post('/enrollments', { courseId }),
  my:             ()         => api.get('/enrollments/my'),
  updateProgress: (id, pct)  => api.put(`/enrollments/${id}/progress`, { progress: pct }),
  unenroll:       (id)       => api.delete(`/enrollments/${id}`),
};

// ── Admin ─────────────────────────────────────────────────────────
export const adminAPI = {
  dashboard:   ()           => api.get('/admin/dashboard'),
  toggleUser:  (id)         => api.put(`/admin/users/${id}/toggle`),
  assignGrade: (id, grade)  => api.put(`/admin/enrollments/${id}/grade`, { grade }),
};

// ── Students ──────────────────────────────────────────────────────
export const studentsAPI = {
  getAll:        (params) => api.get('/students', { params }),
  getById:       (id)     => api.get(`/students/${id}`),
  updateProfile: (data)   => api.put('/students/profile', data),
};

export default api;

// ── Payments ──────────────────────────────────────────────────────
export const paymentAPI = {
  createOrder:  (courseId)  => api.post('/payments/create-order', { courseId }),
  process:      (data)      => api.post('/payments/process', data),
  history:      ()          => api.get('/payments/history'),
  receipt:      (txnId)     => api.get(`/payments/receipt/${txnId}`),
  refund:       (paymentId) => api.post(`/payments/refund/${paymentId}`),
};
