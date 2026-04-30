import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const clearSession = async () => {
        await AsyncStorage.multiRemove(['userToken', 'userData']);
        setUser(null);
    };

    const loadToken = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const storedUser = await AsyncStorage.getItem('userData');

            if (!token && !storedUser) {
                setUser(null);
                return;
            }

            const response = await api.get('/auth/me');
            const nextUser = response.data;
            await AsyncStorage.setItem('userData', JSON.stringify(nextUser));
            setUser(nextUser);
        } catch (e) {
            console.error('Failed to restore session', e);
            await clearSession();
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadToken();
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user: userData } = response.data || {};

            if (token && userData) {
                await AsyncStorage.setItem('userToken', token);
                await AsyncStorage.setItem('userData', JSON.stringify(userData));
                setUser(userData);
                return;
            }

            const meResponse = await api.get('/auth/me');
            const nextUser = meResponse.data;
            await AsyncStorage.setItem('userData', JSON.stringify(nextUser));
            setUser(nextUser);
        } catch (e) {
            console.error('Login error', e);
            throw e;
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (e) {
            console.error('Logout error', e);
        } finally {
            await clearSession();
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
