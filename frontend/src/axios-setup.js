import axios from 'axios';

const BACKEND_URL = 'https://kadwel-backend.onrender.com';

// Determine if we're running on the deployed Firebase site (not localhost)
function isProduction() {
    const host = window.location.hostname;
    return host.includes('web.app') ||
        host.includes('firebaseapp.com') ||
        host.includes('kadwelinternationalschools.com');
}

// --- Request interceptor ---
// 1. Rewrites relative /api/ URLs to the full Render backend URL (production only)
// 2. Attaches the stored auth token as an Authorization header on every request
axios.interceptors.request.use(config => {
    // Rewrite URL in production
    if (isProduction() && config.url && config.url.startsWith('/')) {
        config.url = BACKEND_URL + config.url;
    }

    // Attach auth token if present
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Token ${token}`;
    }

    return config;
});
