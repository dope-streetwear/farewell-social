import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../utils/api';

interface GoogleState {
    credential: string;
    email: string;
    name: string;
    picture: string;
}

export const Signup: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, user, loading: authLoading } = useAuth();

    // Prevent authenticated users from staying on signup page
    useEffect(() => {
        if (!authLoading && user) {
            navigate('/feed');
        }
    }, [user, authLoading, navigate]);

    // Step 1 = Google auth, Step 2 = fill details + upload ID
    const [step, setStep] = useState<1 | 2>(1);
    const [googleState, setGoogleState] = useState<GoogleState | null>(null);

    const [username, setUsername] = useState('');
    const [classSection, setClassSection] = useState('');
    const [verificationImage, setVerificationImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // If redirected from login page with Google info already filled
    useEffect(() => {
        const state = location.state as GoogleState | null;
        if (state?.credential) {
            setGoogleState(state);
            setStep(2);
        }
    }, [location.state]);

    const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
        if (!credentialResponse.credential) {
            setError('Google sign-in failed. Please try again.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const apiUrl = getApiUrl();
            const res = await fetch(`${apiUrl}/api/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: credentialResponse.credential }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.message || 'Google authentication failed');
                return;
            }

            if (!data.needsSignup) {
                // Already registered — redirect to feed
                login(data);
                navigate('/feed');
                return;
            }

            // New user — move to step 2
            setGoogleState({
                credential: credentialResponse.credential,
                email: data.email,
                name: data.name,
                picture: data.picture,
            });
            setStep(2);
        } catch (err: any) {
            setError(err.message || 'Network error. Make sure the server is running.');
        } finally {
            setLoading(false);
        }
    };

    const handleSignupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!googleState) return;

        setError('');

        if (!username.trim()) {
            setError('Please choose a username.');
            return;
        }
        if (!verificationImage) {
            setError('Please upload your Narayana ID card or nConnect App screenshot.');
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append('credential', googleState.credential);
        formData.append('username', username.trim());
        if (classSection) formData.append('classSection', classSection);
        formData.append('verificationImage', verificationImage);

        try {
            const apiUrl = getApiUrl();
            const res = await fetch(`${apiUrl}/api/auth/google/signup`, {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();

            if (res.ok) {
                login(data);
                navigate('/feed');
            } else {
                setError(data.message || 'Signup failed');
            }
        } catch (err: any) {
            setError(err.message || 'Network error. Make sure the server is running.');
        } finally {
            setLoading(false);
        }
    };

    // ── Step 1: Google Sign In ──────────────────────────────────────────────
    if (step === 1) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] p-4">
                <Card className="w-full max-w-md p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-black text-white mb-2">Join the Batch</h1>
                        <p className="text-white/60 text-sm">Sign in with Google to get started</p>
                    </div>

                    {error && (
                        <div className="bg-error/20 border border-error text-error p-3 rounded-md mb-6 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col items-center gap-6">
                        {loading ? (
                            <div className="flex items-center gap-2 text-white/60 text-sm">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Checking account...
                            </div>
                        ) : (
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => setError('Google sign-in was cancelled or failed.')}
                                theme="filled_black"
                                shape="rectangular"
                                size="large"
                                text="continue_with"
                                width="320"
                            />
                        )}
                    </div>

                    <p className="text-center text-white/40 mt-8 text-xs">
                        After signing in with Google, you'll verify your Narayana student ID (one time only).
                    </p>
                    <p className="text-center text-white/40 mt-2 text-xs">
                        Already have an account? <Link to="/login" className="text-secondary hover:underline">Login</Link>
                    </p>
                </Card>
            </div>
        );
    }

    // ── Step 2: Fill details + upload Narayana ID ──────────────────────────
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] p-4">
            <Card className="w-full max-w-md p-8 shadow-2xl">
                {/* Google identity confirmed banner */}
                {googleState && (
                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3 mb-6">
                        {googleState.picture && (
                            <img src={googleState.picture} alt="" className="w-10 h-10 rounded-full" />
                        )}
                        <div>
                            <p className="text-white font-bold text-sm">{googleState.name}</p>
                            <p className="text-white/50 text-xs">{googleState.email}</p>
                        </div>
                        <span className="ml-auto text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-1 rounded-full font-bold">Google ✓</span>
                    </div>
                )}

                <div className="text-center mb-6">
                    <h1 className="text-2xl font-black text-white mb-1">One Last Step</h1>
                    <p className="text-white/60 text-sm">Verify you're a 10th Grade Narayana student to complete signup</p>
                </div>

                <div className="bg-white/5 border border-white/10 p-4 rounded-xl mb-6 text-sm">
                    <h3 className="font-bold text-secondary mb-3">How to Verify:</h3>
                    <div className="space-y-3">
                        <div className="bg-white/5 p-3 rounded-lg">
                            <p className="font-bold text-white text-xs mb-1">ID Card Method</p>
                            <p className="text-white/60 text-xs">Take a clear photo of your 10th Grade Narayana ID card and upload it below. Make sure "10th" or "Class X" is visible!</p>
                        </div>
                        <div className="bg-white/5 p-3 rounded-lg">
                            <p className="font-bold text-white text-xs mb-1">App Screenshot Method</p>
                            <p className="text-white/60 text-xs">Open nConnect App → tap Profile icon → screenshot the dropdown with your 10th Grade details → upload below.</p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-error/20 border border-error text-error p-3 rounded-md mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSignupSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold mb-1 text-white/90">Username</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-white/5 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:border-secondary transition-colors"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Pick a unique username"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1 text-white/90">
                            Class / Section <span className="text-white/40 font-normal">(Optional)</span>
                        </label>
                        <input
                            type="text"
                            className="w-full bg-white/5 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:border-secondary transition-colors"
                            value={classSection}
                            onChange={(e) => setClassSection(e.target.value)}
                            placeholder="e.g. 12A, 10Commerce"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2 text-white/90">Narayana ID / App Screenshot</label>
                        {preview ? (
                            <div className="relative w-full aspect-video bg-black/50 rounded-xl overflow-hidden border border-white/10 mb-2">
                                <img src={preview} alt="Verification Preview" className="w-full h-full object-contain" />
                                <button
                                    type="button"
                                    onClick={() => { setVerificationImage(null); setPreview(null); }}
                                    className="absolute top-2 right-2 bg-error text-white text-xs px-2 py-1 rounded"
                                >
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <label className="border-2 border-dashed border-white/20 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors text-white/50 hover:text-white/80 min-h-[130px]">
                                <span className="text-sm font-bold text-center">Click to upload your ID / screenshot</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setVerificationImage(e.target.files[0]);
                                            setPreview(URL.createObjectURL(e.target.files[0]));
                                            setError('');
                                        }
                                    }}
                                />
                            </label>
                        )}
                    </div>

                    <Button type="submit" className="w-full mt-2" size="lg" isLoading={loading}>
                        Complete Signup
                    </Button>
                </form>

                <button
                    onClick={() => { setStep(1); setGoogleState(null); setError(''); }}
                    className="w-full text-center text-white/40 hover:text-white/60 text-xs mt-4 transition-colors"
                >
                    Use a different Google account
                </button>
            </Card>
        </div>
    );
};
