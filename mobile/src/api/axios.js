import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = String(
    process.env.EXPO_PUBLIC_API_URL || 'https://dermas-apperal-backend.vercel.app'
).replace(/\/$/, '');

const api = axios.create({
    baseURL: `${BASE_URL}/api`,
    withCredentials: true,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error?.response?.status === 401) {
            await AsyncStorage.multiRemove(['userToken', 'userData']);
        }
        return Promise.reject(error);
    }
);

export default api;
