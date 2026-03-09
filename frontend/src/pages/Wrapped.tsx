import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { VerifiedBadge } from '../components/ui/VerifiedBadge';
import { Loader2, ChevronRight, ChevronLeft, Heart, MessageCircle, Flame, Send, FileText, Eye } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface WrappedData {
    username: string;
    displayName: string;
    profileImageUrl?: string;
    totalPosts: number;
    totalLikesReceived: number;
    totalCommentsMade: number;
    totalCommentsReceived: number;
    totalNgls: number;
    flames: number;
    mostLikedPost: { post: any; likes: number } | null;
    topCommenter: { user: any; count: number } | null;
    topLiker: { user: any; count: number } | null;
    joinDate: string;
}

const SLIDE_COLORS = [
    'from-purple-900 via-violet-800 to-indigo-900',
    'from-rose-900 via-pink-800 to-red-900',
    'from-emerald-900 via-teal-800 to-cyan-900',
    'from-amber-900 via-orange-800 to-yellow-900',
    'from-blue-900 via-indigo-800 to-violet-900',
    'from-fuchsia-900 via-pink-800 to-rose-900',
];

export const Wrapped: React.FC = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [data, setData] = useState<WrappedData | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [started, setStarted] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) navigate('/login');
    }, [user, authLoading, navigate]);

    useEffect(() => {
        if (user) fetchWrapped();
    }, [user]);

    const fetchWrapped = async () => {
        try {
            const res = await fetch('/api/wrapped/me');
            if (res.ok) setData(await res.json());
        } catch (err) {
            console.error('Error fetching wrapped', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center mt-20"><Loader2 className="animate-spin text-secondary" size={32} /></div>;
    }

    if (!data) {
        return <div className="text-center mt-20 text-white/50 font-bold">Wrapped data nahi mila</div>;
    }

    const slides = [
        // Slide 0: Intro
        () => (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-24 h-24 rounded-full bg-white/10 overflow-hidden mb-6 border-2 border-secondary">
                    {data.profileImageUrl ? (
                        <img src={data.profileImageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl font-black text-white">
                            {data.displayName.charAt(0)}
                        </div>
                    )}
                </div>
                <h1 className="text-4xl font-black text-white mb-2 uppercase tracking-tight">
                    {data.displayName.split(' ')[0]}'s
                </h1>
                <h2 className="text-6xl font-black text-secondary mb-4 tracking-tighter">WRAPPED</h2>
                <p className="text-white/60 text-lg">Tera poora safar, ek nazar mein</p>
            </div>
        ),

        // Slide 1: Posts stats
        () => (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <FileText size={48} className="text-secondary mb-4" />
                <p className="text-white/60 text-lg mb-2">Tune daale</p>
                <h2 className="text-8xl font-black text-white mb-2">{data.totalPosts}</h2>
                <p className="text-2xl font-bold text-secondary">Posts</p>
                <p className="text-white/40 mt-4 text-sm">Har ek mein ek yaad thi</p>
            </div>
        ),

        // Slide 2: Likes received
        () => (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Heart size={48} className="text-error fill-error mb-4" />
                <p className="text-white/60 text-lg mb-2">Logo ne tujhe diye</p>
                <h2 className="text-8xl font-black text-white mb-2">{data.totalLikesReceived}</h2>
                <p className="text-2xl font-bold text-error">Likes</p>
                {data.totalLikesReceived > 50 && (
                    <p className="text-white/40 mt-4 text-sm">Bhai tu toh famous hai!</p>
                )}
            </div>
        ),

        // Slide 3: Comments & flames
        () => (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="flex gap-8 mb-6">
                    <div className="text-center">
                        <MessageCircle size={32} className="text-accent-2 mx-auto mb-2" />
                        <h3 className="text-5xl font-black text-white">{data.totalCommentsMade}</h3>
                        <p className="text-accent-2 font-bold text-sm mt-1">Bakwaas ki</p>
                    </div>
                    <div className="text-center">
                        <Flame size={32} className="text-secondary mx-auto mb-2" />
                        <h3 className="text-5xl font-black text-white">{data.flames}</h3>
                        <p className="text-secondary font-bold text-sm mt-1">Flames mile</p>
                    </div>
                </div>
                <div className="mt-4">
                    <Eye size={32} className="text-accent-1 mx-auto mb-2" />
                    <h3 className="text-5xl font-black text-white">{data.totalNgls}</h3>
                    <p className="text-accent-1 font-bold text-sm mt-1">NGL posts</p>
                </div>
            </div>
        ),

        // Slide 4: Top fan
        () => (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <p className="text-white/60 text-lg mb-6">Tera sabse bada fan</p>
                {data.topLiker ? (
                    <>
                        <div className="w-20 h-20 rounded-full bg-accent-1 overflow-hidden mb-4 border-2 border-secondary">
                            {data.topLiker.user.profileImageUrl ? (
                                <img src={data.topLiker.user.profileImageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white">
                                    {data.topLiker.user.displayName.charAt(0)}
                                </div>
                            )}
                        </div>
                        <h2 className="text-3xl font-black text-white flex items-center gap-2">
                            {data.topLiker.user.displayName}
                            <VerifiedBadge tier={data.topLiker.user.verificationTier || 0} />
                        </h2>
                        <p className="text-secondary font-bold text-xl mt-2">{data.topLiker.count} likes diye tujhe</p>
                    </>
                ) : (
                    <p className="text-white/40 text-lg">Abhi tak koi fan nahi mila</p>
                )}

                {data.topCommenter && (
                    <div className="mt-8 pt-6 border-t border-white/10">
                        <p className="text-white/40 text-sm mb-2">Sabse zyada bakwaas ki</p>
                        <p className="text-white font-bold flex items-center gap-1 justify-center">
                            {data.topCommenter.user.displayName}
                            <VerifiedBadge tier={data.topCommenter.user.verificationTier || 0} size={14} />
                            <span className="text-accent-2 ml-1">({data.topCommenter.count} comments)</span>
                        </p>
                    </div>
                )}
            </div>
        ),

        // Slide 5: Outro
        () => (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <h2 className="text-5xl font-black text-white mb-4 tracking-tight uppercase">That's a Wrap!</h2>
                <p className="text-white/60 text-lg mb-8">
                    Joined {new Date(data.joinDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                </p>
                <p className="text-secondary text-xl font-bold mb-8">NarayanaSOCIAL pe tu legend hai</p>
                <Button
                    variant="primary"
                    className="px-8 py-4 text-lg"
                    onClick={() => {
                        if (navigator.share) {
                            navigator.share({
                                title: `${data.displayName}'s Narayana Wrapped`,
                                text: `${data.totalPosts} posts, ${data.totalLikesReceived} likes, ${data.flames} flames! Check out my Narayana Wrapped!`,
                                url: window.location.origin + '/wrapped'
                            });
                        }
                    }}
                >
                    <Send size={18} className="mr-2" /> Share Wrapped
                </Button>
            </div>
        ),
    ];

    const next = () => setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1));
    const prev = () => setCurrentSlide(prev => Math.max(prev - 1, 0));

    if (!started) {
        return (
            <div className="fixed inset-0 z-[100] bg-gradient-to-br from-purple-950 via-bg-dark to-indigo-950 flex items-center justify-center">
                <div className="text-center p-8">
                    <h1 className="text-6xl font-black text-white mb-2 tracking-tighter uppercase">NARAYANA</h1>
                    <h2 className="text-7xl font-black text-secondary mb-8 tracking-tighter">WRAPPED</h2>
                    <p className="text-white/60 text-lg mb-8">Dekh tera poora safar kya raha is platform pe</p>
                    <Button variant="primary" className="px-12 py-5 text-xl" onClick={() => setStarted(true)}>
                        Shuru Karo
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className={`fixed inset-0 z-[100] bg-gradient-to-br ${SLIDE_COLORS[currentSlide % SLIDE_COLORS.length]} flex flex-col transition-all duration-500`}>
            {/* Progress dots */}
            <div className="flex gap-1.5 p-4 pt-6 justify-center">
                {slides.map((_, i) => (
                    <div
                        key={i}
                        className={`h-1 rounded-full transition-all duration-300 ${i === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/30'}`}
                    />
                ))}
            </div>

            {/* Slide content */}
            <div className="flex-1 flex items-center justify-center">
                {slides[currentSlide]()}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between p-6">
                <button
                    onClick={prev}
                    className={`text-white p-3 rounded-full hover:bg-white/10 ${currentSlide === 0 ? 'invisible' : ''}`}
                >
                    <ChevronLeft size={28} />
                </button>
                <button
                    onClick={currentSlide === slides.length - 1 ? () => navigate('/feed') : next}
                    className="text-white p-3 rounded-full hover:bg-white/10"
                >
                    {currentSlide === slides.length - 1 ? (
                        <span className="text-sm font-bold px-4">Done</span>
                    ) : (
                        <ChevronRight size={28} />
                    )}
                </button>
            </div>

            {/* Tap zones (mobile) */}
            <button className="absolute left-0 top-16 w-1/3 bottom-20 z-10 md:hidden" onClick={prev} />
            <button className="absolute right-0 top-16 w-1/3 bottom-20 z-10 md:hidden" onClick={next} />

            {/* Close button */}
            <button
                onClick={() => navigate(-1)}
                className="absolute top-6 right-4 text-white/50 hover:text-white text-sm font-bold"
            >
                Skip
            </button>
        </div>
    );
};
