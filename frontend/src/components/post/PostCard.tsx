import { useState, useEffect, useRef } from 'react';
import type React from 'react';
import { Card } from '../ui/Card';
import { Heart, MessageCircle, Bookmark, Share, MoreHorizontal, Music, Play, Pause, X, Repeat, Lock, CalendarClock } from 'lucide-react';
import { formatDistanceToNow, isFuture } from 'date-fns';
import { VerifiedBadge } from '../ui/VerifiedBadge';

export interface Post {
    _id: string;
    author: {
        _id: string;
        username: string;
        displayName: string;
        profileImageUrl?: string;
        verificationTier?: number;
    };
    mediaUrl?: string;
    mediaUrl2?: string;
    type?: 'REGULAR' | 'THEN_VS_NOW';
    mediaType: 'image' | 'video' | 'none';
    caption?: string;
    tags?: string[];
    songTitle?: string;
    artistName?: string;
    audioPreviewUrl?: string;
    audioStartTime?: number;
    unlockDate?: string;
    likesCount: number;
    commentsCount: number;
    createdAt: string;
    isLikedByMe?: boolean;
    isSavedByMe?: boolean;
    repostOf?: Post;
}

interface PostCardProps {
    post: Post;
    onLike?: (postId: string) => void;
    onSave?: (postId: string) => void;
    onCommentClick?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onLike, onSave, onCommentClick }) => {
    const [isLiked, setIsLiked] = useState(post.isLikedByMe || false);
    const [likesCount, setLikesCount] = useState(post.likesCount);
    const [isSaved, setIsSaved] = useState(post.isSavedByMe || false);

    // Audio Player State
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const timerRef = useRef<number | null>(null);

    // Double Tap Like Animation State
    const [showHeart, setShowHeart] = useState(false);

    // Lightbox State
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    // Time Capsule State
    const isLocked = post.unlockDate ? isFuture(new Date(post.unlockDate)) : false;

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
            }
        };
    }, []);

    const handleRepost = async () => {
        try {
            const endpointPostId = post.repostOf ? post.repostOf._id : post._id; // Repost the original if clicking repost on a repost
            const res = await fetch(`/api/posts/${endpointPostId}/repost`, { method: 'POST' });
            if (res.ok) {
                alert('Machha diya! Teri profile pe lag gaya.');
            } else {
                alert('Arey yaar, repost fail ho gaya');
            }
        } catch (e) {
            console.error('Repost failed', e);
        }
    };

    const togglePlay = () => {
        if (!post.audioPreviewUrl) return;

        if (isPlaying && audioRef.current) {
            audioRef.current.pause();
            if (timerRef.current) clearTimeout(timerRef.current);
            setIsPlaying(false);
        } else {
            // Clean up old audio
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.onended = null;
                audioRef.current = null;
            }
            if (timerRef.current) clearTimeout(timerRef.current);

            // Create fresh audio
            const audio = new Audio(post.audioPreviewUrl);
            audio.volume = 0.5;
            audioRef.current = audio;

            audio.addEventListener('loadedmetadata', () => {
                audio.currentTime = post.audioStartTime || 0;
                audio.play()
                    .then(() => {
                        setIsPlaying(true);
                        // Force stop after 15 seconds (the max length of our snippet)
                        timerRef.current = window.setTimeout(() => {
                            if (audioRef.current) {
                                audioRef.current.pause();
                                setIsPlaying(false);
                            }
                        }, 15000);
                    })
                    .catch(() => setIsPlaying(false));
            });

            audio.addEventListener('ended', () => {
                setIsPlaying(false);
                if (timerRef.current) clearTimeout(timerRef.current);
            });
        }
    };

    const handleLike = async () => {
        // optimistic update
        setIsLiked(!isLiked);
        setLikesCount(prev => isLiked ? prev - 1 : prev + 1);

        try {
            await fetch(`/api/posts/${post._id}/like`, { method: 'POST' });
            if (onLike) onLike(post._id);
        } catch {
            // revert if failed — use the original values captured in closure
            setIsLiked(isLiked);
            setLikesCount(likesCount);
        }
    };

    const handleDoubleTapLike = () => {
        if (!isLiked) handleLike();
        setShowHeart(true);
        setTimeout(() => setShowHeart(false), 800);
    };

    const handleSave = async () => {
        setIsSaved(!isSaved);
        try {
            await fetch(`/api/posts/${post._id}/save`, { method: 'POST' });
            if (onSave) onSave(post._id);
        } catch {
            setIsSaved(isSaved);
        }
    };

    const renderTextWithLinks = (text: string) => {
        const parts = text.split(/(@\w+|#\w+)/g);
        return parts.map((part, i) => {
            if (part.startsWith('@')) {
                return <a key={i} href={`/u/${part.slice(1)}`} className="text-secondary hover:underline" onClick={(e) => e.stopPropagation()}>{part}</a>;
            }
            if (part.startsWith('#')) {
                return <span key={i} className="text-accent-1 hover:underline cursor-pointer">{part}</span>;
            }
            return part;
        });
    };

    if (post.repostOf) {
        return (
            <div className="w-full mb-6 relative pt-4">
                <div className="absolute top-0 left-4 text-[11px] font-bold text-white/50 flex items-center gap-1.5 z-10 bg-bg-dark px-3 py-1 rounded-t-lg border-t border-l border-r border-white/10 uppercase tracking-wider">
                    <Repeat size={12} className="text-secondary" />
                    <span>{post.author.displayName} ne baans mara (repost)</span>
                </div>
                <div className="border border-white/10 rounded-xl overflow-hidden relative z-20">
                    <PostCard post={post.repostOf} onLike={onLike} onSave={onSave} onCommentClick={onCommentClick} />
                </div>
            </div>
        );
    }

    return (
        <Card className="w-full mb-6">
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent-1 overflow-hidden">
                        {post.author.profileImageUrl ? (
                            <img src={post.author.profileImageUrl} alt={post.author.username} className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full text-white font-bold">
                                {post.author.displayName.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div>
                        <h4 className="font-bold text-white text-sm leading-tight flex items-center gap-1">
                            {post.author.displayName}
                            <VerifiedBadge tier={post.author.verificationTier || 0} />
                        </h4>
                        <p className="text-white/60 text-xs">@{post.author.username} &bull; {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</p>
                    </div>
                </div>
                <button className="text-white/60 hover:text-white">
                    <MoreHorizontal size={20} />
                </button>
            </div>

            {/* Media Content */}
            {post.mediaUrl && (
                <>
                    <div
                        className={`w-full relative bg-bg-dark max-h-[600px] flex items-center justify-center overflow-hidden cursor-pointer select-none ${post.type === 'THEN_VS_NOW' ? 'aspect-video sm:aspect-auto sm:h-[400px]' : ''}`}
                        onDoubleClick={handleDoubleTapLike}
                        onClick={() => post.mediaType === 'image' && setIsLightboxOpen(true)}
                    >
                        {/* Media content */}
                        {post.type === 'THEN_VS_NOW' ? (
                            <div className={`w-full h-full relative grid grid-cols-2 gap-1 ${isLocked ? 'filter blur-2xl scale-110 opacity-60 pointer-events-none' : ''}`}>
                                <div className="relative w-full h-full bg-black/50">
                                    <img src={post.mediaUrl} alt="Then" className="w-full h-full object-cover pointer-events-none" />
                                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded backdrop-blur-sm">THEN</div>
                                </div>
                                <div className="relative w-full h-full bg-black/50">
                                    {post.mediaUrl2 ? (
                                        <img src={post.mediaUrl2} alt="Now" className="w-full h-full object-cover pointer-events-none" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white/30 text-xs text-center p-4">Image Missing</div>
                                    )}
                                    <div className="absolute bottom-2 right-2 bg-secondary text-primary text-xs font-bold px-2 py-1 rounded backdrop-blur-sm">NOW</div>
                                </div>
                            </div>
                        ) : (
                            <div className={`w-full h-full relative ${isLocked ? 'filter blur-2xl scale-110 opacity-60 pointer-events-none' : ''}`}>
                                {post.mediaType === 'image' ? (
                                    <img src={post.mediaUrl} alt="Post media" className="w-full h-full object-contain pointer-events-none" />
                                ) : post.mediaType === 'video' ? (
                                    <video src={post.mediaUrl} controls={!isLocked} className="w-full pl-0.5 object-contain" />
                                ) : null}
                            </div>
                        )}

                        {/* Locked Overlay */}
                        {isLocked && (
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none p-6 text-center">
                                <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mb-4 border border-secondary/50 shadow-[0_0_30px_rgba(255,200,87,0.3)]">
                                    <Lock size={32} className="text-secondary" />
                                </div>
                                <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-widest drop-shadow-lg">Time Capsule</h3>
                                <div className="bg-bg-dark border border-white/20 px-4 py-2 rounded-full flex items-center gap-2">
                                    <CalendarClock size={16} className="text-secondary" />
                                    <span className="text-white font-bold text-sm">Unlocks in {formatDistanceToNow(new Date(post.unlockDate!))}</span>
                                </div>
                            </div>
                        )}

                        {/* Like Animation Overlay */}
                        {showHeart && !isLocked && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                                <Heart size={100} className="fill-white text-white opacity-80 animate-ping duration-300" />
                                <Heart size={100} className="absolute fill-white text-white shadow-2xl scale-150 transition-transform duration-300" style={{ animation: 'pop-in 0.3s cubic-bezier(0.17, 0.89, 0.32, 1.49)' }} />
                            </div>
                        )}
                    </div>

                    {/* Fullscreen Lightbox */}
                    {isLightboxOpen && post.mediaType === 'image' && !isLocked && (
                        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setIsLightboxOpen(false)}>
                            <button
                                className="absolute top-4 right-4 text-white hover:text-white/70 p-2 z-50 bg-black/50 rounded-full"
                                onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(false); }}
                            >
                                <X size={24} />
                            </button>
                            {post.type === 'THEN_VS_NOW' ? (
                                <div className="w-full max-w-5xl h-full flex flex-col md:flex-row items-center justify-center gap-4 py-12" onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => { e.stopPropagation(); handleDoubleTapLike(); setIsLightboxOpen(false); }}>
                                    <div className="relative w-full md:w-1/2 h-1/2 md:h-full">
                                        <img src={post.mediaUrl} alt="Then" className="w-full h-full object-contain" />
                                        <div className="absolute top-4 left-4 bg-black/60 text-white text-xl font-bold px-4 py-2 rounded-lg backdrop-blur-sm shadow-xl">THEN</div>
                                    </div>
                                    <div className="relative w-full md:w-1/2 h-1/2 md:h-full">
                                        {post.mediaUrl2 ? (
                                            <img src={post.mediaUrl2} alt="Now" className="w-full h-full object-contain" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-white/30 text-xs text-center p-4">Image Missing</div>
                                        )}
                                        <div className="absolute top-4 right-4 bg-secondary text-primary text-xl font-bold px-4 py-2 rounded-lg backdrop-blur-sm shadow-xl">NOW</div>
                                    </div>
                                </div>
                            ) : (
                                <img
                                    src={post.mediaUrl}
                                    alt="Fullscreen post"
                                    className="max-w-full max-h-full object-contain cursor-default"
                                    onClick={(e) => e.stopPropagation()}
                                    onDoubleClick={(e) => { e.stopPropagation(); handleDoubleTapLike(); setIsLightboxOpen(false); }}
                                />
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Audio Banner */}
            {post.audioPreviewUrl && !isLocked && (
                <div className="w-full bg-accent-1/10 border-b border-accent-1/20 p-2 px-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden w-full mr-4">
                        <Music size={14} className="text-secondary flex-shrink-0" />
                        <div className="overflow-hidden w-full whitespace-nowrap">
                            <p className="text-xs text-secondary font-bold animate-marquee">
                                {post.songTitle} &bull; {post.artistName} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {post.songTitle} &bull; {post.artistName}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={togglePlay}
                        className="w-8 h-8 rounded-full bg-secondary text-primary flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform"
                    >
                        {isPlaying ? <Pause size={14} className="fill-primary" /> : <Play size={14} className="fill-primary pl-0.5" />}
                    </button>
                </div>
            )}

            {/* Action Buttons */}
            <div className={`p-4 pb-2 flex items-center justify-between ${isLocked ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleLike}
                        className={`flex items-center gap-1.5 transition-colors ${isLiked ? 'text-error' : 'text-white hover:text-white/80'}`}
                    >
                        <Heart size={24} className={isLiked ? 'fill-error' : ''} />
                        <span className="font-bold">{likesCount}</span>
                    </button>
                    <button
                        onClick={() => onCommentClick && onCommentClick(post._id)}
                        className="flex items-center gap-1.5 text-white hover:text-white/80 transition-colors"
                    >
                        <MessageCircle size={24} />
                        <span className="font-bold">{post.commentsCount}</span>
                    </button>
                    {post.mediaUrl && (
                        <button
                            className="text-white hover:text-white/80 transition-colors cursor-pointer"
                            title="Share Post"
                            onClick={async () => {
                                try {
                                    if (navigator.share) {
                                        await navigator.share({
                                            title: `Post by ${post.author.displayName}`,
                                            text: post.caption || 'Bhai ye dekh, Farewell Social pe kya tehelka macha hai',
                                            url: `${window.location.origin}/#/post/${post._id}`
                                        });
                                    } else {
                                        // Fallback: Copy link to clipboard
                                        await navigator.clipboard.writeText(`${window.location.origin}/#/post/${post._id}`);
                                        alert('Link copy ho gaya! Jaa ke faila de.');
                                    }
                                } catch (e) {
                                    console.error('Share failed', e);
                                }
                            }}
                        >
                            <Share size={24} />
                        </button>
                    )}
                    <button
                        className="text-white hover:text-white/80 transition-colors cursor-pointer ml-1"
                        title="Repost"
                        onClick={handleRepost}
                    >
                        <Repeat size={24} />
                    </button>
                </div>
                <button
                    onClick={handleSave}
                    className={`transition-colors ${isSaved ? 'text-secondary' : 'text-white hover:text-white/80'}`}
                >
                    <Bookmark size={24} className={isSaved ? 'fill-secondary' : ''} />
                </button>
            </div>

            {/* Caption Section */}
            <div className="px-4 pb-4">
                {post.caption && (
                    <p className={`text-sm text-white/90 ${isLocked ? 'select-none blur-sm opacity-50' : ''}`}>
                        <span className="font-bold mr-2">{post.author.username}</span>
                        {isLocked ? 'This caption is locked inside the time capsule' : renderTextWithLinks(post.caption)}
                    </p>
                )}
            </div>
        </Card>
    );
};
