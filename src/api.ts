import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:8080/api', // URL do seu Spring Boot
});

// Interceptor para adicionar o Token automaticamente em toda requisição
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('serra_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});