import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Using deployed backend URL as requested
const BASE_URL = 'https://dermas-apperal-backend.vercel.app';

const api = axios.create({
    baseURL: `${BASE_URL}/api`,
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

export default api;
