import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PostCard, type Post } from '../components/post/PostCard';
import { Button } from '../components/ui/Button';
import { PenSquare, Loader2 } from 'lucide-react';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { StoryBar } from '../components/stories/StoryBar';
import { FlashChallengeCard } from '../components/ui/FlashChallengeCard';
import { api } from '../utils/api';

export const Feed: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [spotlightUser, setSpotlightUser] = useState(null);
    const [spotlightLoading, setSpotlightLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchPosts();
        fetchSpotlight();
    }, []);

    const fetchSpotlight = async () => {
        try {
            const data = await api('/api/users/spotlight');
            setSpotlightUser(data);
        } catch (err) {
            console.error('Spotlight fetch error:', err);
        } finally {
            setSpotlightLoading(false);
        }
    };

    const fetchPosts = async () => {
        try {
            const data = await api('/api/posts?page=1&limit=20');
            // Map backend field names to frontend Post interface
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mapped = (data || []).map((p: any) => ({
                ...p,
                author: p.authorId || p.author,
            }));
            setPosts(mapped);
        } catch (err: any) {
            console.error('Network error fetching posts:', err);
            setError(err.message || 'Network error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto min-h-screen pb-20 md:pb-8 pt-4">
            {/* Feed Header */}
            <div className="flex items-center justify-between px-4 mb-6">
                <h1 className="text-2xl font-black tracking-tight text-white">Global Feed</h1>
                <Button size="sm" onClick={() => navigate('/create')} className="gap-2">
                    <PenSquare size={16} /> New Post
                </Button>
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
                        <h3 className="text-xl font-bold mb-2">No posts here yet!</h3>
                        <p>Chalo, be the first one to start the fire!</p>
                        <Button className="mt-4" onClick={() => navigate('/create')}>Create New Post</Button>
                    </div>
                </div>
            ) : (
                <div className="px-4">
                    <StoryBar />
                    <FlashChallengeCard />
                    <SpotlightCard user={spotlightUser} loading={spotlightLoading} />
                    {posts.map(post => (
                        <PostCard key={post._id} post={post} />
                    ))}
                </div>
            )}
        </div>
    );
};
