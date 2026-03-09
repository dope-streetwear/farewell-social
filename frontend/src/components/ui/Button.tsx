import type React from 'react';
import { type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'accent1' | 'accent2' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    className = '',
    disabled,
    ...props
}) => {
    const baseClasses = 'btn-solid inline-flex items-center justify-center font-bold rounded-lg transition-transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none';

    const variants = {
        primary: 'bg-primary text-white border border-white/20 hover:bg-primary/90',
        secondary: 'bg-secondary text-primary hover:bg-secondary/90',
        accent1: 'bg-accent-1 text-white hover:bg-accent-1/90',
        accent2: 'bg-accent-2 text-white hover:bg-accent-2/90',
        danger: 'bg-error text-white hover:bg-error/90',
        ghost: 'bg-transparent text-white hover:bg-white/10 active:bg-white/20',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
    };

    return (
        <button
            className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
};
