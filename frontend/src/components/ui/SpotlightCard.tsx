import type React from 'react';
import { Star, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { VerifiedBadge } from './VerifiedBadge';

interface SpotlightUser {
    username: string;
    displayName: string;
    profileImageUrl?: string;
    user_class?: string;
    verificationTier?: number;
}

interface SpotlightCardProps {
    user: SpotlightUser | null;
    loading: boolean;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({ user, loading }) => {
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 animate-pulse">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/10"></div>
                    <div className="flex-1">
                        <div className="h-4 w-24 bg-white/10 rounded mb-2"></div>
                        <div className="h-3 w-32 bg-white/10 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div
            className="w-full relative overflow-hidden bg-gradient-to-br from-secondary/20 via-primary to-bg-dark border border-secondary/30 rounded-2xl p-6 mb-8 shadow-[0_0_30px_rgba(255,200,87,0.1)] group cursor-pointer transition-all hover:border-secondary/50"
            onClick={() => navigate(`/u/${user.username}`)}
        >
            {/* Decorative Background Elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-secondary/10 rounded-full blur-3xl group-hover:bg-secondary/20 transition-colors"></div>
            <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <Star size={120} className="text-secondary fill-secondary" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-secondary p-1 shadow-lg ring-4 ring-secondary/20">
                        <div className="w-full h-full rounded-full bg-bg-dark overflow-hidden">
                            {user.profileImageUrl ? (
                                <img src={user.profileImageUrl} alt={user.username} className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex items-center justify-center w-full h-full text-white text-2xl font-black">
                                    {user.displayName.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-secondary text-primary p-1 rounded-full shadow-lg border-2 border-bg-dark">
                        <Star size={14} className="fill-current" />
                    </div>
                </div>

                <div className="flex-1 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-[10px] font-black uppercase tracking-widest mb-3">
                        Main Character of the Day
                    </div>
                    <h2 className="text-2xl font-black text-white flex items-center justify-center md:justify-start gap-2">
                        {user.displayName}
                        <VerifiedBadge tier={user.verificationTier || 0} />
                    </h2>
                    <p className="text-white/60 font-medium">@{user.username} {user.user_class && `• ${user.user_class}`}</p>
                </div>

                <div className="flex items-center gap-2 text-secondary font-black uppercase text-xs tracking-widest group-hover:translate-x-2 transition-transform">
                    View Profile <ArrowRight size={16} />
                </div>
            </div>
        </div>
    );
};
