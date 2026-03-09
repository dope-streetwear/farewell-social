import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface StoryGroup {
    user: {
        _id: string;
        username: string;
        displayName: string;
        profileImageUrl?: string;
    };
    stories: { _id: string; viewers: string[] }[];
}

export const StoryBar: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [groups, setGroups] = useState<StoryGroup[]>([]);

    useEffect(() => {
        if (!user) return;
        const fetchStories = async () => {
            try {
                const res = await fetch('/api/stories');
                if (res.ok) setGroups(await res.json());
            } catch { }
        };
        fetchStories();
    }, [user]);

    if (!user) return null;

    return (
        <div className="flex gap-3 overflow-x-auto pb-4 mb-4 scrollbar-hide">
            {/* Add story */}
            <button
                onClick={() => navigate('/stories')}
                className="flex flex-col items-center gap-1 flex-shrink-0"
            >
                <div className="w-14 h-14 rounded-full bg-white/10 border-2 border-dashed border-secondary/60 flex items-center justify-center">
                    <Plus size={20} className="text-secondary" />
                </div>
                <span className="text-[10px] text-white/50 font-bold">Add</span>
            </button>

            {/* Story circles */}
            {groups.map(group => {
                const hasUnviewed = group.stories.some(s => !s.viewers.includes(user._id));
                return (
                    <button
                        key={group.user._id}
                        onClick={() => navigate('/stories')}
                        className="flex flex-col items-center gap-1 flex-shrink-0"
                    >
                        <div className={`w-14 h-14 rounded-full p-0.5 ${hasUnviewed ? 'bg-gradient-to-br from-secondary via-accent-1 to-accent-2' : 'bg-white/20'}`}>
                            <div className="w-full h-full rounded-full bg-bg-dark p-0.5">
                                <div className="w-full h-full rounded-full bg-accent-1 overflow-hidden flex items-center justify-center text-white font-bold text-sm">
                                    {group.user.profileImageUrl ? (
                                        <img src={group.user.profileImageUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        group.user.displayName.charAt(0).toUpperCase()
                                    )}
                                </div>
                            </div>
                        </div>
                        <span className="text-[10px] text-white/60 font-bold max-w-[56px] truncate">
                            {group.user._id === user._id ? 'Tu' : group.user.displayName.split(' ')[0]}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};
