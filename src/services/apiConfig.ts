export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');

export const apiUrl = (path: string): string => `${API_BASE_URL}/api${path}`;