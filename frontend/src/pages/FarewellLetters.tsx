import React, { useState, useEffect } from 'react';
import { Mail, Send, PenTool, Globe, Lock, Search } from 'lucide-react';
import { Button } from '../components/ui/Button';

// Mock types
interface User {
    _id: string;
    username: string;
    displayName: string;
    profileImageUrl?: string;
}

interface Letter {
    _id: string;
    authorId: User;
    recipientId: User;
    content: string;
    isPublic: boolean;
    paperStyle: string;
    createdAt: string;
}

export default function FarewellLetters() {
    const [view, setView] = useState<'feed' | 'me' | 'write'>('feed');
    const [letters, setLetters] = useState<Letter[]>([]);
    const [myLetters, setMyLetters] = useState<{ received: Letter[], sent: Letter[] }>({ received: [], sent: [] });
    const [loading, setLoading] = useState(true);

    // Form states
    const [recipient, setRecipient] = useState('');
    const [content, setContent] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    const [paperStyle, setPaperStyle] = useState('classic');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const fetchFeed = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/letters/feed');
            if (res.ok) {
                const data = await res.json();
                setLetters(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyLetters = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/letters/me');
            if (res.ok) {
                const data = await res.json();
                setMyLetters(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (view === 'feed') fetchFeed();
        if (view === 'me') fetchMyLetters();
    }, [view]);

    const handleWrite = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            const res = await fetch('/api/letters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipientUsername: recipient, content, isPublic, paperStyle })
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to send letter');
            }

            // Success
            setRecipient('');
            setContent('');
            setView('me'); // Take them to their sent items
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const getPaperClasses = (style: string) => {
        switch (style) {
            case 'parchment':
                return 'bg-[#f4e4bc] text-amber-950 font-serif border border-amber-900/20 shadow-[0_4px_15px_rgba(217,160,91,0.3)]';
            case 'ruled':
                return 'bg-white text-blue-900 font-mono bg-[linear-gradient(transparent_95%,#e5e7eb_95%)] bg-[length:100%_2rem] leading-[2rem] border border-gray-200 shadow-md';
            case 'polaroid':
                return 'bg-white text-gray-800 font-sans p-4 pb-12 border border-gray-100 shadow-[0_10px_20px_rgba(0,0,0,0.1)] rounded-sm rotate-1';
            case 'classic':
            default:
                return 'bg-[#fdfbf7] text-gray-800 font-serif border-l-4 border-l-red-400 shadow-md';
        }
    };

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const renderLetter = (letter: Letter) => (
        <div key={letter._id} className={`w-full max-w-2xl mx-auto p-8 md:p-12 mb-10 transition-transform hover:-translate-y-1 ${getPaperClasses(letter.paperStyle)}`}>
            <div className="flex justify-between items-start mb-8 opacity-70 text-sm">
                <div>
                    <span className="block mb-1 tracking-widest uppercase text-xs">To:</span>
                    <span className="font-bold text-lg">@{letter.recipientId.username}</span>
                </div>
                <div className="text-right">
                    <span className="block mb-1 tracking-widest uppercase text-xs">Date:</span>
                    <span className="italic">{formatDate(letter.createdAt)}</span>
                </div>
            </div>

            <div className="text-lg md:text-xl whitespace-pre-wrap leading-relaxed mb-12">
                {letter.content}
            </div>

            <div className="flex justify-end opacity-80 text-sm">
                <div className="text-right">
                    <span className="block mb-1 tracking-widest uppercase text-xs">From:</span>
                    <span className="font-bold text-xl drop-shadow-sm tabular-nums" style={(letter.paperStyle === 'parchment' || letter.paperStyle === 'classic') ? { fontFamily: '"Caveat", cursive', fontSize: '1.75rem' } : {}}>
                        {letter.authorId.displayName} <span className="text-sm font-normal">(@{letter.authorId.username})</span>
                    </span>
                </div>
            </div>

            {/* Stamp / Seal detail */}
            <div className={`absolute bottom-6 left-8 opacity-20 `}>
                <Globe size={48} strokeWidth={1} />
            </div>
        </div>
    );

    return (
        <div className="min-h-screen pt-24 pb-20 px-4 md:px-8 bg-black">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-10 text-center animate-fade-in-up">
                    <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-600 font-serif">
                        Alvida Khat
                    </h1>
                    <p className="text-amber-200/60 text-lg uppercase tracking-widest">
                        Farewell Letters
                    </p>
                </div>

                {/* Navigation Tabs */}
                <div className="flex flex-wrap justify-center gap-4 mb-12 border-b border-white/10 pb-4">
                    <button
                        onClick={() => setView('feed')}
                        className={`px-6 py-2 rounded-full font-bold transition-all ${view === 'feed' ? 'bg-amber-500 text-black' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                    >
                        <Globe className="inline mr-2" size={18} /> Public Feed
                    </button>
                    <button
                        onClick={() => setView('me')}
                        className={`px-6 py-2 rounded-full font-bold transition-all ${view === 'me' ? 'bg-amber-500 text-black' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                    >
                        <Mail className="inline mr-2" size={18} /> My Letters
                    </button>
                    <button
                        onClick={() => setView('write')}
                        className={`px-6 py-2 rounded-full font-bold transition-all ${view === 'write' ? 'bg-white text-black shadow-[0_0_15px_white]' : 'text-primary hover:text-white border border-primary/30 hover:bg-primary/10'}`}
                    >
                        <PenTool className="inline mr-2" size={18} /> Write a Letter
                    </button>
                </div>

                {/* Content Views */}
                <div className="animate-fade-in-up">
                    {view === 'feed' && (
                        <div className="space-y-4">
                            {loading ? (
                                <p className="text-center text-white/40">Fetching the archives...</p>
                            ) : letters.length === 0 ? (
                                <p className="text-center text-white/40">No public letters yet. Be the first to write one.</p>
                            ) : (
                                letters.map(renderLetter)
                            )}
                        </div>
                    )}

                    {view === 'me' && (
                        <div>
                            {loading ? (
                                <p className="text-center text-white/40">Checking your mailbox...</p>
                            ) : (
                                <div className="space-y-16">
                                    <section>
                                        <h2 className="text-2xl font-bold mb-6 text-white/80 border-b border-white/10 pb-2">Letters To You</h2>
                                        {myLetters.received.length === 0 ? (
                                            <p className="text-white/40 italic">You haven't received any letters yet.</p>
                                        ) : myLetters.received.map(renderLetter)}
                                    </section>

                                    <section>
                                        <h2 className="text-2xl font-bold mb-6 text-white/80 border-b border-white/10 pb-2">Letters You Wrote</h2>
                                        {myLetters.sent.length === 0 ? (
                                            <p className="text-white/40 italic">You haven't written any letters yet.</p>
                                        ) : myLetters.sent.map(renderLetter)}
                                    </section>
                                </div>
                            )}
                        </div>
                    )}

                    {view === 'write' && (
                        <div className="max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-3xl p-6 md:p-10 backdrop-blur-md">
                            <h2 className="text-2xl font-bold text-white mb-6">Draft a Farewell Letter</h2>
                            {error && <p className="text-red-400 mb-4 bg-red-400/10 p-3 rounded-lg">{error}</p>}
                            <form onSubmit={handleWrite} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-white/60 mb-2 uppercase tracking-wider">To (Username)</label>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                                        <input
                                            type="text"
                                            required
                                            value={recipient}
                                            onChange={(e) => setRecipient(e.target.value)}
                                            placeholder="e.g. aditi"
                                            className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-amber-400 transition-colors"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-white/60 mb-2 uppercase tracking-wider">Your Letter</label>
                                    <textarea
                                        required
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        rows={8}
                                        placeholder="Dear Priya, from the first day in 6th grade when you..."
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder-white/20 focus:outline-none focus:border-amber-400 transition-colors resize-y font-serif leading-relaxed"
                                    />
                                    <p className="text-xs tracking-widest uppercase text-white/30 text-right mt-2">No Character Limit</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-white/60 mb-2 uppercase tracking-wider">Paper Style</label>
                                        <select
                                            value={paperStyle}
                                            onChange={(e) => setPaperStyle(e.target.value)}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-400 transition-colors appearance-none"
                                        >
                                            <option value="classic">Classic Minimal</option>
                                            <option value="parchment">Vintage Parchment</option>
                                            <option value="polaroid">Polaroid Memory</option>
                                            <option value="ruled">Ruled Notebook</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-white/60 mb-2 uppercase tracking-wider">Visibility</label>
                                        <div className="flex bg-black/50 border border-white/10 rounded-xl p-1">
                                            <button
                                                type="button"
                                                onClick={() => setIsPublic(true)}
                                                className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${isPublic ? 'bg-white/10 text-white' : 'text-white/40'}`}
                                            >
                                                <Globe size={16} /> Public
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setIsPublic(false)}
                                                className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${!isPublic ? 'bg-amber-500/20 text-amber-400' : 'text-white/40'}`}
                                            >
                                                <Lock size={16} /> Private
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="w-full py-4 text-lg bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Sealing envelope...' : 'Send Farewell Letter'}
                                    <Send className="inline ml-2" size={20} />
                                </Button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
