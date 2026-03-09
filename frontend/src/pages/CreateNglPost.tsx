import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ImagePlus, X, ShieldCheck, Mic, Square } from 'lucide-react';
import { PrivacyBadge } from '../components/ui/PrivacyBadge';

export const NGL_THEMES = [
    { id: 'default', label: 'Default', prompt: 'Send me an anonymous message!', gradient: 'from-gray-800 to-gray-900 border border-white/10', emoji: '🤫' },
    { id: 'confess', label: 'Confessions', prompt: 'Confess your crush...', gradient: 'from-pink-500 to-rose-600 border border-pink-400', emoji: '💖' },
    { id: '3words', label: '3 Words', prompt: 'Describe me in 3 words', gradient: 'from-orange-400 to-red-500 border border-orange-300', emoji: '💬' },
    { id: 'neverhave', label: 'Never Have I', prompt: 'Never have I ever...', gradient: 'from-blue-500 to-cyan-500 border border-blue-400', emoji: '👀' },
    { id: 'rizz', label: 'W Rizz', prompt: 'W Rizz Only', gradient: 'from-indigo-500 to-purple-600 border border-indigo-400', emoji: '🧊' },
    { id: 'roast', label: 'Roast Me', prompt: 'Roast me completely', gradient: 'from-red-600 to-black border border-red-500', emoji: '💀' },
];

