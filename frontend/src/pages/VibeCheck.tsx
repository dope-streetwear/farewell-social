import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

interface Poll {
    id: string;
    question: string;
    options: { _id: string; displayName: string; profileImageUrl: string }[];
}

export const VibeCheck: React.FC = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [polls, setPolls] = useState<Poll[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [voted, setVoted] = useState(false);
    const [completed, setCompleted] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        const fetchPolls = async () => {
            try {
                const res = await fetch('/api/vibes/polls');
                if (res.ok) {
                    const data = await res.json();
                    if (data.polls && data.polls.length > 0) {
                        setPolls(data.polls);
                    } else {
                        setCompleted(true);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch polls', err);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchPolls();
        }
    }, [user]);

    const handleVote = async (targetUserId: string, question: string) => {
        if (voted) return;
        setVoted(true);

        try {
            await fetch('/api/vibes/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId, question })
            });
        } catch (err) {
            console.error('Error voting', err);
        }

        setTimeout(() => {
            if (currentIndex < polls.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setVoted(false);
            } else {
                setCompleted(true);
            }
        }, 1000);
    };

    if (loading || authLoading) {
        return <div className="min-h-screen pt-24 text-center text-white/50">Loading vibes...</div>;
    }

    if (completed) {
        return (
            <div className="w-full max-w-md mx-auto min-h-screen pt-24 px-4 text-center">
                <CheckCircle2 size={64} className="text-secondary mx-auto mb-6" />
                <h1 className="text-3xl font-black text-white mb-2">You're all out of vibes!</h1>
                <p className="text-white/60 mb-8">Come back later to vote on more people and spread the love.</p>
                <Button variant="primary" onClick={() => navigate('/feed')}>Back to Feed</Button>
            </div>
        );
    }

    const currentPoll = polls[currentIndex];

    if (!currentPoll) return null;

    return (
        <div className="w-full max-w-md mx-auto min-h-[calc(100vh-80px)] pt-12 pb-24 px-4 flex flex-col items-center justify-center">

            <div className="flex items-center gap-2 mb-8 text-secondary font-black tracking-widest uppercase">
                <Flame size={20} />
                <span>Vibe Check {currentIndex + 1}/{polls.length}</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-black text-white text-center mb-10 leading-tight">
                {currentPoll.question}
            </h2>

            <div className="grid grid-cols-2 gap-4 w-full perspective-1000">
                {currentPoll.options.map((option) => (
                    <Card
                        key={option._id}
                        className={`p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 transform-style-3d ${voted ? 'opacity-50 pointer-events-none' : 'hover:-translate-y-2 hover:shadow-[0_10px_40px_rgba(var(--secondary),0.3)] border-2 border-transparent hover:border-secondary'}`}
                        onClick={() => handleVote(option._id, currentPoll.question)}
                    >
                        <div className="w-20 h-20 rounded-full bg-bg-dark border border-white/10 mb-4 overflow-hidden">
                            {option.profileImageUrl ? (
                                <img src={option.profileImageUrl} alt={option.displayName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-2xl font-black text-secondary">
                                    {option.displayName.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <span className="font-bold text-white max-w-full truncate">{option.displayName}</span>
                    </Card>
                ))}
            </div>

            {voted && (
                <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <span className="text-xl font-bold text-accent-1 flex items-center gap-2">
                        <Flame fill="currentColor" /> Flame sent!
                    </span>
                </div>
            )}
        </div>
    );
};
