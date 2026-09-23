// Central helper so every fetch call sends the JWT token automatically
 
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function apiFetch(url, options = {}) {
    const token = localStorage.getItem('token')
 
    // Add token to Authorization header if it exists
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    }
 
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }
 
const response = await fetch(`${API_URL}${url}`, {
        ...options,
        headers,
    })


    if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        window.location.href = '/';
        return;
    }

    return response;
}