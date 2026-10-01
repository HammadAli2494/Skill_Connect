import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

export function mediaUrl(url) {
  const value = String(url || '').trim();
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) return value;
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const origin = base.replace(/\/api\/?$/, '');
  return `${origin}${value.startsWith('/') ? value : `/${value}`}`;
}

export function imageSrc(image) {
  if (!image) return '';
  if (typeof image === 'string') return mediaUrl(image);
  return mediaUrl(image.url || image.secure_url || image.secureUrl || '');
}

export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data;
  if (data?.details?.length) return data.details[0].message;
  if (data?.message) return data.message;
  return fallback;
}

export default api;
