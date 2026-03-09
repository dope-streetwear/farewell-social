import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { VerifiedBadge } from '../components/ui/VerifiedBadge';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Loader2, Heart, MessageCircle, AtSign, Repeat, Reply, CheckCheck, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NotificationItem {
    _id: string;
    senderId: {
        _id: string;
        username: string;
        displayName: string;
        profileImageUrl?: string;
        verificationTier?: number;
    };
    type: 'MENTION' | 'LIKE' | 'COMMENT' | 'REPLY' | 'REPOST' | 'MATCH';
    postId?: { _id: string; caption?: string };
    message: string;
    read: boolean;
    createdAt: string;
}

const typeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
    MENTION: { icon: <AtSign size={16} />, color: 'text-secondary' },
    LIKE: { icon: <Heart size={16} className="fill-error" />, color: 'text-error' },
    COMMENT: { icon: <MessageCircle size={16} />, color: 'text-accent-2' },
    REPLY: { icon: <Reply size={16} />, color: 'text-accent-1' },
    REPOST: { icon: <Repeat size={16} />, color: 'text-secondary' },
    MATCH: { icon: <Sparkles size={16} />, color: 'text-accent-2' },
};

export const Notifications: React.FC = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) navigate('/login');
    }, [user, authLoading, navigate]);

    const { socket } = useSocket();

    useEffect(() => {
        if (!user) return;
        fetchNotifications();
    }, [user]);

    useEffect(() => {
        if (!socket) return;

        const handleNewNotif = (newNotif: NotificationItem) => {
            setNotifications(prev => [newNotif, ...prev]);
        };

        socket.on('new-notification', handleNewNotif);
        return () => {
            socket.off('new-notification', handleNewNotif);
        };
    }, [socket]);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (err) {
            console.error('Error fetching notifications', err);
        } finally {
            setLoading(false);
        }
    };

    const markAllRead = async () => {
        try {
            await fetch('/api/notifications/read-all', { method: 'PUT' });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (err) {
            console.error('Error marking all read', err);
        }
    };

    const handleClick = async (notif: NotificationItem) => {
        // Mark as read
        if (!notif.read) {
            try {
                await fetch(`/api/notifications/${notif._id}/read`, { method: 'PUT' });
                setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, read: true } : n));
            } catch { }
        }

        // Navigate to the post
        if (notif.postId) {
            navigate(`/post/${notif.postId._id}`);
        } else if (notif.type === 'MATCH') {
            navigate('/secret-crush');
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    if (loading) {
        return <div className="flex justify-center mt-20"><Loader2 className="animate-spin text-secondary" size={32} /></div>;
    }

    return (
        <div className="w-full max-w-xl mx-auto min-h-screen pb-20 pt-4 px-4">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-black text-white tracking-tight">
                    Kya Chal Raha Hai
                </h1>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllRead}
                        className="flex items-center gap-1.5 text-sm font-bold text-secondary hover:text-secondary/80 transition-colors"
                    >
                        <CheckCheck size={16} />
                        Sab padh liya
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
                <Card className="p-8 text-center">
                    <p className="text-white/50 text-lg font-bold">Koi notification nahi hai abhi</p>
                    <p className="text-white/30 text-sm mt-2">Jab koi tujhe tag karega, like karega ya comment karega, yahan dikhega</p>
                </Card>
            ) : (
                <div className="space-y-2">
                    {notifications.map(notif => {
                        const config = typeConfig[notif.type] || typeConfig.MENTION;
                        return (
                            <Card
                                key={notif._id}
                                className={`p-4 cursor-pointer transition-all hover:border-white/20 ${!notif.read ? 'border-l-4 border-l-secondary bg-secondary/5' : 'opacity-70'}`}
                                onClick={() => handleClick(notif)}
                            >
                                <div className="flex items-center gap-3">
                                    {/* Avatar */}
                                    <div className="relative flex-shrink-0">
                                        <div className="w-10 h-10 rounded-full bg-accent-1 overflow-hidden flex items-center justify-center text-white font-bold">
                                            {notif.senderId?.profileImageUrl ? (
                                                <img src={notif.senderId.profileImageUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                notif.senderId?.displayName?.charAt(0).toUpperCase() || '?'
                                            )}
                                        </div>
                                        {/* Type icon badge */}
                                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary border border-white/20 flex items-center justify-center ${config.color}`}>
                                            {config.icon}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white">
                                            <span className="font-bold inline-flex items-center gap-1">
                                                {notif.senderId?.displayName || 'Someone'}
                                                <VerifiedBadge tier={notif.senderId?.verificationTier || 0} size={12} />
                                            </span>
                                            {' '}{notif.message}
                                        </p>
                                        <p className="text-xs text-white/40 mt-0.5">
                                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                        </p>
                                    </div>

                                    {/* Unread dot */}
                                    {!notif.read && (
                                        <div className="w-2.5 h-2.5 rounded-full bg-secondary flex-shrink-0" />
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
