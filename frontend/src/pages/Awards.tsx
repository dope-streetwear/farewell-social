import { useState, useEffect } from 'react';
import { Trophy, Search, Heart, DoorOpen, Globe, Smile, Moon } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { api } from '../utils/api';

// Utility to render Lucide icons dynamically from string names stored in DB
const IconRenderer = ({ name, className }: { name: string, className?: string }) => {
    switch (name) {
        case 'heart': return <Heart className={className} />;
        case 'door-open': return <DoorOpen className={className} />;
        case 'globe': return <Globe className={className} />;
        case 'smile': return <Smile className={className} />;
        case 'moon': return <Moon className={className} />;
        default: return <Trophy className={className} />;
    }
};

interface UserRef {
    _id: string;
    username: string;
    displayName: string;
    profileImageUrl?: string;
}

interface Superlative {
    _id: string;
    title: string;
    description: string;
    icon: string;
    status: 'VOTING' | 'REVEALED';
    winnerId?: UserRef;
}

export default function Awards() {
    const [superlatives, setSuperlatives] = useState<Superlative[]>([]);
    const [myVotes, setMyVotes] = useState<Record<string, UserRef>>({});
    const [loading, setLoading] = useState(true);

    // Modal State
    const [activeAward, setActiveAward] = useState<Superlative | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserRef[]>([]);
    const [searching, setSearching] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await api('/api/superlatives');
            setSuperlatives(data.superlatives);
            setMyVotes(data.myVotes);
        } catch (e) {
            console.error('Failed to fetch superlatives', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Debounced Search
    useEffect(() => {
        if (!searchQuery.trim() || !activeAward) {
            setSearchResults([]);
            return;
        }

        const delayFn = setTimeout(async () => {
            setSearching(true);
            try {
                const data = await api(`/api/superlatives/search?q=${encodeURIComponent(searchQuery)}`);
                setSearchResults(data);
            } catch (e) { }
            finally { setSearching(false); }
        }, 300);

        return () => clearTimeout(delayFn);
    }, [searchQuery, activeAward]);

    const castVote = async (nomineeId: string) => {
        if (!activeAward) return;
        try {
            await api(`/api/superlatives/${activeAward._id}/vote`, {
                method: 'POST',
                body: JSON.stringify({ nomineeId })
            });
            setActiveAward(null);
            setSearchQuery('');
            fetchData();
        } catch (e) {
            console.error('Failed to vote', e);
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-20 px-4 md:px-8 max-w-4xl mx-auto">
            <div className="text-center mb-12 animate-fade-in-up">
                <Trophy size={48} className="text-yellow-400 mx-auto mb-4 drop-shadow-lg" />
                <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-600">
                    Batch Ka Award
                </h1>
                <p className="text-white/60">The official farewell superlatives. Cast your votes wisely.</p>
            </div>

            {loading ? (
                <p className="text-center text-white/40">Preparing awards...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {superlatives.map((award, idx) => {
                        const hasVoted = myVotes[award._id];

                        return (
                            <div
                                key={award._id}
                                className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group animate-fade-in-up"
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                                <div className="flex items-start justify-between mb-4 relative z-10">
                                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white">
                                        <IconRenderer name={award.icon} className="w-6 h-6" />
                                    </div>
                                    {award.status === 'REVEALED' ? (
                                        <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full border border-yellow-500/30">
                                            Winner Revealed
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-full border border-blue-500/30">
                                            Voting Open
                                        </span>
                                    )}
                                </div>

                                <h3 className="text-xl font-bold text-white mb-2">{award.title}</h3>
                                <p className="text-sm text-white/60 mb-6">{award.description}</p>

                                {award.status === 'REVEALED' && award.winnerId ? (
                                    <div className="bg-gradient-to-r from-yellow-500/20 to-amber-600/20 border border-yellow-500/30 rounded-xl p-4 flex items-center gap-4">
                                        <div className="relative">
                                            <Trophy size={16} className="absolute -top-2 -right-2 text-yellow-400 z-10 animate-pulse" />
                                            {award.winnerId.profileImageUrl ? (
                                                <img src={award.winnerId.profileImageUrl} className="w-12 h-12 rounded-full ring-2 ring-yellow-400 object-cover" alt="" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-xl ring-2 ring-yellow-400">
                                                    {award.winnerId.displayName[0]}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-xs text-yellow-400/80 font-bold uppercase tracking-wider mb-1">Winner</p>
                                            <p className="font-bold text-white leading-tight">{award.winnerId.displayName}</p>
                                            <p className="text-xs text-white/50">@{award.winnerId.username}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        {hasVoted ? (
                                            <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
                                                {hasVoted.profileImageUrl ? (
                                                    <img src={hasVoted.profileImageUrl} className="w-8 h-8 rounded-full" alt="" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs">
                                                        {hasVoted.displayName[0]}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-white/40">You voted for</p>
                                                    <p className="text-sm font-bold text-white truncate">{hasVoted.displayName}</p>
                                                </div>
                                                <Button size="sm" variant="secondary" onClick={() => setActiveAward(award)}>Change</Button>
                                            </div>
                                        ) : (
                                            <Button className="w-full" onClick={() => setActiveAward(award)}>
                                                Nominate Someone
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Voting Modal */}
            {activeAward && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-6 border-b border-white/10">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-white">Nominate: {activeAward.title}</h3>
                                    <p className="text-sm text-white/60">{activeAward.description}</p>
                                </div>
                                <button onClick={() => { setActiveAward(null); setSearchQuery(''); }} className="text-white/40 hover:text-white">✕</button>
                            </div>

                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by name or username..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-black/50 border border-white/20 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-accent-2 text-white"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="p-2 overflow-y-auto flex-1 custom-scrollbar">
                            {searching ? (
                                <p className="text-center py-8 text-white/40">Searching classmates...</p>
                            ) : searchResults.length > 0 ? (
                                <div className="space-y-1">
                                    {searchResults.map(user => (
                                        <button
                                            key={user._id}
                                            onClick={() => castVote(user._id)}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left"
                                        >
                                            {user.profileImageUrl ? (
                                                <img src={user.profileImageUrl} className="w-10 h-10 rounded-full object-cover" alt="" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold">
                                                    {user.displayName[0]}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-bold text-white">{user.displayName}</p>
                                                <p className="text-sm text-white/50">@{user.username}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : searchQuery.length > 0 ? (
                                <p className="text-center py-8 text-white/40">No classmates found.</p>
                            ) : (
                                <p className="text-center py-8 text-white/30 text-sm px-8">Start typing the name of the classmate you want to nominate for this award.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
