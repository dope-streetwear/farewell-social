import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldAlert, KeyRound, Mail } from 'lucide-react';

export const AdminAuth = () => {
    const [passcode, setPasscode] = useState('');
    const [isBackupMode, setIsBackupMode] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passcode, isBackupCode: isBackupMode })
            });

            const data = await res.json();
            if (res.ok) {
                navigate('/admin/dashboard');
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleFallback = async () => {
        // Placeholder for simple OTP/Mock Google Auth
        const email = prompt("Enter Admin Recovery Email (Mock Google Auth):");
        if (!email) return;

        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/admin/google-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (res.ok) {
                navigate('/admin/dashboard');
            } else {
                setError(data.message || 'Unauthorized email');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-bg-dark">
            <div className="max-w-md w-full glassmorphism p-8 rounded-2xl flex flex-col items-center">
                <div className="w-16 h-16 bg-accent-1/20 rounded-full flex items-center justify-center mb-6">
                    <ShieldAlert size={32} className="text-accent-1" />
                </div>

                <h1 className="text-2xl font-black text-secondary mb-2">RESTRICTED ACCESS</h1>
                <p className="text-white/60 text-sm mb-8 text-center">
                    NARAYANASOCIAL Admin Portal. Enter your credentials to proceed.
                </p>

                {error && (
                    <div className="w-full bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-lg mb-6 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="w-full">
                    <div className="mb-6 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            {isBackupMode ? <KeyRound size={20} className="text-white/40" /> : <Lock size={20} className="text-white/40" />}
                        </div>
                        <input
                            type={isBackupMode ? "text" : "password"}
                            value={passcode}
                            onChange={(e) => setPasscode(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-accent-1 focus:ring-1 focus:ring-accent-1 transition-colors"
                            placeholder={isBackupMode ? "Enter Alpha-Numeric Backup Code" : "Enter 10-Digit Master Code"}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-accent-1 hover:bg-accent-1/90 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
                    >
                        {loading ? 'VERIFYING...' : 'AUTHORIZE'}
                    </button>
                </form>

                <div className="w-full mt-6 space-y-3">
                    <button
                        onClick={() => {
                            setIsBackupMode(!isBackupMode);
                            setPasscode('');
                            setError('');
                        }}
                        className="w-full text-white/60 hover:text-white text-sm transition-colors text-center"
                    >
                        {isBackupMode ? "Use Master Code instead" : "Use Backup Code instead"}
                    </button>

                    <button
                        onClick={handleGoogleFallback}
                        className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 py-2 rounded-xl transition-colors text-sm"
                    >
                        <Mail size={16} />
                        Mock Google Auth Fallback
                    </button>
                </div>
            </div>
        </div>
    );
};
