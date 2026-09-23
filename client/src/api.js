// Central helper so every fetch call sends the JWT token automatically

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function apiFetch(url, options = {}) {
    const token = localStorage.getItem('token');

    return fetch(`${API_URL}${url}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });
}