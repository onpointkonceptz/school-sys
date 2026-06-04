import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'
import axios from 'axios';

// In production (Firebase), route all API calls to the Render backend.
// In development, Vite's proxy handles /api → localhost:8000.
if (
    window.location.hostname.includes('web.app') ||
    window.location.hostname.includes('firebaseapp.com') ||
    window.location.hostname.includes('kadwelinternationalschools.com')
) {
    axios.defaults.baseURL = 'https://kadwel-backend.onrender.com';
}

// Attach stored auth token to every request
axios.interceptors.request.use(config => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Token ${token}`;
    }
    return config;
});

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
)
