import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Compass, MessageSquare, User, HelpCircle, Mail, Music, Trophy } from 'lucide-react';
import { PrivacyBadge } from '../components/ui/PrivacyBadge';

export const Home: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col min-h-screen">
            {/* Moving Text Bar */}
            <div className="w-full bg-primary overflow-hidden border-b border-white/10 py-3 relative isolate">
                <div className="absolute inset-0 bg-secondary/10 pointer-events-none"></div>
                <div className="w-full overflow-hidden">
                    <span className="animate-marquee font-black text-secondary tracking-widest text-xl whitespace-nowrap">
                        WELCOME TO NARAYANASOCIAL &bull; BATCH OF 2025'26 &bull; NO NAMES, ONLY VIBES &bull; CAPTURE THE LAST MEMORIES &bull;
                    </span>
                </div>
            </div>

            <div className="p-6 md:p-12 flex-1 flex flex-col pt-8 space-y-12">
                {/* Hero Section */}
                <section className="flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="flex-1 space-y-6 text-center md:text-left">
                        <h1 className="text-4xl md:text-6xl font-black text-white leading-tight">
                            Guys, to keep your memories fresh aur aapko connected rakhne ke liye, we proudly present <span className="text-secondary">NARAYANASOCIAL.</span>
                        </h1>
                        <p className="text-lg md:text-xl text-white/80 max-w-md mx-auto md:mx-0">
                            This platform is exclusively for our 10th batch. Authentication is only allowed remotely using your nConnect app ya fir ID card se. Stay connected and machate raho!
                            <br /><br />
                            <span className="font-bold text-accent-1">AND YES, FAREWELL 2026 MEIN ZARUR AANA.</span>
                        </p>
                        <div className="flex items-center justify-center md:justify-start gap-4">
                            <Button size="lg" variant="primary" onClick={() => navigate('/feed')}>
                                Join the Feed
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 max-w-sm w-full relative perspective-1000">
                        {/* Mock phone frame / Card stack */}
                        <div className="relative z-10 rotate-y-[-10deg] rotate-x-[10deg] transform-style-3d hover:rotate-y-[0deg] hover:rotate-x-[0deg] transition-transform duration-500">
                            <Card className="w-full aspect-[4/5] bg-bg-dark border-4 border-secondary p-4 shadow-2xl flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-accent-1"></div>
                                        <div>
                                            <div className="h-4 w-24 bg-white/20 rounded mb-2"></div>
                                            <div className="h-3 w-16 bg-white/10 rounded"></div>
                                        </div>
                                    </div>
                                    <div className="w-full aspect-square bg-white/5 rounded-lg mb-4"></div>
                                    <div className="h-4 w-3/4 bg-white/20 rounded"></div>
                                </div>
                            </Card>
                            {/* Stack effect backend card */}
                            <Card className="absolute -inset-4 bg-accent-1 z-[-1] translate-y-6 -translate-x-6 rounded-2xl opacity-50">
                                <div></div>
                            </Card>
                        </div>
                    </div>
                </section>

                <div className="flex justify-center md:justify-start">
                    <PrivacyBadge />
                </div>

                {/* Quick Navigation Cards */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6 hover:-translate-y-2 transition-transform cursor-pointer border-t-4 border-t-accent-2" onClick={() => navigate('/feed')}>
                        <Compass size={36} className="text-accent-2 mb-4" />
                        <h3 className="text-xl font-bold mb-2">Global Feed</h3>
                        <p className="text-white/70 text-sm">See what everyone's up to. Normal posts with photos, videos, and comments.</p>
                    </Card>

                    <Card className="p-6 hover:-translate-y-2 transition-transform cursor-pointer border-t-4 border-t-secondary" onClick={() => navigate('/u/me')}>
                        <User size={36} className="text-secondary mb-4" />
                        <h3 className="text-xl font-bold mb-2">My Profile</h3>
                        <p className="text-white/70 text-sm">View your post grid, liked items, and saved memories in one place.</p>
                    </Card>

                    <Card className="p-6 hover:-translate-y-2 transition-transform cursor-pointer border-t-4 border-t-accent-1" onClick={() => navigate('/ngl')}>
                        <MessageSquare size={36} className="text-accent-1 mb-4" />
                        <h3 className="text-xl font-bold mb-2">NGL Anonymous</h3>
                        <p className="text-white/70 text-sm">Spill the tea. Post completely anonymous text and photos safely.</p>
                    </Card>

                    <Card className="p-6 hover:-translate-y-2 transition-transform cursor-pointer border-t-4 border-t-[#FFC857] group relative overflow-hidden" onClick={() => navigate('/trivia')}>
                        <div className="absolute inset-0 bg-gradient-to-br from-[#FFC857]/10 to-transparent"></div>
                        <div className="relative z-10">
                            <span className="text-4xl mb-4 block group-hover:scale-110 transition-transform origin-bottom-left">👶</span>
                            <h3 className="text-xl font-black mb-2 text-[#FFC857]">Who's Who?</h3>
                            <p className="text-white/70 text-sm font-medium">Think you can recognize your friends from their baby pictures? Play the trivia minigame!</p>
                        </div>
                    </Card>

                    <Card className="p-6 hover:-translate-y-2 transition-transform cursor-pointer border-t-4 border-t-pink-500 group relative overflow-hidden" onClick={() => navigate('/confessions')}>
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent"></div>
                        <div className="relative z-10">
                            <HelpCircle size={36} className="text-pink-500 mb-4 group-hover:scale-110 transition-transform origin-bottom-left" />
                            <h3 className="text-xl font-black mb-2 text-pink-500">Confession Roulette</h3>
                            <p className="text-white/70 text-sm font-medium">Read anonymous secrets or drop your own. Only the wheel knows what comes next.</p>
                        </div>
                    </Card>

                    <Card className="p-6 hover:-translate-y-2 transition-transform cursor-pointer border-t-4 border-t-amber-500 group relative overflow-hidden" onClick={() => navigate('/letters')}>
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent"></div>
                        <div className="relative z-10">
                            <Mail size={36} className="text-amber-500 mb-4 group-hover:scale-110 transition-transform origin-bottom-left" />
                            <h3 className="text-xl font-black mb-2 text-amber-500">Alvida Khat</h3>
                            <p className="text-white/70 text-sm font-medium">Read and write long-form, heartfelt farewell letters to your classmates.</p>
                        </div>
                    </Card>

                    <Card className="p-6 hover:-translate-y-2 transition-transform cursor-pointer border-t-4 border-t-cyan-400 group relative overflow-hidden" onClick={() => navigate('/playlist')}>
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-transparent"></div>
                        <div className="relative z-10">
                            <Music size={36} className="text-cyan-400 mb-4 group-hover:scale-110 transition-transform origin-bottom-left" />
                            <h3 className="text-xl font-black mb-2 text-cyan-400">Humara Gaana</h3>
                            <p className="text-white/70 text-sm font-medium">Add to the Batch Playlist. Vote for the songs that define our school life!</p>
                        </div>
                    </Card>

                    <Card className="p-6 hover:-translate-y-2 transition-transform cursor-pointer border-t-4 border-t-yellow-400 group relative overflow-hidden" onClick={() => navigate('/awards')}>
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-transparent"></div>
                        <div className="relative z-10">
                            <Trophy size={36} className="text-yellow-400 mb-4 group-hover:scale-110 transition-transform origin-bottom-left" />
                            <h3 className="text-xl font-black mb-2 text-yellow-400">Batch Ka Award</h3>
                            <p className="text-white/70 text-sm font-medium">Vote for the class superlative awards—from 'Best Jodi' to 'Class Clown'.</p>
                        </div>
                    </Card>
                </section>
            </div>
        </div>
    );
};
