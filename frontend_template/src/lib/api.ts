import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    withCredentials: true,
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // You can handle global errors here like token expiration, etc.
        return Promise.reject(error);
    }
);

export default api;
