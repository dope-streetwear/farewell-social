import type React from 'react';
import { Shield, Lock, EyeOff } from 'lucide-react';

export const PrivacyBadge: React.FC = () => {
    return (
        <div className="flex flex-wrap items-center justify-center gap-3 my-4">
            <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-3 py-1.5 rounded-full text-xs font-bold text-white/90">
                <Shield size={14} className="text-secondary" />
                <span>Privacy protected</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-3 py-1.5 rounded-full text-xs font-bold text-white/90">
                <Lock size={14} className="text-error" />
                <span>No outsiders</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-3 py-1.5 rounded-full text-xs font-bold text-white/90">
                <EyeOff size={14} className="text-accent-1" />
                <span>No Tension</span>
            </div>
        </div>
    );
};
