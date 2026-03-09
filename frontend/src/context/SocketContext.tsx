import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextData {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextData>({
    socket: null,
    isConnected: false,
});

// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        // Connect to the backend socket server
        // WebSockets MUST use the full URL (Render) because Vercel proxy doesn't support them.
        let backendUrl = import.meta.env.VITE_API_URL;

        if (!backendUrl && import.meta.env.PROD) {
            // Fallback for production if they forgot the env var
            backendUrl = 'https://farewell-social-backend.onrender.com';
        } else if (!backendUrl) {
            backendUrl = 'http://localhost:5000';
        }

        const socketInstance = io(backendUrl, {
            withCredentials: true,
            transports: ['websocket', 'polling']
        });

        socketInstance.on('connect', () => {
            setIsConnected(true);
            if (user?._id) {
                socketInstance.emit('join-user-room', user._id);
            }
        });

        socketInstance.on('disconnect', () => {
            setIsConnected(false);
        });

        socketRef.current = socketInstance;
        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [user?._id]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
