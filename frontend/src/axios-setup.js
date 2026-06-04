import axios from 'axios';

// Monkey patch axios.create to dynamically route API requests to the production backend
const originalCreate = axios.create;
axios.create = function (config) {
    const host = window.location.hostname;
    if (host.includes('web.app') || host.includes('firebaseapp.com') || host.includes('kadwelinternationalschools.com')) {
        const backendUrl = 'https://kadwel-backend.onrender.com';
        if (config && config.baseURL && config.baseURL.startsWith('/')) {
            config.baseURL = backendUrl + config.baseURL;
        }
    }
    return originalCreate.call(this, config);
};

// Also intercept global axios requests (like those in App.jsx)
axios.interceptors.request.use(config => {
    const host = window.location.hostname;
    if (host.includes('web.app') || host.includes('firebaseapp.com') || host.includes('kadwelinternationalschools.com')) {
        const backendUrl = 'https://kadwel-backend.onrender.com';
        if (config.url && config.url.startsWith('/')) {
            config.url = backendUrl + config.url;
        }
    }
    return config;
});
