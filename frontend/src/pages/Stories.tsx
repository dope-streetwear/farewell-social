import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { VerifiedBadge } from '../components/ui/VerifiedBadge';
import { Loader2, Plus, X, ChevronLeft, ChevronRight, Eye, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface StoryItem {
    _id: string;
    mediaUrl: string;
    mediaType: 'image' | 'video';
    caption?: string;
    viewers: string[];
    expiresAt: string;
    createdAt: string;
    authorId: {
        _id: string;
        username: string;
        displayName: string;
        profileImageUrl?: string;
        verificationTier?: number;
    };
}

interface StoryGroup {
    user: {
        _id: string;
        username: string;
        displayName: string;
        profileImageUrl?: string;
        verificationTier?: number;
    };
    stories: StoryItem[];
}

export const Stories: React.FC = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [groups, setGroups] = useState<StoryGroup[]>([]);
    const [loading, setLoading] = useState(true);

    // Viewer state
    const [viewing, setViewing] = useState<{ groupIndex: number; storyIndex: number } | null>(null);
    const [progress, setProgress] = useState(0);
    const progressTimer = useRef<number | null>(null);

    // Create story state
    const [showCreate, setShowCreate] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [caption, setCaption] = useState('');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!authLoading && !user) navigate('/login');
    }, [user, authLoading, navigate]);

    useEffect(() => {
        if (user) fetchStories();
    }, [user]);

    const fetchStories = async () => {
        try {
            const res = await fetch('/api/stories');
            if (res.ok) {
                const data = await res.json();
                setGroups(data);
            }
        } catch (err) {
            console.error('Error fetching stories', err);
        } finally {
            setLoading(false);
        }
    };

    // Story viewer logic
    const openStory = (groupIndex: number) => {
        setViewing({ groupIndex, storyIndex: 0 });
        startProgress();
    };

    const startProgress = () => {
        setProgress(0);
        if (progressTimer.current) clearInterval(progressTimer.current);
        progressTimer.current = window.setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    nextStory();
                    return 0;
                }
                return prev + 2; // 5 seconds total (2% every 100ms)
            });
        }, 100);
    };

    const closeViewer = () => {
        setViewing(null);
        setProgress(0);
        if (progressTimer.current) clearInterval(progressTimer.current);
    };

    const nextStory = () => {
        if (!viewing) return;
        const group = groups[viewing.groupIndex];
        if (viewing.storyIndex < group.stories.length - 1) {
            setViewing({ ...viewing, storyIndex: viewing.storyIndex + 1 });
            markViewed(group.stories[viewing.storyIndex + 1]._id);
            setProgress(0);
        } else if (viewing.groupIndex < groups.length - 1) {
            const nextGroup = viewing.groupIndex + 1;
            setViewing({ groupIndex: nextGroup, storyIndex: 0 });
            markViewed(groups[nextGroup].stories[0]._id);
            setProgress(0);
        } else {
            closeViewer();
        }
    };

    const prevStory = () => {
        if (!viewing) return;
        if (viewing.storyIndex > 0) {
            setViewing({ ...viewing, storyIndex: viewing.storyIndex - 1 });
            setProgress(0);
        } else if (viewing.groupIndex > 0) {
            const prevGroup = viewing.groupIndex - 1;
            const lastIdx = groups[prevGroup].stories.length - 1;
            setViewing({ groupIndex: prevGroup, storyIndex: lastIdx });
            setProgress(0);
        }
    };

    const markViewed = async (storyId: string) => {
        try {
            await fetch(`/api/stories/${storyId}/view`, { method: 'POST' });
        } catch { }
    };

    useEffect(() => {
        if (viewing) {
            const story = groups[viewing.groupIndex]?.stories[viewing.storyIndex];
            if (story) markViewed(story._id);
        }
    }, [viewing]);

    // Restart progress timer when story changes
    useEffect(() => {
        if (viewing) startProgress();
        return () => {
            if (progressTimer.current) clearInterval(progressTimer.current);
        };
    }, [viewing?.groupIndex, viewing?.storyIndex]);

    // Create story
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const f = e.target.files[0];
            setFile(f);
            setPreview(URL.createObjectURL(f));
            setShowCreate(true);
        }
    };

    const handleCreate = async () => {
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('media', file);
        if (caption.trim()) formData.append('caption', caption);

        try {
            const res = await fetch('/api/stories', { method: 'POST', body: formData });
            if (res.ok) {
                setShowCreate(false);
                setFile(null);
                setPreview(null);
                setCaption('');
                fetchStories();
            }
        } catch (err) {
            console.error('Error creating story', err);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (storyId: string) => {
        try {
            const res = await fetch(`/api/stories/${storyId}`, { method: 'DELETE' });
            if (res.ok) {
                closeViewer();
                fetchStories();
            }
        } catch { }
    };

    if (loading) {
        return <div className="flex justify-center mt-20"><Loader2 className="animate-spin text-secondary" size={32} /></div>;
    }

    const currentStory = viewing ? groups[viewing.groupIndex]?.stories[viewing.storyIndex] : null;
    const currentGroup = viewing ? groups[viewing.groupIndex] : null;
    const isOwnStory = currentStory?.authorId._id === user?._id;

    return (
        <div className="w-full max-w-xl mx-auto min-h-screen pb-20 pt-4 px-4">
            <h1 className="text-2xl font-black text-white tracking-tight mb-4">Kissa-E-Din</h1>

            {/* Story Circles Row */}
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {/* Add Story Button */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-16 h-16 rounded-full bg-white/10 border-2 border-dashed border-secondary flex items-center justify-center hover:bg-white/20 transition-colors"
                    >
                        <Plus size={24} className="text-secondary" />
                    </button>
                    <span className="text-[10px] text-white/50 font-bold">Tera Kissa</span>
                    <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
                </div>

                {/* Story circles */}
                {groups.map((group, i) => {
                    const hasUnviewed = group.stories.some(s => !s.viewers.includes(user?._id || ''));
                    return (
                        <button
                            key={group.user._id}
                            onClick={() => openStory(i)}
                            className="flex flex-col items-center gap-1 flex-shrink-0"
                        >
                            <div className={`w-16 h-16 rounded-full p-0.5 ${hasUnviewed ? 'bg-gradient-to-br from-secondary via-accent-1 to-accent-2' : 'bg-white/20'}`}>
                                <div className="w-full h-full rounded-full bg-bg-dark p-0.5">
                                    <div className="w-full h-full rounded-full bg-accent-1 overflow-hidden flex items-center justify-center text-white font-bold text-lg">
                                        {group.user.profileImageUrl ? (
                                            <img src={group.user.profileImageUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            group.user.displayName.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                </div>
                            </div>
                            <span className="text-[10px] text-white/70 font-bold max-w-[64px] truncate">
                                {group.user._id === user?._id ? 'Tu' : group.user.displayName.split(' ')[0]}
                            </span>
                        </button>
                    );
                })}
            </div>

            {groups.length === 0 && (
                <Card className="p-8 text-center mt-4">
                    <p className="text-white/50 text-lg font-bold">Koi kissa nahi abhi</p>
                    <p className="text-white/30 text-sm mt-2">Pehla kissa tu hi daal de — photo ya video, 24 ghante me gayab!</p>
                </Card>
            )}

            {/* Fullscreen Story Viewer */}
            {viewing && currentStory && currentGroup && (
                <div className="fixed inset-0 z-[200] bg-black flex flex-col">
                    {/* Progress bars */}
                    <div className="absolute top-0 left-0 right-0 z-30 flex gap-1 p-2 pt-3">
                        {currentGroup.stories.map((_, i) => (
                            <div key={i} className="flex-1 h-0.5 bg-white/20 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-white rounded-full transition-all duration-100"
                                    style={{
                                        width: i < viewing.storyIndex ? '100%' :
                                            i === viewing.storyIndex ? `${progress}%` : '0%'
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Header */}
                    <div className="absolute top-6 left-0 right-0 z-30 flex items-center justify-between px-4 py-2">
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => { closeViewer(); navigate(`/u/${currentGroup.user.username}`); }}>
                            <div className="w-8 h-8 rounded-full bg-accent-1 overflow-hidden flex items-center justify-center text-white font-bold text-sm">
                                {currentGroup.user.profileImageUrl ? (
                                    <img src={currentGroup.user.profileImageUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    currentGroup.user.displayName.charAt(0).toUpperCase()
                                )}
                            </div>
                            <div>
                                <p className="text-white font-bold text-sm flex items-center gap-1">
                                    {currentGroup.user.displayName}
                                    <VerifiedBadge tier={currentGroup.user.verificationTier || 0} size={12} />
                                </p>
                                <p className="text-white/50 text-[10px]">{formatDistanceToNow(new Date(currentStory.createdAt), { addSuffix: true })}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {isOwnStory && (
                                <>
                                    <span className="text-white/50 text-xs flex items-center gap-1">
                                        <Eye size={14} /> {currentStory.viewers.length}
                                    </span>
                                    <button onClick={() => handleDelete(currentStory._id)} className="text-white/50 hover:text-error p-1">
                                        <Trash2 size={18} />
                                    </button>
                                </>
                            )}
                            <button onClick={closeViewer} className="text-white p-1">
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Story Content */}
                    <div className="flex-1 flex items-center justify-center relative">
                        {currentStory.mediaType === 'image' ? (
                            <img src={currentStory.mediaUrl} alt="" className="max-w-full max-h-full object-contain" />
                        ) : (
                            <video src={currentStory.mediaUrl} autoPlay className="max-w-full max-h-full object-contain" />
                        )}

                        {/* Caption overlay */}
                        {currentStory.caption && (
                            <div className="absolute bottom-20 left-0 right-0 text-center px-6">
                                <p className="text-white text-lg font-bold" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                                    {currentStory.caption}
                                </p>
                            </div>
                        )}

                        {/* Tap zones */}
                        <button className="absolute left-0 top-0 w-1/3 h-full z-20" onClick={prevStory} />
                        <button className="absolute right-0 top-0 w-1/3 h-full z-20" onClick={nextStory} />
                    </div>

                    {/* Nav arrows (desktop) */}
                    <button className="absolute left-4 top-1/2 -translate-y-1/2 z-30 hidden md:block text-white/50 hover:text-white" onClick={prevStory}>
                        <ChevronLeft size={32} />
                    </button>
                    <button className="absolute right-4 top-1/2 -translate-y-1/2 z-30 hidden md:block text-white/50 hover:text-white" onClick={nextStory}>
                        <ChevronRight size={32} />
                    </button>
                </div>
            )}

            {/* Create Story Modal */}
            {showCreate && (
                <div className="fixed inset-0 z-[150] bg-bg-dark/95 backdrop-blur-md flex items-center justify-center p-4">
                    <Card className="max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-black text-white">Naya Kissa</h2>
                            <button onClick={() => { setShowCreate(false); setFile(null); setPreview(null); setCaption(''); }} className="text-white/50 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        {preview && (
                            <div className="w-full aspect-[9/16] max-h-[400px] bg-black rounded-xl overflow-hidden mb-4 flex items-center justify-center">
                                {file?.type.startsWith('image/') ? (
                                    <img src={preview} alt="Preview" className="max-w-full max-h-full object-contain" />
                                ) : (
                                    <video src={preview} controls className="max-w-full max-h-full object-contain" />
                                )}
                            </div>
                        )}

                        <input
                            type="text"
                            placeholder="Caption (optional)..."
                            className="w-full bg-white/5 border border-white/20 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-secondary mb-4"
                            value={caption}
                            onChange={e => setCaption(e.target.value)}
                            maxLength={500}
                        />

                        <p className="text-xs text-white/30 mb-4">24 ghante me apne aap gayab ho jayega</p>

                        <Button className="w-full" onClick={handleCreate} isLoading={uploading} disabled={!file}>
                            Post Kissa
                        </Button>
                    </Card>
                </div>
            )}
        </div>
    );
};
