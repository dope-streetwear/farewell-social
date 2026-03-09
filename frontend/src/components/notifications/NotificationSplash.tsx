import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Button } from '../ui/Button';

export const NotificationSplash: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [mention, setMention] = useState<any>(null);

    const { socket } = useSocket();

    useEffect(() => {
        if (!socket || !user) return;

        const handleNewNotification = (notif: any) => {
            if (notif.type === 'MENTION' || notif.type === 'MATCH') {
                setMention(notif);
            }
        };

        socket.on('new-notification', handleNewNotification);

        return () => {
            socket.off('new-notification', handleNewNotification);
        };
    }, [socket, user]);

    if (!mention) return null;

    const handleRead = async (redirect: boolean) => {
        try {
            await fetch(`/api/notifications/${mention._id}/read`, { method: 'PUT' });
            setMention(null);
            if (redirect && mention.postId) {
                navigate(`/post/${mention.postId._id}`);
            } else if (mention.type === 'MATCH') {
                navigate('/secret-crush');
            }
        } catch (err) {
            console.error("Failed to mark as read", err);
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] bg-bg-dark/95 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
            <div className="bg-primary border-2 border-secondary p-8 rounded-3xl max-w-sm w-full text-center shadow-[0_0_80px_rgba(255,255,255,0.15)] relative overflow-hidden">
                <div className="absolute inset-0 bg-secondary/5 mix-blend-overlay pointer-events-none"></div>
                <div className="w-24 h-24 mx-auto rounded-full bg-secondary/20 flex items-center justify-center mb-6 animate-bounce shadow-[0_0_30px_inherit]">
                    <span className="text-5xl">🚨</span>
                </div>
                <h2 className="text-4xl font-black text-white mb-2 uppercase tracking-tighter leading-none">
                    {mention.type === 'MATCH' ? "It's a Match! 💘" : "You were summoned! 🚨"}
                </h2>
                <p className="text-white/80 mb-8 text-lg mt-4">
                    {mention.type === 'MATCH' ? (
                        <>You and <span className="font-bold text-secondary">@{mention.senderId?.username}</span> both crushed on each other!</>
                    ) : (
                        <><span className="font-bold text-secondary">@{mention.senderId?.username || 'Someone'}</span> tagged you in a post. Get in there!</>
                    )}
                </p>

                <div className="space-y-3 relative z-10">
                    <Button variant="primary" className="w-full py-6 text-lg tracking-wide shadow-xl shadow-secondary/20" onClick={() => handleRead(mention.type !== 'MATCH')}>
                        {mention.type === 'MATCH' ? 'SEE MY MATCHES' : 'TAKE ME THERE'}
                    </Button>
                    <Button variant="ghost" className="w-full text-white/50 hover:text-white" onClick={() => handleRead(false)}>
                        Dismiss for now
                    </Button>
                </div>
            </div>
        </div>
    );
};
