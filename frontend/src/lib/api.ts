import axios from 'axios';
import { useAuthStore } from './auth';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: any) => void; reject: (e: any) => void }> = [];

function processQueue(error: any) {
    failedQueue.forEach(({ resolve, reject }) => error ? reject(error) : resolve(null));
    failedQueue = [];
}

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url?.includes('/auth/refresh')
        ) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => api(originalRequest));
            }
            originalRequest._retry = true;
            isRefreshing = true;
            try {
                await api.post('/auth/refresh');
                processQueue(null);
                return api(originalRequest);
            } catch (refreshErr) {
                processQueue(refreshErr);
                useAuthStore.getState().clearUser();
                window.location.href = '/login';
                return Promise.reject(refreshErr);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);

export default api;
