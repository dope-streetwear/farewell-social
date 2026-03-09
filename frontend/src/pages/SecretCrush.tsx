import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { VerifiedBadge } from '../components/ui/VerifiedBadge';
import { Loader2, Heart, Sparkles, Lock, PartyPopper } from 'lucide-react';

interface UserItem {
    _id: string;
    username: string;
    displayName: string;
    profileImageUrl?: string;
    classSection?: string;
    verificationTier?: number;
}

export const SecretCrush: React.FC = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [users, setUsers] = useState<UserItem[]>([]);
    const [myCrushIds, setMyCrushIds] = useState<string[]>([]);
    const [matches, setMatches] = useState<UserItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [matchAlert, setMatchAlert] = useState<string | null>(null);
    const [tab, setTab] = useState<'browse' | 'matches'>('browse');

    useEffect(() => {
        if (!authLoading && !user) navigate('/login');
    }, [user, authLoading, navigate]);

    useEffect(() => {
        if (user) {
            fetchAll();
        }
    }, [user]);

    const fetchAll = async () => {
        try {
            const [usersRes, crushRes, matchRes] = await Promise.all([
                fetch('/api/secret-crush/browse'),
                fetch('/api/secret-crush/my-crushes'),
                fetch('/api/secret-crush/matches'),
            ]);

            if (usersRes.ok) setUsers(await usersRes.json());
            if (crushRes.ok) setMyCrushIds(await crushRes.json());
            if (matchRes.ok) setMatches(await matchRes.json());
        } catch (err) {
            console.error('Error fetching crush data', err);
        } finally {
            setLoading(false);
        }
    };

    const sendCrush = async (toUserId: string) => {
        try {
            const res = await fetch('/api/secret-crush/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ toUserId }),
            });
            const data = await res.json();

            if (res.ok) {
                setMyCrushIds(prev => [...prev, toUserId]);
                if (data.isMatch) {
                    setMatchAlert(toUserId);
                    // Refresh matches
                    const matchRes = await fetch('/api/secret-crush/matches');
                    if (matchRes.ok) setMatches(await matchRes.json());
                }
            }
        } catch (err) {
            console.error('Error sending crush', err);
        }
    };

    const unsendCrush = async (toUserId: string) => {
        try {
            const res = await fetch(`/api/secret-crush/unsend/${toUserId}`, { method: 'DELETE' });
            if (res.ok) {
                setMyCrushIds(prev => prev.filter(id => id !== toUserId));
            }
        } catch (err) {
            console.error('Error unsending crush', err);
        }
    };

    if (loading) {
        return <div className="flex justify-center mt-20"><Loader2 className="animate-spin text-secondary" size={32} /></div>;
    }

    const matchedUser = matchAlert ? users.find(u => u._id === matchAlert) : null;

    return (
        <div className="w-full max-w-xl mx-auto min-h-screen pb-20 pt-4 px-4">
            {/* Match Alert Modal */}
            {matchAlert && matchedUser && (
                <div className="fixed inset-0 z-[200] bg-bg-dark/95 backdrop-blur-md flex items-center justify-center p-6">
                    <Card className="max-w-sm w-full p-8 text-center border-2 border-error">
                        <PartyPopper size={64} className="text-secondary mx-auto mb-4" />
                        <h2 className="text-4xl font-black text-white mb-2 uppercase">It's a Match!</h2>
                        <p className="text-white/60 mb-6">
                            Tum dono ne ek dusre ko secretly crush kiya. Ab baat karo!
                        </p>
                        <div className="flex items-center justify-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-full bg-accent-1 overflow-hidden border-2 border-error">
                                {user?.profileImageUrl ? (
                                    <img src={user.profileImageUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white font-black text-xl">
                                        {user?.displayName.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <Heart size={24} className="text-error fill-error" />
                            <div className="w-16 h-16 rounded-full bg-accent-1 overflow-hidden border-2 border-error">
                                {matchedUser.profileImageUrl ? (
                                    <img src={matchedUser.profileImageUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white font-black text-xl">
                                        {matchedUser.displayName.charAt(0)}
                                    </div>
                                )}
                            </div>
                        </div>
                        <p className="text-secondary font-bold text-lg mb-6">{matchedUser.displayName}</p>
                        <button
                            onClick={() => setMatchAlert(null)}
                            className="w-full bg-error text-white font-bold py-3 rounded-xl hover:bg-error/80 transition-colors"
                        >
                            Noice!
                        </button>
                    </Card>
                </div>
            )}

            <h1 className="text-2xl font-black text-white tracking-tight mb-2">Secret Admirer</h1>
            <p className="text-white/40 text-sm mb-6 flex items-center gap-1.5">
                <Lock size={14} /> Sirf mutual match pe pata chalega
            </p>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setTab('browse')}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors ${tab === 'browse' ? 'bg-secondary text-primary' : 'bg-white/5 text-white/60'}`}
                >
                    Browse
                </button>
                <button
                    onClick={() => setTab('matches')}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors relative ${tab === 'matches' ? 'bg-error text-white' : 'bg-white/5 text-white/60'}`}
                >
                    Matches
                    {matches.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-bg-dark">
                            {matches.length}
                        </span>
                    )}
                </button>
            </div>

            {tab === 'browse' ? (
                <div className="grid grid-cols-2 gap-3">
                    {users.map(u => {
                        const isCrushed = myCrushIds.includes(u._id);
                        return (
                            <Card key={u._id} className="p-4 text-center relative overflow-hidden">
                                <div
                                    className="cursor-pointer"
                                    onClick={() => navigate(`/u/${u.username}`)}
                                >
                                    <div className="w-16 h-16 rounded-full bg-accent-1 overflow-hidden mx-auto mb-3 flex items-center justify-center text-white font-bold text-xl">
                                        {u.profileImageUrl ? (
                                            <img src={u.profileImageUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            u.displayName.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <p className="text-sm font-bold text-white truncate flex items-center justify-center gap-1">
                                        {u.displayName}
                                        <VerifiedBadge tier={u.verificationTier || 0} size={12} />
                                    </p>
                                    <p className="text-[10px] text-white/40 truncate">{u.classSection || `@${u.username}`}</p>
                                </div>
                                <button
                                    onClick={() => isCrushed ? unsendCrush(u._id) : sendCrush(u._id)}
                                    className={`mt-3 w-full py-2 rounded-lg font-bold text-xs transition-all ${isCrushed
                                        ? 'bg-error/20 text-error border border-error/30'
                                        : 'bg-white/5 text-white/60 hover:bg-error/10 hover:text-error border border-white/10'
                                        }`}
                                >
                                    <Heart size={14} className={`inline mr-1 ${isCrushed ? 'fill-error' : ''}`} />
                                    {isCrushed ? 'Sent' : 'Crush'}
                                </button>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <div className="space-y-3">
                    {matches.length === 0 ? (
                        <Card className="p-8 text-center">
                            <Sparkles size={40} className="text-white/20 mx-auto mb-4" />
                            <p className="text-white/50 font-bold">Koi match nahi abhi</p>
                            <p className="text-white/30 text-sm mt-2">Jab dono ek dusre ko crush karenge, tab yahan dikhega</p>
                        </Card>
                    ) : (
                        matches.map((m: any) => (
                            <Card
                                key={m._id}
                                className="p-4 flex items-center gap-4 cursor-pointer hover:border-error/30 transition-colors border-l-4 border-l-error"
                                onClick={() => navigate(`/u/${m.username}`)}
                            >
                                <div className="w-12 h-12 rounded-full bg-accent-1 overflow-hidden flex-shrink-0 flex items-center justify-center text-white font-bold">
                                    {m.profileImageUrl ? (
                                        <img src={m.profileImageUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        m.displayName.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-white flex items-center gap-1">
                                        {m.displayName}
                                        <VerifiedBadge tier={m.verificationTier || 0} size={14} />
                                    </p>
                                    <p className="text-xs text-error font-bold">Mutual Crush!</p>
                                </div>
                                <Heart size={20} className="text-error fill-error" />
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};
