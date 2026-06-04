/**
 * Shared API client used by all components.
 * - In production (Firebase), rewrites /api → https://kadwel-backend.onrender.com/api
 * - Attaches the stored auth token on every request
 */
import axios from 'axios';

const BACKEND_URL = 'https://kadwel-backend.onrender.com';

const isProduction = () =>
    window.location.hostname.includes('web.app') ||
    window.location.hostname.includes('firebaseapp.com') ||
    window.location.hostname.includes('kadwelinternationalschools.com');

const api = axios.create({
    baseURL: isProduction() ? `${BACKEND_URL}/api` : '/api',
});

// Attach auth token on every request
api.interceptors.request.use(config => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Token ${token}`;
    }
    return config;
});

export default api;
