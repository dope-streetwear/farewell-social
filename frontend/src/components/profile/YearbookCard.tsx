import React from 'react';
import { formatDistanceToNow } from 'date-fns';

interface YearbookCardProps {
    author: {
        username: string;
        displayName: string;
        profileImageUrl?: string;
    };
    message: string;
    color: string;
    createdAt: Date;
}

export const YearbookCard: React.FC<YearbookCardProps> = ({ author, message, color, createdAt }) => {
    return (
        <div
            className="p-4 rounded-2xl relative shadow-lg transform transition-transform hover:scale-[1.02] cursor-default"
            style={{
                backgroundColor: `${color}15`, // Very light version of the color for background
                border: `2px solid ${color}40`,
                minHeight: '120px'
            }}
        >
            <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-accent-1 overflow-hidden">
                    {author.profileImageUrl ? (
                        <img src={author.profileImageUrl} alt={author.username} className="w-full h-full object-cover" />
                    ) : (
                        <div className="flex items-center justify-center w-full h-full text-white text-xs font-black">
                            {author.displayName.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                <div>
                    <span className="block text-sm font-black text-white leading-none">{author.displayName}</span>
                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-tighter">@{author.username}</span>
                </div>
            </div>

            <p className="text-lg font-bold leading-tight mb-4" style={{ color: color, fontFamily: "'Dancing Script', cursive, sans-serif" }}>
                {message}
            </p>

            <div className="absolute bottom-3 right-4 text-[10px] font-bold text-white/30 uppercase">
                {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </div>
        </div>
    );
};
