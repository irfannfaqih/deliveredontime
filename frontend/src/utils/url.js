// src/utils/url.js
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const UPLOADS_BASE = API_BASE.replace(/\/api$/, '');

export const normalizeUrl = (url) => {
  if (!url) return url;
  const str = String(url);
  
  // Jika sudah URL lengkap, return as is
  if (str.startsWith('http://') || str.startsWith('https://')) {
    return str;
  }
  
  // Jika path relatif dari uploads, tambahkan base URL
  if (str.startsWith('/uploads/')) {
    return `${UPLOADS_BASE}${str}`;
  }
  
  // Otherwise return as is
  return str;
};

export const normalizeMapsUrl = (raw, name) => {
  const src = String(raw || '').trim();
  if (!src.length) return '';
  const idx = src.toLowerCase().indexOf('http');
  if (idx >= 0) {
    const candidate = src.slice(idx).trim();
    if (/^https?:\/\//i.test(candidate)) return candidate;
  }
  const q = encodeURIComponent(String(name || src));
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
};
