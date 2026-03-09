import type React from 'react';
import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, PlusSquare, User, Flame, Shield, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

export const BottomNav: React.FC = () => {
    const { user, isAdmin } = useAuth();
    const { socket } = useSocket();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user) return;

        const fetchUnread = async () => {
            try {
                const res = await fetch('/api/notifications');
                if (res.ok) {
                    const data = await res.json();
                    setUnreadCount(data.filter((n: any) => !n.read).length);
                }
            } catch { }
        };

        fetchUnread();
    }, [user]);

    useEffect(() => {
        if (!socket) return;

        const handleNewNotif = () => {
            setUnreadCount(prev => prev + 1);
        };

        socket.on('new-notification', handleNewNotif);
        return () => {
            socket.off('new-notification', handleNewNotif);
        };
    }, [socket]);

    const navLinkClass = ({ isActive }: { isActive: boolean }) =>
        `flex flex-col items-center justify-center w-full h-full transition-colors ${isActive ? 'text-secondary' : 'text-white/60 hover:text-white'
        }`;

    const activePlusClass = ({ isActive }: { isActive: boolean }) =>
        `flex flex-col items-center justify-center w-full h-full transition-colors ${isActive ? 'text-secondary' : 'text-white/60 hover:text-white'
        }`;

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-primary border-t border-white/10 z-50 md:hidden flex items-center justify-around px-2 pb-safe">
            <NavLink to="/" className={navLinkClass}>
                <Home size={24} />
            </NavLink>
            <NavLink to="/feed" className={navLinkClass}>
                <Compass size={24} />
            </NavLink>
            <NavLink to="/vibes" className={navLinkClass}>
                <Flame size={24} />
            </NavLink>
            <NavLink to="/create" className={activePlusClass}>
                <PlusSquare size={28} />
            </NavLink>
            <NavLink to="/notifications" className={navLinkClass}>
                <div className="relative">
                    <Bell size={24} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-error text-white text-[10px] font-black rounded-full flex items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </div>
            </NavLink>
            <NavLink to="/u/me" className={navLinkClass}>
                <User size={24} />
            </NavLink>
            {isAdmin && (
                <NavLink to="/admin/dashboard" className={navLinkClass}>
                    <Shield size={22} />
                </NavLink>
            )}
        </nav>
    );
};
