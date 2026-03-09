import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PostCard, type Post } from '../components/post/PostCard';
import { Card } from '../components/ui/Card';
import { Loader2, ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MentionInput } from '../components/ui/MentionInput';
import { formatDistanceToNow } from 'date-fns';
import { VerifiedBadge } from '../components/ui/VerifiedBadge';

interface Comment {
    _id: string;
    text: string;
    user: {
        _id: string;
        username: string;
        displayName: string;
        profileImageUrl?: string;
        verificationTier?: number;
    };
    likes?: string[];
    parentCommentId?: string | null;
    createdAt: string;
}

export const PostDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [post, setPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [replyingTo, setReplyingTo] = useState<{ id: string, username: string } | null>(null);

    useEffect(() => {
        fetchPostAndComments();
    }, [id]);

    const fetchPostAndComments = async () => {
        try {
            const pRes = await fetch(`/api/posts/${id}`);
            if (!pRes.ok) throw new Error('Post not found');
            const pData = await pRes.json();
            setPost({ ...pData, author: pData.authorId || pData.author });

            const cRes = await fetch(`/api/posts/${id}/comments`);
            if (cRes.ok) {
                const cData = await cRes.json();
                // Map userId to user for comments
                const mappedComments = (Array.isArray(cData) ? cData : cData.comments || []).map((c: any) => ({
                    ...c,
                    user: c.userId || c.user,
                }));
                setComments(mappedComments);
            }
        } catch (err: any) {
            setError(err.message || 'Error loading post');
        } finally {
            setLoading(false);
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setSubmitting(true);
        try {
            const res = await fetch(`/api/posts/${id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: newComment,
                    parentCommentId: replyingTo?.id || null
                })
            });

            if (res.ok) {
                const data = await res.json();
                const newC = data.comment || data;
                const mapped = { ...newC, user: newC.userId || newC.user };
                setComments([...comments, mapped]);
                setNewComment('');
                setReplyingTo(null);
                if (post) setPost({ ...post, commentsCount: post.commentsCount + 1 });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center mt-20"><Loader2 className="animate-spin text-secondary" size={32} /></div>;
    }

    if (error || !post) {
        return <div className="text-center mt-20 text-error font-bold">{error || 'Post not found'}</div>;
    }

    const handleLikeComment = async (commentId: string) => {
        try {
            const res = await fetch(`/api/posts/${id}/comments/${commentId}/like`, { method: 'POST' });
            if (res.ok) {
                const updatedLikes = await res.json();
                setComments(prev => prev.map(c => c._id === commentId ? { ...c, likes: updatedLikes } : c));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const renderTextWithLinks = (text: string) => {
        const parts = text.split(/(@\w+|#\w+)/g);
        return parts.map((part, i) => {
            if (part.startsWith('@')) {
                return <a key={i} href={`/u/${part.slice(1)}`} className="text-secondary hover:underline text-shadow-sm" onClick={(e) => e.stopPropagation()}>{part}</a>;
            }
            if (part.startsWith('#')) {
                return <span key={i} className="text-accent-1 hover:underline cursor-pointer">{part}</span>;
            }
            return part;
        });
    };

    const topLevelComments = comments.filter(c => !c.parentCommentId);
    const getReplies = (commentId: string) => comments.filter(c => c.parentCommentId === commentId);

    return (
        <div className="w-full max-w-2xl mx-auto min-h-screen pb-20 md:pb-8 pt-4">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 mb-4">
                <button onClick={() => navigate(-1)} className="text-white hover:text-white/80 p-2 -ml-2">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-bold text-white">Kalesh</h1>
            </div>

            <div className="px-4">
                <PostCard post={post} />

                {/* Comments Section */}
                <div className="mt-8 mb-4">
                    <h2 className="text-lg font-bold text-white mb-4">Bakwaas ({comments.length})</h2>

                    {/* Add Comment */}
                    <Card className="p-4 mb-6 !rounded-lg flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent-2 flex-shrink-0 flex items-center justify-center font-bold text-sm">
                            {user?.displayName.charAt(0).toUpperCase()}
                        </div>
                        <form onSubmit={handleCommentSubmit} className="flex-1 flex flex-col gap-2">
                            {replyingTo && (
                                <div className="text-xs text-white/50 flex justify-between items-center px-1">
                                    <span>Jawab de raha hai <strong>@{replyingTo.username}</strong> ko</span>
                                    <button type="button" onClick={() => setReplyingTo(null)} className="hover:text-white">Chhodo</button>
                                </div>
                            )}
                            <div className="flex gap-2 items-center">
                                <MentionInput
                                    value={newComment}
                                    onChange={setNewComment}
                                    placeholder="Kuch bakwaas likho... (@ to tag)"
                                    className="flex-1 border-none text-sm"
                                    disabled={submitting}
                                />
                                <button
                                    type="submit"
                                    disabled={!newComment.trim() || submitting}
                                    className="text-secondary disabled:text-white/20 disabled:cursor-not-allowed"
                                >
                                    {submitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                                </button>
                            </div>
                        </form>
                    </Card>

                    {/* Comment List */}
                    <div className="space-y-4">
                        {topLevelComments.map(comment => (
                            <div key={comment._id} className="space-y-3">
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-accent-1 flex-shrink-0 overflow-hidden text-center leading-8 font-bold text-sm cursor-pointer" onClick={() => navigate(`/u/${comment.user.username}`)}>
                                        {comment.user.profileImageUrl ? (
                                            <img src={comment.user.profileImageUrl} alt="user" className="w-full h-full object-cover" />
                                        ) : (
                                            comment.user.displayName.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="bg-white/5 rounded-xl p-3">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <span className="font-bold text-sm text-white cursor-pointer hover:underline inline-flex items-center gap-1" onClick={() => navigate(`/u/${comment.user.username}`)}>
                                                    {comment.user.displayName}
                                                    <VerifiedBadge tier={(comment.user as any).verificationTier || 0} size={12} />
                                                </span>
                                                <span className="text-xs text-white/40">
                                                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-white/90 whitespace-pre-wrap">{renderTextWithLinks(comment.text)}</p>
                                        </div>
                                        <div className="flex items-center gap-4 mt-1 px-2 text-xs text-white/50 font-medium">
                                            <button onClick={() => handleLikeComment(comment._id)} className={`hover:text-white ${comment.likes?.includes(user?._id || '') ? 'text-error' : ''}`}>
                                                Achi Lagi {comment.likes && comment.likes.length > 0 ? `(${comment.likes.length})` : ''}
                                            </button>
                                            <button onClick={() => {
                                                setReplyingTo({ id: comment._id, username: comment.user.username });
                                                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                                            }} className="hover:text-white">Jawab de</button>
                                        </div>
                                    </div>
                                </div>

                                {/* Replies render */}
                                {getReplies(comment._id).length > 0 && (
                                    <div className="pl-11 space-y-3 mt-2 border-l border-white/10">
                                        {getReplies(comment._id).map(reply => (
                                            <div key={reply._id} className="flex gap-2">
                                                <div className="w-6 h-6 rounded-full bg-accent-2 flex-shrink-0 overflow-hidden text-center leading-6 font-bold text-xs cursor-pointer" onClick={() => navigate(`/u/${reply.user.username}`)}>
                                                    {reply.user.profileImageUrl ? (
                                                        <img src={reply.user.profileImageUrl} alt="user" className="w-full h-full object-cover" />
                                                    ) : (
                                                        reply.user.displayName.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="bg-white/5 rounded-xl p-3">
                                                        <div className="flex justify-between items-baseline mb-1">
                                                            <span className="font-bold text-xs text-white cursor-pointer hover:underline inline-flex items-center gap-1" onClick={() => navigate(`/u/${reply.user.username}`)}>
                                                                {reply.user.displayName}
                                                                <VerifiedBadge tier={(reply.user as any).verificationTier || 0} size={10} />
                                                            </span>
                                                            <span className="text-[10px] text-white/40">
                                                                {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-white/90 whitespace-pre-wrap">{renderTextWithLinks(reply.text)}</p>
                                                    </div>
                                                    <div className="flex items-center gap-4 mt-1 px-2 text-xs text-white/50 font-medium">
                                                        <button onClick={() => handleLikeComment(reply._id)} className={`hover:text-white ${reply.likes?.includes(user?._id || '') ? 'text-error' : ''}`}>
                                                            Achi Lagi {reply.likes && reply.likes.length > 0 ? `(${reply.likes.length})` : ''}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {comments.length === 0 && (
                            <p className="text-center text-sm text-white/50 py-4">Abhi tak kisi ne koi bakwaas nahi ki. Tu hi shuru ho ja!</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
