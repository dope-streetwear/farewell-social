import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

export interface User {
    _id: string;
    username: string;
    email?: string;
    admissionNumber?: string;
    displayName: string;
    classSection?: string;
    profileImageUrl?: string;
    verificationTier?: number;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAdmin: boolean;
    login: (user: User) => void;
    logout: () => void | Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    // Initial fetch using the httpOnly cookie to get the "me" profile
    useEffect(() => {
        const fetchMe = async () => {
            try {
                const data = await api('/api/auth/me');
                setUser(data);
            } catch (error) {
                console.error('Failed to fetch user', error);
            } finally {
                setLoading(false);
            }
        };

        const checkAdmin = async () => {
            try {
                await api('/api/admin/me');
                setIsAdmin(true);
            } catch {
                setIsAdmin(false);
            }
        };

        fetchMe();
        checkAdmin();
    }, []);

    const login = (userData: User) => setUser(userData);
    const logout = async () => {
        try {
            await api('/api/auth/logout', { method: 'POST' });
        } catch {
            // ignore network error — still clear local state
        }
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, isAdmin, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
