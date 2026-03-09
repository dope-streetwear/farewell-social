import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function ConfessionRoulette() {
    const navigate = useNavigate();

    const [confession, setConfession] = useState<any>(null);
    const [loadingRead, setLoadingRead] = useState(true);
    const [readError, setReadError] = useState('');
    const [timeLeft, setTimeLeft] = useState<{ minutes: number, seconds: number } | null>(null);

    // Write state
    const [isWriting, setIsWriting] = useState(false);
    const [content, setContent] = useState('');
    const [gradient, setGradient] = useState('from-pink-500 to-rose-500');
    const [loadingWrite, setLoadingWrite] = useState(false);
    const [writeSuccess, setWriteSuccess] = useState('');
    const [writeError, setWriteError] = useState('');

    const gradients = [
        'from-pink-500 to-rose-500',
        'from-purple-500 to-indigo-500',
        'from-blue-500 to-cyan-500',
        'from-emerald-400 to-teal-500',
        'from-orange-400 to-red-500',
        'from-gray-700 to-gray-900'
    ];

    const fetchActiveConfession = async () => {
        setLoadingRead(true);
        setReadError('');

        try {
            const res = await fetch('/api/confessions/roulette');
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to fetch confession');
            }
            const data = await res.json();
            setConfession(data);
        } catch (err: any) {
            setReadError(err.message);
            setConfession(null);
        } finally {
            setLoadingRead(false);
        }
    };

    // Initial fetch on mount
    React.useEffect(() => {
        fetchActiveConfession();
    }, []);

    // Countdown Timer Logic
    React.useEffect(() => {
        if (!confession || !confession.featuredUntil) {
            setTimeLeft(null);
            return;
        }

        const calculateTimeLeft = () => {
            const difference = +new Date(confession.featuredUntil) - +new Date();
            if (difference > 0) {
                return {
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                };
            }
            return { minutes: 0, seconds: 0 };
        };

        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            const newTime = calculateTimeLeft();
            setTimeLeft(newTime);

            // Time's up! Refetch for the next confession
            if (newTime.minutes === 0 && newTime.seconds === 0) {
                clearInterval(timer);
                fetchActiveConfession();
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [confession]);

    const handleSubmitConfession = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        setLoadingWrite(true);
        setWriteError('');
        setWriteSuccess('');

        try {
            const res = await fetch('/api/confessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, backgroundGradient: gradient })
            });

            if (!res.ok) throw new Error('Failed to submit confession');

            setWriteSuccess('Confession dropped anonymously! 🤫');
            setContent('');
            setTimeout(() => {
                setIsWriting(false);
                setWriteSuccess('');
            }, 2000);

        } catch (err: any) {
            setWriteError(err.message);
        } finally {
            setLoadingWrite(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-white p-6 pb-24 font-sans">
            <header className="flex items-center justify-between mb-8 max-w-md mx-auto">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black leading-tight flex items-center gap-2">
                            Confessions 🎯
                        </h1>
                        <p className="text-xs text-white/50 font-bold uppercase tracking-wider">Batch Roulette</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsWriting(!isWriting)}
                    className="p-2 bg-secondary/10 text-secondary rounded-full hover:bg-secondary/20 transition-colors"
                >
                    <Send size={20} />
                </button>
            </header>

            <div className="max-w-md mx-auto">
                {isWriting ? (
                    <div className="animate-fade-in-up">
                        <h2 className="text-xl font-bold mb-4">Drop a Confession</h2>
                        <form onSubmit={handleSubmitConfession} className="space-y-4">
                            <div className={`p-6 rounded-3xl bg-gradient-to-br ${gradient} transition-colors duration-300`}>
                                <textarea
                                    className="w-full bg-transparent text-white placeholder:text-white/50 resize-none outline-none font-medium text-lg min-h-[150px]"
                                    placeholder="I've always wanted to say..."
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    maxLength={500}
                                />
                                <div className="text-right text-xs text-white/50 font-bold mt-2">
                                    {content.length}/500
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Vibe Gradient</label>
                                <div className="flex gap-2 flex-wrap">
                                    {gradients.map((g) => (
                                        <button
                                            key={g}
                                            type="button"
                                            onClick={() => setGradient(g)}
                                            className={`w-8 h-8 rounded-full bg-gradient-to-br ${g} ${gradient === g ? 'ring-2 ring-white scale-110' : 'opacity-50 hover:opacity-100'} transition-all`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {writeError && <div className="text-error text-sm font-bold flex items-center gap-1"><AlertCircle size={16} /> {writeError}</div>}
                            {writeSuccess && <div className="text-success text-sm font-bold flex items-center gap-1"><Sparkles size={16} /> {writeSuccess}</div>}

                            <Button type="submit" variant="primary" className="w-full py-4 text-lg" disabled={loadingWrite || !content.trim()}>
                                {loadingWrite ? 'Sending secretly...' : 'Submit Anonymously'}
                            </Button>
                        </form>
                    </div>
                ) : (
                    <div className="flex flex-col items-center animate-fade-in-up">
                        <div className="text-center mb-8">
                            <h2 className="text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-orange-400 uppercase tracking-widest flex items-center justify-center gap-3">
                                <span>Active</span>
                                <AlertCircle size={28} className="text-pink-500 inline-block animate-pulse" />
                                <span>Secret</span>
                            </h2>
                            {timeLeft && (
                                <p className="text-lg font-bold text-white bg-white/10 px-4 py-1 rounded-full inline-flex tracking-widest shadow-inner">
                                    {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                                </p>
                            )}
                            <p className="text-white/50 text-xs uppercase font-bold mt-3 tracking-wider">Before it disappears forever</p>
                        </div>

                        <div className="w-full relative mb-12 flex justify-center perspective-1000">
                            {loadingRead && !confession ? (
                                <div className="w-full max-w-sm aspect-[4/3] bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center shadow-2xl animate-pulse">
                                    <RefreshCw className="animate-spin text-secondary" size={48} />
                                </div>
                            ) : confession ? (
                                <div className={`w-full max-w-sm aspect-[4/3] rounded-3xl p-8 flex flex-col justify-between text-center shadow-[0_0_50px_rgba(236,72,153,0.3)] bg-gradient-to-br ${confession.backgroundGradient} animate-in zoom-in duration-500 relative overflow-hidden group border border-white/20`}>
                                    <div className="absolute top-0 left-0 w-full h-1 bg-white/20">
                                        {timeLeft && (
                                            <div
                                                className="h-full bg-white transition-all duration-1000 ease-linear shadow-[0_0_10px_white]"
                                                style={{ width: `${((timeLeft.minutes * 60 + timeLeft.seconds) / 300) * 100}%` }}
                                            />
                                        )}
                                    </div>
                                    <div className="absolute top-4 right-4 text-white/50 animate-pulse">
                                        <Sparkles size={24} />
                                    </div>
                                    <div className="flex-1 flex items-center justify-center -mt-4">
                                        <p className="text-2xl md:text-3xl font-black text-white leading-tight drop-shadow-md">
                                            "{confession.content}"
                                        </p>
                                    </div>
                                    <div className="flex justify-center">
                                        <span className="text-white/40 font-bold uppercase tracking-widest text-xs tracking-widest break-words w-full">Anonymous Submission</span>
                                    </div>
                                </div>
                            ) : readError ? (
                                <div className="w-full max-w-sm aspect-[4/3] bg-white/5 border border-white/10 rounded-3xl flex flex-col items-center justify-center p-6 text-center text-white/60">
                                    <h3 className="text-xl font-black text-white mb-2">The Queue is Empty</h3>
                                    <p className="mb-6">{readError}</p>
                                    <Button onClick={() => setIsWriting(true)} variant="primary">Drop a Secret</Button>
                                </div>
                            ) : null}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
