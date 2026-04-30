import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadToken = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const storedUser = await AsyncStorage.getItem('userData');
            if (token && storedUser) {
                // Validate token visually or hit a /me endpoint
                setUser(JSON.parse(storedUser));
            }
        } catch (e) {
            console.error('Failed to load token', e);
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
            const { token, user: userData } = response.data;

            await AsyncStorage.setItem('userToken', token);
            await AsyncStorage.setItem('userData', JSON.stringify(userData));
            setUser(userData);
        } catch (e) {
            console.error('Login error', e);
            throw e;
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userData');
            setUser(null);
        } catch (e) {
            console.error('Logout error', e);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
