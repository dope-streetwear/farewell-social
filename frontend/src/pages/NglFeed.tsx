import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { MessageSquare, FilePenLine, Loader2, ShieldAlert, Edit2, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { PrivacyBadge } from '../components/ui/PrivacyBadge';

interface AnonymousPost {
    _id: string;
    text?: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video' | 'audio';
    theme?: string;
    createdAt: string;
    isEditable?: boolean;
}

import { NGL_THEMES } from './CreateNglPost';

export const NglFeed: React.FC = () => {
    const [posts, setPosts] = useState<AnonymousPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const res = await fetch('/api/ngl/posts?page=1&limit=20');
            if (res.ok) {
                const data = await res.json();
                setPosts(data || []);
            } else {
                setError('Failed to fetch anonymous feed');
            }
        } catch {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (postId: string) => {
        if (!confirm('Are you sure you want to permanently delete this confession?')) return;

        try {
            const res = await fetch(`/api/ngl/${postId}`, { method: 'DELETE' });
            if (res.ok) {
                setPosts(prev => prev.filter(p => p._id !== postId));
            } else {
                alert('Failed to delete post. It may be past the 15-minute window or you are not the author.');
            }
        } catch (err) {
            console.error('Error deleting post:', err);
            alert('Network error while deleting.');
        }
    };

    const handleSaveEdit = async (postId: string) => {
        if (!editText.trim()) {
            setEditingPostId(null);
            return;
        }

        try {
            const res = await fetch(`/api/ngl/${postId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: editText.trim() })
            });

            if (res.ok) {
                const updatedPost = await res.json();
                setPosts(prev => prev.map(p => p._id === postId ? { ...p, text: updatedPost.text } : p));
                setEditingPostId(null);
            } else {
                alert('Failed to edit post. It may be past the 15-minute window or you are not the author.');
            }
        } catch (err) {
            console.error('Error editing post:', err);
            alert('Network error while editing.');
        }
    };

    const startEditing = (post: AnonymousPost) => {
        setEditingPostId(post._id);
        setEditText(post.text || '');
    };

    return (
        <div className="w-full max-w-2xl mx-auto min-h-screen pb-20 md:pb-8 pt-4">
            {/* Header */}
            <div className="flex items-center justify-between px-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent-1 flex items-center justify-center">
                        <MessageSquare className="text-white" size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white leading-tight">NGL Batch Memories</h1>
                        <p className="text-xs text-white/50 tracking-widest uppercase">100% Anonymous</p>
                    </div>
                </div>
                <Button size="sm" variant="accent1" onClick={() => navigate('/ngl/create')} className="gap-2">
                    <FilePenLine size={16} /> Confess
                </Button>
            </div>

            <div className="px-4 mb-6">
                <div className="bg-accent-1/10 border border-accent-1/20 rounded-xl p-4 flex gap-3 text-sm">
                    <ShieldAlert className="text-accent-1 shrink-0" size={20} />
                    <p className="text-white/80">
                        A safe space for the batch to share secrets, confessions, and memories anonymously. Only admins can see who posted what in extreme cases.
                    </p>
                </div>
            </div>

            <PrivacyBadge />

            {error ? (
                <div className="px-4 text-center mt-8 text-error">{error}</div>
            ) : loading ? (
                <div className="flex justify-center mt-12">
                    <Loader2 className="animate-spin text-accent-1" size={32} />
                </div>
            ) : posts.length === 0 ? (
                <div className="px-4 text-center mt-12 text-white/60">
                    <div className="bg-primary border border-white/10 rounded-xl p-8">
                        <h3 className="text-xl font-bold mb-2 text-white">No confessions yet</h3>
                        <p className="mb-4">Break the ice and share something anonymously.</p>
                        <Button variant="accent1" onClick={() => navigate('/ngl/create')}>Confess Now</Button>
                    </div>
                </div>
            ) : (
                <div className="px-4 space-y-8">
                    {posts.map(post => {
                        const themeObj = NGL_THEMES.find(t => t.id === post.theme) || NGL_THEMES[0];
                        return (
                            <div key={post._id} className="relative flex flex-col group drop-shadow-xl">
                                {/* Theme Header Box */}
                                <div className={`w-full p-6 sm:p-8 rounded-t-2xl bg-gradient-to-br ${themeObj.gradient} text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[100px] border-b-0`}>
                                    <div className="absolute top-0 left-0 w-full h-full opacity-30 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                                    <h3 className="text-2xl sm:text-3xl font-black text-white relative z-10 drop-shadow-md px-4">
                                        {themeObj.prompt}
                                    </h3>
                                    <div className="absolute -bottom-4 -right-2 text-[5rem] opacity-20 rotate-12 select-none pointer-events-none drop-shadow-lg">
                                        {themeObj.emoji}
                                    </div>
                                    <div className="absolute -top-4 -left-2 text-[4rem] opacity-20 -rotate-12 select-none pointer-events-none drop-shadow-lg">
                                        {themeObj.emoji}
                                    </div>

                                    {/* Default theme might not need a huge box, but it works */}
                                </div>

                                {/* Content Box */}
                                <Card className="rounded-t-none border-t-0 bg-bg-dark/80 backdrop-blur-md p-5 pb-4 border-white/10 relative z-20">
                                    {editingPostId === post._id ? (
                                        <div className="mb-4">
                                            <textarea
                                                value={editText}
                                                onChange={(e) => setEditText(e.target.value)}
                                                className="w-full bg-black/50 border border-white/20 rounded-xl p-3 text-white placeholder-white/40 focus:outline-none focus:border-accent-1 focus:ring-1 focus:ring-accent-1 min-h-[100px] resize-none"
                                            />
                                            <div className="flex gap-2 justify-end mt-2">
                                                <Button size="sm" variant="ghost" onClick={() => setEditingPostId(null)}>Cancel</Button>
                                                <Button size="sm" variant="accent1" onClick={() => handleSaveEdit(post._id)}>Save</Button>
                                            </div>
                                        </div>
                                    ) : (
                                        post.text && (
                                            <p className="text-white/90 text-[17px] font-medium leading-relaxed mb-4 whitespace-pre-wrap">{post.text}</p>
                                        )
                                    )}

                                    {post.mediaUrl && (
                                        <div className="w-full rounded-xl overflow-hidden bg-black/50 border border-white/10 mb-4 max-h-[400px]">
                                            {post.mediaType === 'image' ? (
                                                <img src={post.mediaUrl} alt="anon media" className="w-full h-full object-contain" />
                                            ) : post.mediaType === 'video' ? (
                                                <video src={post.mediaUrl} controls className="w-full h-full object-contain" />
                                            ) : post.mediaType === 'audio' ? (
                                                <div className="w-full p-6 text-center">
                                                    <div className="mb-4 text-accent-1 font-black tracking-widest uppercase flex items-center justify-center gap-2">
                                                        <ShieldAlert size={24} />
                                                        Voice Note Filtered
                                                    </div>
                                                    <audio
                                                        src={post.mediaUrl}
                                                        controls
                                                        className="w-full"
                                                        onLoadedMetadata={(e) => {
                                                            e.currentTarget.playbackRate = 0.6;
                                                            (e.currentTarget as any).preservesPitch = false;
                                                        }}
                                                    />
                                                </div>
                                            ) : null}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-accent-1/20 border border-accent-1/50 flex items-center justify-center">
                                                    <div className="w-3 h-3 rounded-full bg-accent-1 shadow-[0_0_8px_rgba(124,58,237,0.8)]"></div>
                                                </div>
                                                <span className="text-xs font-bold text-white/50 tracking-wider">ANONYMOUS</span>
                                            </div>
                                            {post.isEditable && editingPostId !== post._id && (
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => startEditing(post)} className="text-white/40 hover:text-accent-1 transition-colors p-1" aria-label="Edit post">
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button onClick={() => handleDelete(post._id)} className="text-white/40 hover:text-error transition-colors p-1" aria-label="Delete post">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[11px] text-white/40 font-bold uppercase tracking-widest">
                                            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                </Card>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
