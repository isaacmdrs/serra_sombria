import axios from 'axios';

// Define a URL dinamicamente
// Se existir a variável de ambiente (Vercel), usa ela. 
// Senão, usa o localhost (Seu PC).
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const api = axios.create({
  baseURL: apiUrl,
});

// Interceptor (Mantenha igual, está ótimo)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('serra_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});