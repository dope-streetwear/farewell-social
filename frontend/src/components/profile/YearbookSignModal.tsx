import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { X, Loader2, Sparkles } from 'lucide-react';

interface YearbookSignModalProps {
    onClose: () => void;
    onSuccess: (newEntry: any) => void;
    targetUsername: string;
}

const COLORS = [
    { name: 'Yellow', value: '#FFC857' },
    { name: 'Blue', value: '#4D96FF' },
    { name: 'Red', value: '#FF6B6B' },
    { name: 'Green', value: '#6BCB77' },
    { name: 'Purple', value: '#9B5FE0' },
    { name: 'Orange', value: '#F97316' }
];

export const YearbookSignModal: React.FC<YearbookSignModalProps> = ({ onClose, onSuccess, targetUsername }) => {
    const [message, setMessage] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[0].value);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!message) return setError('Please write something!');
        if (message.length > 500) return setError('Keep it concise! (max 500 chars)');

        setIsSubmitting(true);
        setError('');
        try {
            const res = await fetch(`/api/yearbook/${targetUsername}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, color: selectedColor })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to sign yearbook');
            }

            const newEntry = await res.json();
            onSuccess(newEntry);
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-bg-card w-full max-w-md rounded-2xl p-6 relative border border-secondary/30 shadow-[0_0_30px_rgba(255,200,87,0.15)]">
                <button
                    className="absolute top-4 right-4 text-white/50 hover:text-white"
                    onClick={onClose}
                >
                    <X size={24} />
                </button>

                <div className="flex items-center gap-2 mb-6">
                    <Sparkles className="text-secondary" size={20} />
                    <h2 className="text-xl text-white font-black uppercase tracking-widest">Sign Yearbook</h2>
                </div>

                {error && (
                    <div className="bg-error/20 text-error p-3 rounded-xl mb-4 text-sm font-bold">
                        {error}
                    </div>
                )}

                <div className="flex flex-col gap-6">
                    <div>
                        <label className="block text-xs font-bold text-white/60 mb-2 uppercase">Your Message</label>
                        <textarea
                            className="w-full bg-black/20 text-white rounded-xl px-4 py-3 border border-white/10 focus:border-secondary focus:outline-none h-32 resize-none placeholder:text-white/20 font-medium"
                            placeholder="Write a farewell wish, a memory, or just a signature..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            style={{ color: selectedColor, fontFamily: "'Dancing Script', cursive, sans-serif", fontSize: '1.2rem' }}
                        />
                        <div className="text-right mt-1">
                            <span className={`text-[10px] font-bold ${message.length > 450 ? 'text-error' : 'text-white/30'}`}>
                                {message.length}/500
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-white/60 mb-3 uppercase tracking-tighter">Choose Your Ink Color</label>
                        <div className="flex gap-3">
                            {COLORS.map(color => (
                                <button
                                    key={color.value}
                                    className={`w-10 h-10 rounded-full border-2 transition-all ${selectedColor === color.value ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}
                                    style={{ backgroundColor: color.value }}
                                    onClick={() => setSelectedColor(color.value)}
                                    title={color.name}
                                />
                            ))}
                        </div>
                    </div>

                    <Button
                        variant="primary"
                        className="w-full mt-2 font-black py-4 shadow-xl"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? <Loader2 className="animate-spin mx-auto text-primary" /> : 'SIGN THE WALL'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