export const CreateNglPost: React.FC = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        }
    }, [user, authLoading, navigate]);

    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [text, setText] = useState('');
    const [theme, setTheme] = useState('default');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Audio Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);

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
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioFile = new File([audioBlob], 'voicenote.webm', { type: 'audio/webm' });
                setFile(audioFile);
                setPreview(URL.createObjectURL(audioBlob));
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = window.setInterval(() => {
                setRecordingTime(prev => {
                    if (prev >= 60) {
                        stopRecording();
                        return 60;
                    }
                    return prev + 1;
                });
            }, 1000);

        } catch (err) {
            console.error('Error accessing microphone:', err);
            setError('Microphone access denied or unavailable.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text && !file) {
            setError('Please add text or an image/video to post.');
            return;
        }

        setLoading(true);
        setError('');

        const formData = new FormData();
        if (text) formData.append('text', text);
        if (file) {
            formData.append('media', file);
            if (file.type.startsWith('audio/')) {
                formData.append('isAudio', 'true');
            }
        }
        formData.append('theme', theme);

        try {
            const res = await fetch('/api/ngl/posts', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                navigate('/ngl');
            } else {
                const data = await res.json();
                setError(data.message || 'Failed to submit post');
            }
        } catch {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-xl mx-auto min-h-screen pb-20 pt-4 px-4 bg-bg-dark">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-black text-white tracking-tight">Secret Message</h1>
                <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
            </div>

            <PrivacyBadge />

            <Card className="p-6 border-accent-1 shadow-[0_0_30px_rgba(124,58,237,0.15)]">
                <div className="flex items-center gap-2 mb-6 text-accent-1 font-bold">
                    <ShieldCheck size={20} />
                    <span>Your identity is completely hidden.</span>
                </div>

                {error && (
                    <div className="bg-error/20 border border-error text-error p-3 rounded-md mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Theme Selector List */}
                    <div>
                        <p className="text-white/70 text-sm font-bold mb-3 uppercase tracking-wider">Choose a Theme</p>
                        <div className="flex gap-3 overflow-x-auto pb-4 overflow-y-visible hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            {NGL_THEMES.map(t => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setTheme(t.id)}
                                    className={`flex-shrink-0 px-4 py-2.5 rounded-full text-sm font-bold border transition-all flex items-center shadow-lg ${theme === t.id
                                        ? 'border-white bg-white/20 scale-105 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] text-white'
                                        : 'border-white/10 opacity-70 hover:opacity-100 bg-bg-dark text-white/80 hover:bg-white/5'
                                        }`}
                                >
                                    <div className={`w-4 h-4 rounded-full inline-block mr-2 bg-gradient-to-br ${t.gradient.split(' border')[0]} shadow-inner`} />
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Confession Text Layer with NGL Box Preview */}
                    <div className="flex flex-col drop-shadow-2xl">
                        {/* Theme Box Header */}
                        {(() => {
                            const currentTheme = NGL_THEMES.find(t => t.id === theme) || NGL_THEMES[0];
                            return (
                                <div className={`w-full p-8 rounded-t-2xl bg-gradient-to-br ${currentTheme.gradient} text-center relative overflow-hidden flex items-center justify-center min-h-[120px]`}>
                                    <div className="absolute top-0 left-0 w-full h-full opacity-30 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                                    <h3 className="text-3xl font-black text-white relative z-10 drop-shadow-md">
                                        {currentTheme.prompt}
                                    </h3>
                                    <div className="absolute -bottom-4 -right-2 text-[5rem] opacity-20 rotate-12 select-none pointer-events-none drop-shadow-lg">
                                        {currentTheme.emoji}
                                    </div>
                                    <div className="absolute -top-4 -left-2 text-[4rem] opacity-20 -rotate-12 select-none pointer-events-none drop-shadow-lg">
                                        {currentTheme.emoji}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Textarea */}
                        <textarea
                            className="w-full bg-white/5 border border-white/20 border-t-0 p-5 text-white text-lg font-medium focus:outline-none focus:bg-white/10 transition-colors min-h-[160px] resize-y placeholder:text-white/30 rounded-b-2xl"
                            placeholder="Type your message here..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />
                    </div>

                    {/* Media Attachments */}
                    <div className="w-full">
                        {preview ? (
                            <div className="relative w-full aspect-video bg-black/50 rounded-xl overflow-hidden border border-white/10 group flex items-center justify-center">
                                {file?.type.startsWith('image/') ? (
                                    <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                                ) : file?.type.startsWith('audio/') ? (
                                    <div className="w-full p-6 text-center">
                                        <div className="mb-4 text-accent-1 font-black tracking-widest uppercase flex items-center justify-center gap-2">
                                            <ShieldCheck size={24} />
                                            Voice Note Filtered
                                        </div>
                                        <audio src={preview} className="w-full" controls />
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
                        ) : isRecording ? (
                            <div className="w-full border border-error bg-error/10 rounded-xl py-12 flex flex-col items-center justify-center gap-4 animate-pulse">
                                <span className="text-error font-black text-2xl tracking-widest">{formatTime(recordingTime)} / 1:00</span>
                                <Button type="button" variant="ghost" className="text-error border-error border bg-error/20 hover:bg-error/30" onClick={stopRecording}>
                                    <Square size={20} className="mr-2" /> Stop Recording
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="border border-dashed border-white/20 py-8 text-white/50 hover:text-accent-1 hover:border-accent-1 hover:bg-accent-1/10 flex flex-col gap-2 transition-all"
                                    onClick={startRecording}
                                >
                                    <Mic size={24} />
                                    <span>Record Voice (Altered)</span>
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="border border-dashed border-white/20 py-8 text-white/50 hover:text-white/80 hover:bg-white/5 flex flex-col gap-2 transition-all"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <ImagePlus size={24} />
                                    <span>Attach Photo/Video</span>
                                </Button>
                            </div>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*,video/*"
                            onChange={handleFileChange}
                        />
                    </div>

                    <Button
                        type="submit"
                        variant="accent1"
                        className="w-full font-black tracking-wide"
                        size="lg"
                        isLoading={loading}
                        disabled={!file && !text.trim()}
                    >
                        SEND ANONYMOUSLY
                    </Button>
                </form>
            </Card>

            <p className="text-center text-xs text-white/40 mt-8 font-bold tracking-widest max-w-sm mx-auto">
                While your identity is hidden from other users, admins can access it if a post violates community guidelines, is reported for bullying, or contains inappropriate content. Keep it fun and respectful.
            </p>
        </div>
    );
};
