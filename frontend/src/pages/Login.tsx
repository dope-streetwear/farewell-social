import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { Card } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const { login, user, loading: authLoading } = useAuth();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    React.useEffect(() => {
        if (!authLoading && user) {
            navigate('/feed');
        }
    }, [user, authLoading, navigate]);

    const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
        if (!credentialResponse.credential) {
            setError('Google sign-in failed. Please try again.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: credentialResponse.credential }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || 'Authentication failed');
                return;
            }

            if (data.needsSignup) {
                // New user — send to signup page with their Google info pre-filled
                navigate('/signup', {
                    state: {
                        credential: credentialResponse.credential,
                        email: data.email,
                        name: data.name,
                        picture: data.picture,
                        googleId: data.googleId,
                    }
                });
            } else {
                // Existing user — logged in
                login(data);
                navigate('/feed');
            }
        } catch {
            setError('Network error. Make sure the server is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] p-4">
            <Card className="w-full max-w-md p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-white mb-2">Welcome Back</h1>
                    <p className="text-white/60 text-sm">Sign in with your Google account to continue</p>
                </div>

                {error && (
                    <div className="bg-error/20 border border-error text-error p-3 rounded-md mb-6 text-sm">
                        {error}
                    </div>
                )}

                <div className="flex flex-col items-center gap-6">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white/70 w-full">
                        <p className="font-bold text-white mb-1">First time here?</p>
                        <p>Clicking Sign in will take you to a one-time Narayana ID verification step to confirm you're part of the batch.</p>
                    </div>

                    {loading ? (
                        <div className="flex items-center gap-2 text-white/60 text-sm">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Verifying with Google...
                        </div>
                    ) : (
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError('Google sign-in was cancelled or failed.')}
                            theme="filled_black"
                            shape="rectangular"
                            size="large"
                            text="signin_with"
                            width="320"
                        />
                    )}
                </div>

                <p className="text-center text-white/40 mt-8 text-xs">
                    Don't have an account? Just click Sign in with Google — if you're new, we'll guide you through verification.
                </p>
                <p className="text-center text-white/30 mt-2 text-xs">
                    Having trouble? <Link to="/signup" className="text-secondary hover:underline">Go to signup directly</Link>
                </p>
            </Card>
        </div>
    );
};
