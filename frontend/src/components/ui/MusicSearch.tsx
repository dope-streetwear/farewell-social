import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Search, Play, Pause, Check, X } from 'lucide-react';

export interface ISong {
    trackId: string;
    songTitle: string;
    artistName: string;
    audioPreviewUrl: string;
    artworkUrl: string;
    audioStartTime?: number;
}

interface MusicSearchProps {
    onSelect: (song: ISong | null) => void;
    selectedSong: ISong | null;
}

export const MusicSearch: React.FC<MusicSearchProps> = ({ onSelect, selectedSong }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ISong[]>([]);
    const [loading, setLoading] = useState(false);
    const [playingId, setPlayingId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim().length > 2) searchMusic(query);
            else setResults([]);
        }, 500);
        return () => clearTimeout(timer);
    }, [query]);

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
            }
        };
    }, []);

    const searchMusic = async (searchQuery: string) => {
        setLoading(true);
        try {
            // Deezer via our backend proxy — no CORS issues
            const res = await fetch(`/api/music/search?q=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();

            // Backend already maps to our ISong format
            if (data.data) {
                setResults(data.data.filter((s: ISong) => s.audioPreviewUrl));
            }
        } catch (error) {
            console.error('Music search failed', error);
        } finally {
            setLoading(false);
        }
    };

    const playPreview = (song: ISong) => {
        // If this song is currently playing, just pause it
        if (playingId === song.trackId && audioRef.current) {
            audioRef.current.pause();
            setPlayingId(null);
            return;
        }

        // Stop whatever is currently playing
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.onended = null;
            audioRef.current.onerror = null;
            audioRef.current = null;
        }

        // Create fresh audio element
        const audio = new Audio(song.audioPreviewUrl);
        audio.volume = 0.5;
        audio.onended = () => { setPlayingId(null); };
        audio.onerror = () => { setPlayingId(null); };
        audioRef.current = audio;

        audio.play()
            .then(() => setPlayingId(song.trackId))
            .catch(() => setPlayingId(null));
    };

    const handleSelectSong = (song: ISong) => {
        onSelect(song);
        playPreview(song);
    };

    const handleRemoveSong = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
        }
        setPlayingId(null);
        onSelect(null);
    };

    const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedSong) return;
        const time = parseInt(e.target.value);
        onSelect({ ...selectedSong, audioStartTime: time });
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            if (audioRef.current.paused) {
                audioRef.current.play().catch(() => { });
                setPlayingId(selectedSong.trackId);
            }
        }
    };

    return (
        <div className="w-full bg-white/5 border border-white/10 rounded-xl overflow-hidden mt-4">
            <div className="p-3 border-b border-white/5 bg-white/5 relative">
                <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                    type="text"
                    placeholder="Koi badhiya gaana dhoondh..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-bg-dark border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-accent-2 transition-colors text-sm"
                />
            </div>

            {loading && (
                <div className="p-4 text-center text-white/40 text-sm">Dhoondh raha hu...</div>
            )}

            {!loading && results.length > 0 && query.length > 2 && (
                <div className="max-h-60 overflow-y-auto">
                    {results.map((song) => (
                        <div
                            key={song.trackId}
                            onClick={() => handleSelectSong(song)}
                            className={`flex items-center justify-between p-3 border-b border-white/5 cursor-pointer hover:bg-white/10 transition-colors ${selectedSong?.trackId === song.trackId ? 'bg-accent-2/20 border-accent-2/30' : ''}`}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div
                                    className="w-10 h-10 bg-white/10 rounded-md bg-cover bg-center flex-shrink-0 relative"
                                    style={{ backgroundImage: `url(${song.artworkUrl})` }}
                                >
                                    <button
                                        onClick={(e) => { e.stopPropagation(); playPreview(song); }}
                                        className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md transition-colors hover:bg-black/70"
                                    >
                                        {playingId === song.trackId
                                            ? <Pause size={16} className="text-white" />
                                            : <Play size={16} className="text-white ml-0.5" />}
                                    </button>
                                </div>
                                <div className="truncate">
                                    <p className="text-sm font-bold text-white truncate">{song.songTitle}</p>
                                    <p className="text-xs text-white/60 truncate">{song.artistName}</p>
                                </div>
                            </div>
                            {selectedSong?.trackId === song.trackId && (
                                <Check size={18} className="text-accent-2 flex-shrink-0 ml-2" />
                            )}
                        </div>
                    ))}
                </div>
            )}

            {selectedSong && (!query || results.length === 0) && (
                <div className="bg-accent-2/10 p-3 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => playPreview(selectedSong)}
                                className="w-10 h-10 bg-accent-2/20 rounded-md flex items-center justify-center hover:bg-accent-2/30 transition-colors"
                            >
                                {playingId === selectedSong.trackId
                                    ? <Pause size={18} className="text-accent-2" />
                                    : <Play size={18} className="text-accent-2 ml-0.5" />}
                            </button>
                            <div>
                                <p className="text-sm font-bold text-accent-2">{selectedSong.songTitle}</p>
                                <p className="text-xs text-accent-2/70">{selectedSong.artistName}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleRemoveSong}
                            className="text-white/40 hover:text-white p-1"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className="flex flex-col gap-1 border-t border-accent-2/10 pt-3 mt-1">
                        <div className="flex justify-between items-center text-xs text-accent-2/70 font-bold uppercase tracking-widest">
                            <span>Gaana Yaha se Shuru Hoga</span>
                            <span>{selectedSong.audioStartTime || 0}s</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="15"
                            value={selectedSong.audioStartTime || 0}
                            onChange={handleStartTimeChange}
                            className="w-full accent-accent-2 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        />
                        <p className="text-[10px] text-white/40 text-center mt-1">Bata kaha se 15 second ka gaana bajana hai.</p>
                    </div>
                </div>
            )}
        </div>
    );
};
