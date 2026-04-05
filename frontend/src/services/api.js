import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth endpoints
export const authAPI = {
  setupAdmin: (data) => api.post('/auth/setup-admin', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// User management
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getStudentsByClass: (program, semester, section) =>
    api.get('/users/students/by-class', { params: { program, semester, section } }),
  assignMentor: (studentId, mentorId) =>
    api.put(`/users/${studentId}/assign-mentor`, { mentorId }),
};

// Departments
export const departmentsAPI = {
  getAll: () => api.get('/departments'),
  getById: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
};

// Programs
export const programsAPI = {
  getAll: (params) => api.get('/programs', { params }),
  getById: (id) => api.get(`/programs/${id}`),
  create: (data) => api.post('/programs', data),
  update: (id, data) => api.put(`/programs/${id}`, data),
  delete: (id) => api.delete(`/programs/${id}`),
};

// Subjects
export const subjectsAPI = {
  getAll: (params) => api.get('/subjects', { params }),
  getById: (id) => api.get(`/subjects/${id}`),
  create: (data) => api.post('/subjects', data),
  update: (id, data) => api.put(`/subjects/${id}`, data),
  delete: (id) => api.delete(`/subjects/${id}`),
};

// Subject Allocations
export const allocationsAPI = {
  getAll: (params) => api.get('/allocations', { params }),
  getMyAllocations: () => api.get('/allocations/my'),
  create: (data) => api.post('/allocations', data),
  update: (id, data) => api.put(`/allocations/${id}`, data),
  delete: (id) => api.delete(`/allocations/${id}`),
};

// Activity Categories
export const activityCategoriesAPI = {
  getAll: () => api.get('/activity-categories'),
  create: (data) => api.post('/activity-categories', data),
  update: (id, data) => api.put(`/activity-categories/${id}`, data),
  delete: (id) => api.delete(`/activity-categories/${id}`),
};

// Activities
export const activitiesAPI = {
  getAll: (params) => api.get('/activities', { params }),
  getMyActivities: (params) => api.get('/activities/my', { params }),
  getPendingVerification: (params) => api.get('/activities/pending', { params }),
  getById: (id) => api.get(`/activities/${id}`),
  create: (formData) =>
    api.post('/activities', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  verify: (id, data) => api.put(`/activities/${id}/verify`, data),
  delete: (id) => api.delete(`/activities/${id}`),
  getPortfolio: (studentId) => api.get(`/activities/portfolio/${studentId}`),
};

// Attendance
export const attendanceAPI = {
  getBySubject: (subjectId, params) =>
    api.get(`/attendance/subject/${subjectId}`, { params }),
  getByStudent: (studentId, params) =>
    api.get(`/attendance/student/${studentId}`, { params }),
  getMyAttendance: (params) => api.get('/attendance/my', { params }),
  mark: (data) => api.post('/attendance/mark', data),
  edit: (id, data) => api.put(`/attendance/${id}`, data),
  getDefaulters: (params) => api.get('/attendance/defaulters', { params }),
  getSubjectStats: (subjectId) => api.get(`/attendance/subject/${subjectId}/stats`),
};

// Marks
export const marksAPI = {
  getBySubject: (subjectId, params) =>
    api.get(`/marks/subject/${subjectId}`, { params }),
  getByStudent: (studentId, params) =>
    api.get(`/marks/student/${studentId}`, { params }),
  getMyMarks: () => api.get('/marks/my'),
  enter: (data) => api.post('/marks/enter', data),
  update: (id, data) => api.put(`/marks/${id}`, data),
  calculateAttendanceMarks: (subjectId) =>
    api.post(`/marks/calculate-attendance/${subjectId}`),
  getConsolidated: (subjectId) => api.get(`/marks/consolidated/${subjectId}`),
};

// Dashboard
export const dashboardAPI = {
  getStudentDashboard: () => api.get('/dashboard/student'),
  getStaffDashboard: () => api.get('/dashboard/staff'),
  getHodDashboard: () => api.get('/dashboard/hod'),
  getAdminDashboard: () => api.get('/dashboard/admin'),
};

// Reports
export const reportsAPI = {
  getNAACAttendance: (params) => api.get('/reports/naac/attendance', { params }),
  getNAACActivities: (params) => api.get('/reports/naac/activities', { params }),
  getUnifiedProfile: (studentId) => api.get(`/reports/unified-profile/${studentId}`),
  exportPDF: (type, params) =>
    api.get(`/reports/export/${type}`, { params, responseType: 'blob' }),
};

// Settings
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};
