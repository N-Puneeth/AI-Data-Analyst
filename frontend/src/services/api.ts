import axios from 'axios';
import type { AuthResponse, User, AnalysisSession, AnalysisResponse, Dataset, ChatRequest, ChatResponse } from '../types';

const isProduction = import.meta.env.PROD;
const apiUrl = import.meta.env.VITE_API_URL || (isProduction ? 'https://datapilot-app.onrender.com' : 'http://localhost:8000');

export const api = axios.create({
  baseURL: apiUrl,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Using window.location.href to redirect is simple and works outside components
      if (window.location.pathname !== '/' && window.location.pathname !== '/auth') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    const response = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return response.data;
  },
  register: async (data: { name?: string; email: string; password: string; password_confirm: string }): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  getMe: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  updateProfile: async (data: { name?: string; email?: string }): Promise<User> => {
    const response = await api.put('/auth/me', data);
    return response.data;
  },
  changePassword: async (data: any): Promise<any> => {
    const response = await api.put('/auth/me/password', data);
    return response.data;
  }
};

export const sessionsApi = {
  list: async (): Promise<AnalysisSession[]> => {
    const response = await api.get('/sessions');
    return response.data;
  },
  create: async (title?: string): Promise<AnalysisSession> => {
    const response = await api.post('/sessions', { title });
    return response.data;
  },
  delete: async (id: string): Promise<any> => {
    const response = await api.delete(`/sessions/${id}`);
    return response.data;
  },
  rename: async (id: string, title: string): Promise<AnalysisSession> => {
    const response = await api.put(`/sessions/${id}`, { title });
    return response.data;
  }
};

export const agentApi = {
  analyze: async (prompt: string, sessionId: string, file?: File): Promise<AnalysisResponse> => {
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('session_id', sessionId);
    if (file) {
      formData.append('file', file);
    }
    const response = await api.post('/agent/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};

export const datasetsApi = {
  list: async (): Promise<Dataset[]> => {
    const response = await api.get('/datasets');
    return response.data;
  },
  upload: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/data/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};

export const aiApi = {
  chat: async (data: ChatRequest): Promise<ChatResponse> => {
    const response = await api.post('/ai/chat', data);
    return response.data;
  }
};