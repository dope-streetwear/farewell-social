import React, { useState, useEffect } from 'react';

import { PostCard, type Post } from '../components/post/PostCard';
import { Loader2, Bookmark } from 'lucide-react';

export const SavedPosts: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSavedPosts();
    }, []);

    const fetchSavedPosts = async () => {
        try {
            const res = await fetch('/api/posts/saved/me');
            if (res.ok) {
                const data = await res.json();
                const mappedPosts = (data || []).map((p: any) => ({
                    ...p,
                    author: p.authorId,
                    authorId: p.authorId?._id || p.authorId
                }));
                setPosts(mappedPosts);
            } else {
                setError('Failed to fetch saved posts');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto min-h-screen pb-20 md:pb-8 pt-4">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 mb-6">
                <Bookmark size={28} className="text-secondary" />
                <h1 className="text-2xl font-black tracking-tight text-white">Saved Memories</h1>
            </div>

            {error ? (
                <div className="px-4 text-center mt-8 text-error">{error}</div>
            ) : loading ? (
                <div className="flex justify-center mt-12">
                    <Loader2 className="animate-spin text-secondary" size={32} />
                </div>
            ) : posts.length === 0 ? (
                <div className="px-4 text-center mt-12 text-white/60">
                    <div className="bg-primary border border-white/10 rounded-xl p-8">
                        <h3 className="text-xl font-bold mb-2">Nothing saved yet!</h3>
                        <p>Items you save will appear here baad me maze lene ke liye.</p>
                    </div>
                </div>
            ) : (
                <div className="px-4">
                    {posts.map(post => (
                        <PostCard
                            key={post._id}
                            post={post}
                            onSave={(id) => {
                                // Remove from list optimistically if unsaved
                                setPosts(prev => prev.filter(p => p._id !== id));
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
