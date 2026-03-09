import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Button } from '../ui/Button';

const PROMPTS = [
    "Never have I ever fallen asleep in class.",
    "Never have I ever sent a text to the wrong person.",
    "Never have I ever pretended to know a stranger.",
    "Never have I ever lied about my age.",
    "Never have I ever ghosted someone.",
    "Never have I ever forgotten a friend's birthday.",
    "Never have I ever accidentally liked an old photo while stalking.",
    "Never have I ever practiced an argument in the mirror."
];

export const NeverHaveIEver: React.FC<{
    isHost: boolean,
    onClose: () => void
}> = ({ isHost, onClose }) => {
    const { socket } = useSocket();
    const [prompt, setPrompt] = useState<string | null>(null);
    const [votes, setVotes] = useState<Record<string, string>>({}); // socketId -> 'have' | 'havent'
    const [myVote, setMyVote] = useState<string | null>(null);

    useEffect(() => {
        if (!socket) return;

        socket.on('nhie-prompt', (newPrompt) => {
            setPrompt(newPrompt);
            setVotes({});
            setMyVote(null);
        });

        socket.on('nhie-vote-update', ({ socketId, choice }) => {
            setVotes(prev => ({ ...prev, [socketId]: choice }));
        });

        socket.on('nhie-end', () => {
            onClose();
        });

        return () => {
            socket.off('nhie-prompt');
            socket.off('nhie-vote-update');
            socket.off('nhie-end');
        };
    }, [socket, onClose]);

    const handleNextPrompt = () => {
        const random = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
        socket?.emit('nhie-next-prompt', random);
    };

    const handleVote = (choice: 'have' | 'havent') => {
        setMyVote(choice);
        socket?.emit('nhie-vote', choice);
    };

    const handleEndGame = () => {
        socket?.emit('nhie-end');
    };

    const haveCount = Object.values(votes).filter(v => v === 'have').length;
    const haventCount = Object.values(votes).filter(v => v === 'havent').length;

    return (
        <div className="w-full bg-accent-1/10 border border-accent-1/20 rounded-2xl p-6 relative shadow-2xl backdrop-blur-md">
            {isHost && (
                <button onClick={handleEndGame} className="absolute top-4 right-4 text-white/40 hover:text-white text-xs font-bold tracking-widest uppercase transition-colors">
                    Khel Khatam
                </button>
            )}

            <h2 className="text-xl md:text-2xl font-black text-accent-1 mb-8 uppercase tracking-widest text-center drop-shadow-md">Maine Toh Kabhi Nahi</h2>

            {!prompt ? (
                <div className="text-center py-4">
                    {isHost ? (
                        <Button variant="accent1" onClick={handleNextPrompt} className="animate-pulse shadow-lg shadow-accent-1/20">Pehla Patta Khol</Button>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 rounded-full border-2 border-accent-1 border-t-transparent animate-spin mb-2"></div>
                            <p className="text-white/60 font-medium">Host ke aag lagane ka intezaar...</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-8">
                    <div className="bg-bg-dark border border-white/5 rounded-2xl p-6 md:p-8 text-center shadow-inner relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-accent-1"></div>
                        <p className="text-2xl md:text-3xl font-black text-white leading-tight">"{prompt}"</p>
                    </div>

                    {!myVote ? (
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Button variant="danger" onClick={() => handleVote('have')} className="px-8 font-black flex-1 shadow-lg shadow-error/20">MAINE KIYA HAI</Button>
                            <Button variant="accent2" onClick={() => handleVote('havent')} className="px-8 font-black text-bg-dark flex-1 shadow-lg shadow-accent-2/20">MAI SHAREEF HU</Button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between bg-black/40 rounded-xl p-4 border border-white/5">
                            <div className="text-center flex-1">
                                <span className="text-2xl font-black text-error block mb-1">{haveCount}</span>
                                <span className="text-xs text-white/50 uppercase tracking-widest font-bold">Kiya Hai</span>
                            </div>
                            <div className="w-px h-12 bg-white/10 mx-4"></div>
                            <div className="text-center flex-1">
                                <span className="text-2xl font-black text-accent-2 block mb-1">{haventCount}</span>
                                <span className="text-xs text-white/50 uppercase tracking-widest font-bold">Shareef</span>
                            </div>
                        </div>
                    )}

                    {isHost && (
                        <div className="mt-8 pt-6 border-t border-white/10 text-center flex justify-center">
                            <Button variant="ghost" onClick={handleNextPrompt} className="hover:bg-white/5">Agla Kalesh ➡️</Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
