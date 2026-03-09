import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Music, Plus, Search, ThumbsUp, Play, Pause } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface Song {
    _id: string;
    trackId: string;
    title: string;
    artist: string;
    albumArtUrl: string;
    previewUrl?: string;
    submittedBy: {
        _id: string;
        username: string;
        displayName: string;
        profileImageUrl?: string;
    };
    voters: string[];
    voteCount: number;
}

export default function Playlist() {
    const { user: currentUser } = useAuth();
    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);

    // Add Song Modal State
    const [isAddMode, setIsAddMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);

    // Audio Playback State
    const [playingUrl, setPlayingUrl] = useState<string | null>(null);
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

    const fetchPlaylist = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/playlist');
            if (res.ok) {
                const data = await res.json();
                setSongs(data);
            }
        } catch (e) {
            console.error('Failed to fetch playlist', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlaylist();

        // Cleanup audio on unmount
        return () => {
            if (audioElement) {
                audioElement.pause();
                audioElement.src = '';
            }
        };
    }, []);

    const togglePlay = (url: string | undefined) => {
        if (!url) return;

        if (playingUrl === url && audioElement) {
            audioElement.pause();
            setPlayingUrl(null);
        } else {
            if (audioElement) {
                audioElement.pause();
            }
            const newAudio = new Audio(url);
            newAudio.play();
            newAudio.onended = () => setPlayingUrl(null);
            setAudioElement(newAudio);
            setPlayingUrl(url);
        }
    };

    const handleVote = async (songId: string) => {
        try {
            const res = await fetch(`/api/playlist/vote/${songId}`, { method: 'POST' });
            if (res.ok) {
                fetchPlaylist(); // Simple refetch to update counts and sort order
            }
        } catch (e) {
            console.error('Failed to vote', e);
        }
    };

    const searchTunes = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setSearching(true);
        try {
            const res = await fetch(`/api/music/search?q=${encodeURIComponent(searchQuery)}`);
            if (res.ok) {
                const data = await res.json();
                setSearchResults(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSearching(false);
        }
    };

    const addSong = async (track: any) => {
        try {
            const res = await fetch('/api/playlist/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    trackId: track.trackId,
                    title: track.title,
                    artist: track.artist,
                    albumArtUrl: track.albumArtUrl,
                    previewUrl: track.previewUrl
                })
            });
            if (res.ok) {
                setIsAddMode(false);
                setSearchQuery('');
                setSearchResults([]);
                fetchPlaylist();
            } else {
                const data = await res.json();
                alert(data.message);
            }
        } catch (e) {
            console.error('Failed to add song', e);
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-20 px-4 md:px-8 max-w-4xl mx-auto">
            <div className="text-center mb-10 animate-fade-in-up">
                <Music size={48} className="text-accent-2 mx-auto mb-4" />
                <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-r from-accent-2 to-blue-400">
                    Humara Gaana
                </h1>
                <p className="text-white/60">The official farewell batch playlist. Nominate and vote.</p>
            </div>

            <div className="flex justify-center mb-10">
                <Button variant="primary" onClick={() => setIsAddMode(!isAddMode)} className="flex items-center gap-2">
                    {isAddMode ? 'Back to Playlist' : <><Plus size={20} /> Nominate a Track</>}
                </Button>
            </div>

            {isAddMode ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 animate-fade-in-up">
                    <h2 className="text-2xl font-bold mb-4">Search Apple Music</h2>
                    <form onSubmit={searchTunes} className="relative mb-6">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Song name, artist..."
                            className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-4 pr-12 focus:border-accent-2 focus:outline-none"
                        />
                        <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
                            <Search size={20} />
                        </button>
                    </form>

                    {searching ? (
                        <p className="text-center text-white/40 border-t border-white/10 pt-6">Searching...</p>
                    ) : (
                        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                            {searchResults.map(track => (
                                <div key={track.trackId} className="flex items-center gap-4 bg-black/40 p-3 rounded-xl border border-white/5 hover:border-white/20 transition-colors">
                                    <div className="relative group">
                                        <img src={track.albumArtUrl} alt="" className="w-16 h-16 rounded-md object-cover" />
                                        {track.previewUrl && (
                                            <button
                                                onClick={() => togglePlay(track.previewUrl)}
                                                className="absolute inset-0 bg-black/50 items-center justify-center hidden group-hover:flex rounded-md transition-opacity"
                                            >
                                                {playingUrl === track.previewUrl ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-white truncate">{track.title}</p>
                                        <p className="text-sm text-white/60 truncate">{track.artist}</p>
                                    </div>
                                    <Button onClick={() => addSong(track)} size="sm" variant="secondary">Add</Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {loading ? (
                        <p className="text-center text-white/40">Loading playlist...</p>
                    ) : songs.length === 0 ? (
                        <div className="text-center p-10 bg-white/5 rounded-2xl border border-white/10">
                            <p className="text-white/40">The playlist is currently empty. Be the first to add a track!</p>
                        </div>
                    ) : (
                        songs.map((song, index) => {
                            const hasVoted = currentUser && song.voters.includes(currentUser._id);

                            return (
                                <div key={song._id} className="flex items-center gap-3 md:gap-4 bg-white/5 hover:bg-white/10 p-3 rounded-2xl border border-white/10 transition-colors animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                                    <div className="w-8 text-center font-black text-xl text-white/30 hidden md:block">
                                        #{index + 1}
                                    </div>

                                    <div className="relative group shrink-0">
                                        <img src={song.albumArtUrl} alt="" className="w-16 h-16 rounded-lg object-cover shadow-lg" />
                                        {song.previewUrl && (
                                            <button
                                                onClick={() => togglePlay(song.previewUrl)}
                                                className={`absolute inset-0 bg-black/60 items-center justify-center rounded-lg transition-opacity ${playingUrl === song.previewUrl ? 'flex' : 'hidden group-hover:flex'}`}
                                            >
                                                {playingUrl === song.previewUrl ? <Pause size={24} className="text-accent-2" /> : <Play size={24} className="text-white ml-1" />}
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <p className="font-bold text-lg text-white truncate">{song.title}</p>
                                        <p className="text-sm text-white/60 truncate">{song.artist}</p>
                                        <div className="flex items-center gap-2 mt-1 hidden md:flex">
                                            {song.submittedBy.profileImageUrl && (
                                                <img src={song.submittedBy.profileImageUrl} className="w-4 h-4 rounded-full" alt="" />
                                            )}
                                            <span className="text-xs text-white/40">Added by @{song.submittedBy.username}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleVote(song._id)}
                                        className={`flex flex-col items-center justify-center min-w-[3.5rem] h-[3.5rem] rounded-xl transition-all ${hasVoted
                                            ? 'bg-accent-2/20 text-accent-2 border border-accent-2/30'
                                            : 'bg-black/40 text-white/50 hover:text-white border border-white/10 hover:border-white/30'
                                            }`}
                                    >
                                        <ThumbsUp size={16} className={`mb-1 ${hasVoted ? 'fill-accent-2' : ''}`} />
                                        <span className="text-xs font-bold tabular-nums">{song.voteCount}</span>
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
