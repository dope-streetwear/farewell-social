import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ImagePlus, X, CalendarClock } from 'lucide-react';
import { MusicSearch } from '../components/ui/MusicSearch';
import { MentionInput } from '../components/ui/MentionInput';
import { useAuth } from '../context/AuthContext';
import type { ISong } from '../components/ui/MusicSearch';
import { api } from '../utils/api';

export const CreatePost: React.FC = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (!authLoading && !user) navigate('/login');
    }, [user, authLoading, navigate]);

    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [caption, setCaption] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedSong, setSelectedSong] = useState<ISong | null>(null);
    const [overlayText, setOverlayText] = useState('');
    const [isTimeCapsule, setIsTimeCapsule] = useState(false);
    const [unlockDate, setUnlockDate] = useState('');

    // Tab Aur Ab (Then vs Now) State
    const [isTabAurAb, setIsTabAurAb] = useState(false);
    const [file2, setFile2] = useState<File | null>(null);
    const [preview2, setPreview2] = useState<string | null>(null);
    const fileInputRef2 = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selected = e.target.files[0];
            if (selected.size > 50 * 1024 * 1024) {
                setError('File too large (max 50MB)');
                return;
            }
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
            setError('');
        }
    };

    const clearFile = () => {
        setFile(null);
        setPreview(null);
        setOverlayText('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleFileChange2 = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selected = e.target.files[0];
            if (selected.size > 50 * 1024 * 1024) {
                setError('File too large (max 50MB)');
                return;
            }
            // Force image only for secondary
            if (!selected.type.startsWith('image/')) {
                setError('Second file must be an image for "Then vs Now" posts.');
                return;
            }
            setFile2(selected);
            setPreview2(URL.createObjectURL(selected));
            setError('');
        }
    };

    const clearFile2 = () => {
        setFile2(null);
        setPreview2(null);
        if (fileInputRef2.current) fileInputRef2.current.value = '';
    };

    const applyTextOverlay = async (file: File, text: string): Promise<File> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return resolve(file);

                ctx.drawImage(img, 0, 0);

                const fontSize = Math.max(Math.floor(img.width * 0.08), 24);
                ctx.font = `900 ${fontSize}px sans-serif`;
                ctx.fillStyle = 'white';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                ctx.shadowColor = 'rgba(0,0,0,0.8)';
                ctx.shadowBlur = Math.floor(fontSize * 0.2);
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = Math.floor(fontSize * 0.05);

                const lines = text.split('\n');
                const lineHeight = fontSize * 1.2;
                const startY = (img.height / 2) - ((lines.length - 1) * lineHeight) / 2;

                lines.forEach((line, index) => {
                    ctx.fillText(line, img.width / 2, startY + (index * lineHeight));
                });

                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(new File([blob], file.name, { type: file.type }));
                    } else {
                        resolve(file);
                    }
                }, file.type, 0.95);
            };
            img.onerror = () => resolve(file);
            img.src = URL.createObjectURL(file);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        let finalFile = file;
        if (file && file.type.startsWith('image/') && overlayText.trim()) {
            finalFile = await applyTextOverlay(file, overlayText);
        }

        const formData = new FormData();
        if (caption) formData.append('caption', caption);
        if (finalFile) formData.append('media', finalFile);
        if (isTabAurAb) {
            formData.append('type', 'THEN_VS_NOW');
            if (file2) formData.append('media', file2);
        } else {
            formData.append('type', 'REGULAR');
        }
        if (isTimeCapsule && unlockDate) formData.append('unlockDate', new Date(unlockDate).toISOString());
        if (selectedSong) {
            formData.append('spotifyTrackId', selectedSong.trackId);
            formData.append('songTitle', selectedSong.songTitle);
            formData.append('artistName', selectedSong.artistName);
            formData.append('audioPreviewUrl', selectedSong.audioPreviewUrl);
            if (selectedSong.audioStartTime !== undefined) {
                formData.append('audioStartTime', selectedSong.audioStartTime.toString());
            }
        }

        try {
            await api('/api/posts', {
                method: 'POST',
                body: formData,
            });
            navigate('/feed');
        } catch (err: any) {
            setError(err.message || 'Failed to create post');
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="w-full max-w-xl mx-auto min-h-screen pb-20 pt-4 px-4">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-black text-white tracking-tight">New Post</h1>
                <Button variant="ghost" onClick={() => navigate(-1)}>Cancel yaar</Button>
            </div>

            <Card className="p-6">
                {error && (
                    <div className="bg-error/20 border border-error text-error p-3 rounded-md mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Tab Aur Ab Toggle */}
                    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-white/10 rounded-xl p-4 transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-white/80">
                                <ImagePlus size={20} className="text-blue-400" />
                                <span className="font-bold">Tab Aur Ab (Then vs Now)</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={isTabAurAb} onChange={(e) => {
                                    setIsTabAurAb(e.target.checked);
                                    if (!e.target.checked) clearFile2();
                                }} />
                                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-400"></div>
                            </label>
                        </div>
                        <p className="text-xs text-white/50">Post two side-by-side comparative photos (e.g., 6th Grade vs Farewell).</p>
                    </div>

                    {/* Media Selection */}
                    <div className="w-full">
                        <label className="block text-sm font-bold mb-2 text-white/90">
                            {isTabAurAb ? 'Upload "Then" Photo (Left)' : 'Upload a nice photo or video'}
                        </label>

                        {preview ? (
                            <div className="relative w-full aspect-square bg-bg-dark rounded-xl overflow-hidden border border-white/10 group">
                                {file?.type.startsWith('image/') ? (
                                    <div className="relative w-full h-full flex items-center justify-center">
                                        <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                                        {overlayText && (
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
                                                <span
                                                    className="text-white font-black text-center whitespace-pre-wrap leading-tight"
                                                    style={{
                                                        textShadow: '0px 2px 10px rgba(0,0,0,0.8)',
                                                        fontSize: 'clamp(1.5rem, 5vw, 3rem)'
                                                    }}
                                                >
                                                    {overlayText}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <video src={preview} className="w-full h-full object-contain" controls />
                                )}
                                <button
                                    type="button"
                                    onClick={clearFile}
                                    className="absolute top-4 right-4 bg-error text-white p-2 rounded-full opacity-80 hover:opacity-100 transition-opacity"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        ) : (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full h-48 sm:h-64 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-secondary transition-colors group bg-bg-dark/50"
                            >
                                <div className="bg-primary p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
                                    <ImagePlus size={32} className="text-secondary" />
                                </div>
                                <p className="font-bold text-white mb-1">Click here to choose a file</p>
                                <p className="text-xs text-white/50">Supports Images and Videos up to 50MB</p>
                            </div>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept={isTabAurAb ? "image/*" : "image/*,video/*"}
                            onChange={handleFileChange}
                        />

                        {isTabAurAb && (
                            <div className="mt-6 animate-in fade-in slide-in-from-top-2">
                                <label className="block text-sm font-bold mb-2 text-white/90">Upload "Now" Photo (Right)</label>
                                {preview2 ? (
                                    <div className="relative w-full aspect-square bg-bg-dark rounded-xl overflow-hidden border border-white/10 group">
                                        <div className="relative w-full h-full flex items-center justify-center">
                                            <img src={preview2} alt="Preview 2" className="w-full h-full object-contain" />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={clearFile2}
                                            className="absolute top-4 right-4 bg-error text-white p-2 rounded-full opacity-80 hover:opacity-100 transition-opacity"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => fileInputRef2.current?.click()}
                                        className="w-full h-48 sm:h-64 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-colors group bg-bg-dark/50"
                                    >
                                        <div className="bg-primary p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
                                            <ImagePlus size={32} className="text-blue-400" />
                                        </div>
                                        <p className="font-bold text-white mb-1">Click here to choose second image</p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef2}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange2}
                                />
                            </div>
                        )}

                        {file?.type.startsWith('image/') && (
                            <div className="mt-4">
                                <label className="block text-sm font-bold mb-2 text-white/90">Image Text Overlay (optional)</label>
                                <textarea
                                    className="w-full bg-white/5 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:border-secondary transition-colors resize-y h-20"
                                    placeholder="Type to overlay text on the image..."
                                    value={overlayText}
                                    onChange={(e) => setOverlayText(e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    {/* Caption */}
                    <div>
                        <label className="block text-sm font-bold mb-2 text-white/90">Tell us about it (kuch shabdo me)</label>
                        <MentionInput
                            value={caption}
                            onChange={setCaption}
                            placeholder="What's going on... (use @ to tag someone)"
                            multiline
                            className="bg-white/5 border border-white/20 rounded-lg p-3 focus:border-secondary transition-colors min-h-[100px] resize-y"
                        />
                    </div>

                    {/* Music Search */}
                    <div>
                        <label className="block text-sm font-bold mb-2 text-white/90">Add some music (Gaana laga)</label>
                        <MusicSearch onSelect={setSelectedSong} selectedSong={selectedSong} />
                    </div>

                    {/* Time Capsule Toggle */}
                    <div className="bg-bg-dark border border-white/10 rounded-xl p-4 transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-white/80">
                                <CalendarClock size={20} className="text-secondary" />
                                <span className="font-bold">Time Capsule</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={isTimeCapsule} onChange={(e) => setIsTimeCapsule(e.target.checked)} />
                                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                            </label>
                        </div>
                        {isTimeCapsule && (
                            <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                                <p className="text-xs text-white/50 mb-2">Select when this post will unlock for others to see.</p>
                                <input
                                    type="datetime-local"
                                    className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:border-secondary"
                                    value={unlockDate}
                                    onChange={(e) => setUnlockDate(e.target.value)}
                                    min={new Date(Date.now() + 86400000).toISOString().slice(0, 16)} // Minimun 1 day in future
                                />
                            </div>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        isLoading={loading}
                        disabled={(!file && !caption.trim()) || (isTabAurAb && (!file || !file2))}
                    >
                        Post it (Machao Bhaukaal)
                    </Button>
                </form>
            </Card>
        </div >
    );
};
