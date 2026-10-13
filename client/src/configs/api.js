import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_BASEURL || 'http://localhost:5000',
    withCredentials: true,
})

// Auto-refresh token on 401 response
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (
            error.response &&
            error.response.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url.includes('/api/auth/login') &&
            !originalRequest.url.includes('/api/auth/refresh') &&
            !originalRequest.url.includes('/api/auth/register')
        ) {
            originalRequest._retry = true;
            try {
                await api.post('/api/auth/refresh');
                return api(originalRequest);
            } catch (refreshError) {
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;