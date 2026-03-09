import type React from 'react';
import { useState, useEffect } from 'react';
import { Camera, Users, Clock, Loader2, X, Send } from 'lucide-react';
import { Button } from '../ui/Button';

interface Challenge {
    _id: string;
    prompt: string;
    activeUntil: string;
}

export const FlashChallengeCard: React.FC = () => {
    // useAuth is no longer needed here if we don't use 'user'
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [hasResponded, setHasResponded] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showUpload, setShowUpload] = useState(false);
    const [showResponses, setShowResponses] = useState(false);
    const [responses, setResponses] = useState<any[]>([]);
    const [responsesLoading, setResponsesLoading] = useState(false);

    const fetchChallenge = async () => {
        try {
            const res = await fetch('/api/flash/current');
            if (res.ok) {
                const data = await res.json();
                setChallenge(data.challenge);
                setHasResponded(data.hasResponded);
            }
        } catch (err) {
            console.error('Error fetching flash challenge:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChallenge();
    }, []);

    const fetchResponses = async () => {
        if (!challenge) return;
        setResponsesLoading(true);
        try {
            const res = await fetch(`/api/flash/responses/${challenge._id}`);
            if (res.ok) {
                const data = await res.json();
                setResponses(data);
                setShowResponses(true);
            }
        } catch (err) {
            console.error('Error fetching responses:', err);
        } finally {
            setResponsesLoading(false);
        }
    };

    if (loading || !challenge) return null;

    const timeLeft = Math.max(0, new Date(challenge.activeUntil).getTime() - Date.now());
    const minutesLeft = Math.floor(timeLeft / 60000);

    if (timeLeft <= 0) return null;

    return (
        <div className="w-full bg-gradient-to-r from-accent-2/20 via-bg-card to-accent-1/20 border border-white/10 rounded-2xl p-6 mb-6 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-2/5 rounded-full blur-3xl -mr-16 -mt-16"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-accent-2 flex items-center justify-center shadow-lg shadow-accent-2/20 shrink-0">
                    <Camera size={32} className="text-white" />
                </div>

                <div className="flex-1 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-2/10 border border-accent-2/20 text-accent-2 text-[10px] font-black uppercase tracking-widest mb-2">
                        Flash Challenge Active
                    </div>
                    <h2 className="text-xl font-black text-white mb-1">{challenge.prompt}</h2>
                    <div className="flex items-center justify-center md:justify-start gap-4 text-xs font-bold text-white/50">
                        <span className="flex items-center gap-1.5"><Clock size={14} /> {minutesLeft} min left</span>
                        <span className="flex items-center gap-1.5"><Users size={14} /> Join the chaos!</span>
                    </div>
                </div>

                <div className="flex gap-3">
                    {hasResponded ? (
                        <Button variant="secondary" onClick={fetchResponses} disabled={responsesLoading} className="rounded-xl font-bold">
                            {responsesLoading ? <Loader2 className="animate-spin" size={18} /> : 'View Responses'}
                        </Button>
                    ) : (
                        <Button variant="accent2" onClick={() => setShowUpload(true)} className="rounded-xl font-bold px-8 py-6 shadow-lg shadow-accent-2/20">
                            Post Now
                        </Button>
                    )}
                </div>
            </div>

            {/* Upload Modal */}
            {showUpload && (
                <FlashUploadModal
                    challengeId={challenge._id}
                    prompt={challenge.prompt}
                    onClose={() => setShowUpload(false)}
                    onSuccess={() => {
                        setHasResponded(true);
                        setShowUpload(false);
                        fetchResponses();
                    }}
                />
            )}

            {/* Responses Modal */}
            {showResponses && (
                <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4">
                    <div className="w-full max-w-2xl h-full max-h-[90vh] bg-bg-card border border-white/10 rounded-3xl flex flex-col overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-bg-dark/50">
                            <div>
                                <h3 className="text-xl font-black text-white">{challenge.prompt}</h3>
                                <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Flash Responses</p>
                            </div>
                            <button onClick={() => setShowResponses(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                <X size={24} className="text-white/60" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-4">
                            {responses.map((resp: any) => (
                                <div key={resp._id} className="relative aspect-[3/4] rounded-2xl overflow-hidden group">
                                    <img src={resp.mediaUrl} alt="" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="absolute bottom-3 left-3 flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-accent-1 overflow-hidden border border-white/20">
                                            {resp.authorId.profileImageUrl && <img src={resp.authorId.profileImageUrl} alt="" className="w-full h-full object-cover" />}
                                        </div>
                                        <span className="text-xs font-bold text-white shadow-sm">@{resp.authorId.username}</span>
                                    </div>
                                    {resp.caption && (
                                        <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md p-2 rounded-lg text-[10px] text-white/90 max-w-[80%] line-clamp-2">
                                            {resp.caption}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

interface FlashUploadModalProps {
    challengeId: string;
    prompt: string;
    onClose: () => void;
    onSuccess: () => void;
}

const FlashUploadModal: React.FC<FlashUploadModalProps> = ({ challengeId, prompt, onClose, onSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [caption, setCaption] = useState('');
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('media', file);
            formData.append('challengeId', challengeId);
            formData.append('caption', caption);

            const res = await fetch('/api/flash/submit', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                onSuccess();
            } else {
                const data = await res.json();
                alert(data.message || 'Upload failed');
            }
        } catch (err) {
            console.error('Upload error:', err);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] bg-black flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-bg-card border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-lg font-black text-white">Join Challenge</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full"><X size={20} className="text-white/40" /></button>
                </div>

                <div className="p-6 flex flex-col gap-6">
                    <div className="bg-accent-2/5 border border-dashed border-accent-2/20 rounded-2xl p-4 text-center">
                        <p className="text-accent-2 font-black italic">"{prompt}"</p>
                    </div>

                    {!preview ? (
                        <label className="aspect-square bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-all group">
                            <Camera size={48} className="text-white/20 group-hover:text-accent-2 group-hover:scale-110 transition-all mb-4" />
                            <span className="text-sm font-bold text-white/40 group-hover:text-white">Click to snap photo</span>
                            <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
                        </label>
                    ) : (
                        <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/10">
                            <img src={preview} alt="" className="w-full h-full object-cover" />
                            <button onClick={() => { setFile(null); setPreview(null); }} className="absolute top-4 right-4 bg-black/70 p-2 rounded-full text-white"><X size={16} /></button>
                        </div>
                    )}

                    <input
                        type="text"
                        placeholder="Add a witty caption..."
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-accent-2/50"
                    />

                    <Button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        variant="accent2"
                        className="w-full py-6 rounded-2xl text-lg font-black shadow-lg shadow-accent-2/20"
                    >
                        {uploading ? <Loader2 className="animate-spin" size={24} /> : <><Send size={20} className="mr-2" /> SEND IT!</>}
                    </Button>
                </div>
            </div>
        </div>
    );
};
