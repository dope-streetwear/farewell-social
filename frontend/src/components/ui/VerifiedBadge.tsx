import type React from 'react';
import { BadgeCheck } from 'lucide-react';

// Tier 0 = No badge, 1 = Silver, 2 = Blue, 3 = Yellow (Gold), 4 = Purple, 5 = Red
const TIER_CONFIG: Record<number, { label: string; color: string; fill: string }> = {
    1: { label: 'Silver', color: '#94a3b8', fill: '#64748b' },
    2: { label: 'Blue', color: '#38bdf8', fill: '#0284c7' },
    3: { label: 'Gold', color: '#fbbf24', fill: '#d97706' },
    4: { label: 'Purple', color: '#a78bfa', fill: '#7c3aed' },
    5: { label: 'Red', color: '#f87171', fill: '#dc2626' },
};

interface VerifiedBadgeProps {
    tier: number;
    size?: number;
    className?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ tier, size = 14, className = '' }) => {
    if (!tier || tier < 1 || tier > 5) return null;

    const config = TIER_CONFIG[tier];

    return (
        <span title={`${config.label} Verified`} className="inline-flex items-center justify-center">
            <BadgeCheck
                size={size}
                className={`flex-shrink-0 ${className}`}
                style={{ color: config.color, fill: config.fill }}
            />
        </span>
    );
};

export const TIER_OPTIONS = [
    { value: 0, label: 'None', color: 'transparent' },
    { value: 1, label: 'Silver', color: '#94a3b8' },
    { value: 2, label: 'Blue', color: '#38bdf8' },
    { value: 3, label: 'Gold', color: '#fbbf24' },
    { value: 4, label: 'Purple', color: '#a78bfa' },
    { value: 5, label: 'Red', color: '#f87171' },
];
