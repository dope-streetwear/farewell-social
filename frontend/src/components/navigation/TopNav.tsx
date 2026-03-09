import type React from 'react';
import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Compass, MessageSquare, User, LogOut, Shield, Video, Flame, Bell, PlusSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

export const TopNav: React.FC = () => {
    const { user, isAdmin, logout } = useAuth();
    const navigate = useNavigate();
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
        `flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors ${isActive ? 'bg-secondary text-primary' : 'text-white hover:bg-white/10'
        }`;

    const activePlusClass = ({ isActive }: { isActive: boolean }) =>
        `flex items-center justify-center w-10 h-10 rounded-full transition-colors ${isActive ? 'bg-secondary text-primary' : 'bg-accent-2 text-white hover:bg-accent-1'
        }`;

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <nav className="fixed top-0 left-0 right-0 h-16 bg-primary border-b border-white/10 z-50 hidden md:flex items-center justify-between px-8">
            <div className="flex items-center gap-4">
                <span className="text-secondary font-black text-2xl tracking-tighter cursor-pointer" onClick={() => navigate('/')}>
                    NARAYANA<span className="text-accent-2">SOCIAL</span>
                </span>
            </div>

            <div className="flex items-center gap-4">
                <NavLink to="/" className={navLinkClass}>
                    <Home size={20} /> Home
                </NavLink>
                <NavLink to="/feed" className={navLinkClass}>
                    <Compass size={20} /> Feed
                </NavLink>
                <NavLink to="/vibes" className={navLinkClass}>
                    <Flame size={20} /> Vibes
                </NavLink>
                <NavLink to="/ngl" className={navLinkClass}>
                    <MessageSquare size={20} /> NGL
                </NavLink>
                <NavLink to="/lounge" className={navLinkClass}>
                    <Video size={20} /> Lounge
                </NavLink>
                <NavLink to="/create" className={activePlusClass}>
                    <PlusSquare size={20} />
                </NavLink>
                <NavLink to="/notifications" className={navLinkClass}>
                    <div className="relative">
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-2 -right-2 w-4 h-4 bg-error text-white text-[10px] font-black rounded-full flex items-center justify-center">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </div>
                </NavLink>
                <NavLink to="/u/me" className={navLinkClass}>
                    <User size={20} /> My Profile
                </NavLink>
                {isAdmin && (
                    <NavLink to="/admin/dashboard" className={navLinkClass}>
                        <Shield size={20} /> Controls
                    </NavLink>
                )}
            </div>

            <div>
                <button
                    onClick={handleLogout}
                    className="text-white hover:text-error transition-colors p-2 rounded-lg hover:bg-white/10"
                    title="Logout"
                >
                    <LogOut size={20} />
                </button>
            </div>
        </nav>
    );
};
