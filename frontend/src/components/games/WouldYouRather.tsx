import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Button } from '../ui/Button';

const PROMPTS = [
    { A: "Always be 10 minutes late", B: "Always be 20 minutes early" },
    { A: "Lose all your money and valuables", B: "Lose all the pictures you have ever taken" },
    { A: "Be able to see 10 minutes into your own future", B: "10 minutes into the future of anyone but yourself" },
    { A: "Have free Wi-Fi wherever you go", B: "Have free coffee wherever you go" },
    { A: "Only be able to whisper", B: "Only be able to shout" },
    { A: "Know the history of every object you touch", B: "Be able to talk to animals" },
    { A: "Have a rewind button for your life", B: "Have a pause button for your life" },
    { A: "Be constantly tired no matter how much you sleep", B: "Be constantly hungry no matter what you eat" }
];

export const WouldYouRather: React.FC<{
    isHost: boolean,
    onClose: () => void
}> = ({ isHost, onClose }) => {
    const { socket } = useSocket();
    const [prompt, setPrompt] = useState<{ optionA: string, optionB: string } | null>(null);
    const [votes, setVotes] = useState<Record<string, string>>({}); // socketId -> 'A' | 'B'
    const [myVote, setMyVote] = useState<string | null>(null);

    useEffect(() => {
        if (!socket) return;

        socket.on('wyr-prompt', (options) => {
            setPrompt(options);
            setVotes({});
            setMyVote(null);
        });

        socket.on('wyr-vote-update', ({ socketId, choice }) => {
            setVotes(prev => ({ ...prev, [socketId]: choice }));
        });

        socket.on('wyr-end', () => {
            onClose();
        });

        return () => {
            socket.off('wyr-prompt');
            socket.off('wyr-vote-update');
            socket.off('wyr-end');
        };
    }, [socket, onClose]);

    const handleNextPrompt = () => {
        const random = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
        socket?.emit('wyr-next-prompt', { optionA: random.A, optionB: random.B });
    };

    const handleVote = (choice: 'A' | 'B') => {
        setMyVote(choice);
        socket?.emit('wyr-vote', choice);
    };

    const handleEndGame = () => {
        socket?.emit('wyr-end');
    };

    const totalVotes = Object.keys(votes).length;
    const aVotes = Object.values(votes).filter(v => v === 'A').length;
    const bVotes = Object.values(votes).filter(v => v === 'B').length;

    // Calculate percentages for the UI bars
    const aPercent = totalVotes > 0 ? Math.round((aVotes / totalVotes) * 100) : 50;
    const bPercent = totalVotes > 0 ? Math.round((bVotes / totalVotes) * 100) : 50;

    return (
        <div className="w-full bg-accent-1/10 border border-accent-1/20 rounded-2xl p-6 relative shadow-2xl backdrop-blur-md">
            {isHost && (
                <button onClick={handleEndGame} className="absolute top-4 right-4 text-white/40 hover:text-white text-xs font-bold tracking-widest uppercase transition-colors">
                    Khel Khatam
                </button>
            )}

            <h2 className="text-xl md:text-2xl font-black text-accent-1 mb-8 uppercase tracking-widest text-center drop-shadow-md">Kya Chunega Bhai</h2>

            {!prompt ? (
                <div className="text-center py-4">
                    {isHost ? (
                        <Button variant="accent1" onClick={handleNextPrompt} className="animate-pulse shadow-lg shadow-accent-1/20">Pehli Dubidha Khol</Button>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 rounded-full border-2 border-accent-1 border-t-transparent animate-spin mb-2"></div>
                            <p className="text-white/60 font-medium">Host ke dubidha phekne ka intezaar...</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    {!myVote ? (
                        <div className="flex flex-col gap-4">
                            <button
                                onClick={() => handleVote('A')}
                                className="w-full text-left bg-primary border-2 border-transparent hover:border-accent-2 transition-all rounded-2xl p-6 shadow-lg group relative overflow-hidden"
                            >
                                <div className="absolute left-0 top-0 h-full w-1 bg-accent-2 group-hover:w-2 transition-all"></div>
                                <span className="text-xs font-black text-accent-2 uppercase tracking-widest mb-2 block">Pehla Option</span>
                                <p className="text-white font-medium text-lg md:text-xl pr-4">{prompt.optionA}</p>
                            </button>

                            <div className="flex items-center justify-center gap-4 my-[-10px] relative z-10">
                                <div className="h-px w-10 bg-white/20"></div>
                                <span className="text-xs font-black text-white/50 bg-bg-dark border border-white/10 px-3 py-1 rounded-full uppercase tracking-widest">Ya Fir</span>
                                <div className="h-px w-10 bg-white/20"></div>
                            </div>

                            <button
                                onClick={() => handleVote('B')}
                                className="w-full text-left bg-primary border-2 border-transparent hover:border-error transition-all rounded-2xl p-6 shadow-lg group relative overflow-hidden"
                            >
                                <div className="absolute left-0 top-0 h-full w-1 bg-error group-hover:w-2 transition-all"></div>
                                <span className="text-xs font-black text-error uppercase tracking-widest mb-2 block">Dusra Option</span>
                                <p className="text-white font-medium text-lg md:text-xl pr-4">{prompt.optionB}</p>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6 bg-black/40 rounded-2xl p-6 border border-white/5">
                            <h3 className="text-center text-sm font-bold tracking-widest text-white/50 uppercase mb-6">Janta Ki Awaaz</h3>

                            {/* Option A Results container */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <p className={`font-medium max-w-[75%] ${myVote === 'A' ? 'text-white' : 'text-white/60'}`}>{prompt.optionA} {myVote === 'A' && '✓'}</p>
                                    <span className="font-black text-accent-2">{aPercent}%</span>
                                </div>
                                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-accent-2 transition-all duration-1000 ease-out" style={{ width: `${aPercent}%` }}></div>
                                </div>
                            </div>

                            {/* Option B Results container */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <p className={`font-medium max-w-[75%] ${myVote === 'B' ? 'text-white' : 'text-white/60'}`}>{prompt.optionB} {myVote === 'B' && '✓'}</p>
                                    <span className="font-black text-error">{bPercent}%</span>
                                </div>
                                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-error transition-all duration-1000 ease-out" style={{ width: `${bPercent}%` }}></div>
                                </div>
                            </div>

                            <div className="text-center pt-4 text-xs font-bold text-white/30 uppercase tracking-widest">
                                {totalVotes} Vote Pade
                            </div>
                        </div>
                    )}

                    {isHost && (
                        <div className="mt-8 pt-6 border-t border-white/10 text-center flex justify-center">
                            <Button variant="ghost" onClick={handleNextPrompt} className="hover:bg-white/5">Agli Dubidha ➡️</Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
