import type React from 'react';
import { type HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
    return (
        <div className={`card bg-primary rounded-xl border border-white/10 overflow-hidden ${className}`} {...props}>
            {children}
        </div>
    );
};
