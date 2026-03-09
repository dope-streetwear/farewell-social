import React, { useEffect, useRef, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useWebRTC } from '../hooks/useWebRTC';
import { Button } from '../components/ui/Button';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Users, Gamepad2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NeverHaveIEver } from '../components/games/NeverHaveIEver';
import { WouldYouRather } from '../components/games/WouldYouRather';
import { TicTacToe } from '../components/games/TicTacToe';
import { Whiteboard } from '../components/games/Whiteboard';
import { Palette } from 'lucide-react';

const VideoBox: React.FC<{ identifier: string, username: string, stream: MediaStream | null, isLocal?: boolean }> = ({ username, stream, isLocal }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className="relative w-full h-full min-h-[150px] bg-bg-dark rounded-xl overflow-hidden border border-white/10 flex flex-col items-center justify-center shadow-lg">
            {stream ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isLocal}
                    className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`}
                />
            ) : (
                <div className="text-white/30 truncate flex flex-col items-center gap-2 px-4">
                    <Users size={32} />
                    <span className="text-sm text-center">Shakal dikha bhai...</span>
                </div>
            )}
            <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white max-w-[80%] truncate overflow-hidden">
                {username} {isLocal && '(You)'}
            </div>
        </div>
    );
};

export const Lounge: React.FC = () => {
    const { socket } = useSocket();
    const { user } = useAuth();
    const navigate = useNavigate();

    // Delay initialization until explicitly joining to avoid auto-prompting camera
    const [hasJoined, setHasJoined] = useState(false);
    const { localStream, peers, startLocalStream, stopLocalStream } = useWebRTC(hasJoined ? socket : null, user);

    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [activeGame, setActiveGame] = useState<'nhie' | 'wyr' | 'ttt' | 'whiteboard' | null>(null);
    const [isGameHost, setIsGameHost] = useState(false);

    useEffect(() => {
        if (!socket) return;

        const handleNhieStart = ({ host }: { host: string }) => { setActiveGame('nhie'); setIsGameHost(socket.id === host); };
        const handleWyrStart = ({ host }: { host: string }) => { setActiveGame('wyr'); setIsGameHost(socket.id === host); };
        const handleTttStart = ({ host }: { host: string }) => { setActiveGame('ttt'); setIsGameHost(socket.id === host); };
        const handleWhiteboardStart = ({ host }: { host: string }) => { setActiveGame('whiteboard'); setIsGameHost(socket.id === host); };

        const handleEnd = () => setActiveGame(null);

        socket.on('nhie-start', handleNhieStart);
        socket.on('wyr-start', handleWyrStart);
        socket.on('ttt-start', handleTttStart);

        socket.on('nhie-end', handleEnd);
        socket.on('wyr-end', handleEnd);
        socket.on('ttt-end', handleEnd);
        socket.on('whiteboard-start', handleWhiteboardStart);
        socket.on('whiteboard-end', handleEnd);

        return () => {
            stopLocalStream();
            socket.off('nhie-start', handleNhieStart);
            socket.off('wyr-start', handleWyrStart);
            socket.off('ttt-start', handleTttStart);
            socket.off('nhie-end', handleEnd);
            socket.off('wyr-end', handleEnd);
            socket.off('ttt-end', handleEnd);
            socket.off('whiteboard-start', handleWhiteboardStart);
            socket.off('whiteboard-end', handleEnd);
        };
    }, [socket, hasJoined]);

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                // track.enabled determines if video is actually sent/rendered
                track.enabled = !isVideoEnabled;
            });
            setIsVideoEnabled(!isVideoEnabled);
        }
    };

    const toggleAudio = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !isAudioEnabled;
            });
            setIsAudioEnabled(!isAudioEnabled);
        }
    };

    const handleJoin = async () => {
        const stream = await startLocalStream();
        if (stream) {
            setHasJoined(true);
        }
    };

    const handleLeave = () => {
        stopLocalStream();
        setHasJoined(false);
        navigate('/');
    };

    if (!hasJoined) {
        return (
            <div className="w-full max-w-xl mx-auto min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center text-center px-4">
                <div className="w-24 h-24 bg-accent-1/10 rounded-full flex items-center justify-center mb-6 ring-4 ring-accent-1/20">
                    <Video size={40} className="text-accent-1" />
                </div>
                <h1 className="text-5xl font-black text-white mb-4 tracking-tight">Vello Ka Adda</h1>
                <p className="text-white/60 mb-10 max-w-sm text-lg">Aaja bhai, muh dikha aur bakchodi wale games khel sabke saath.</p>
                <Button size="lg" variant="accent1" onClick={handleJoin} className="w-full sm:w-auto px-10 text-lg py-6 font-bold">
                    Shakal Dikha Aur Aaja
                </Button>
            </div>
        );
    }

    const totalPeople = peers.length + 1;
    let gridCols = "grid-cols-1";
    if (totalPeople === 2) gridCols = "grid-cols-1 sm:grid-cols-2";
    else if (totalPeople >= 3) gridCols = "grid-cols-2 lg:grid-cols-3";
    else if (totalPeople > 6) gridCols = "grid-cols-3 lg:grid-cols-4";

    return (
        <div className="w-full max-w-6xl mx-auto h-[calc(100vh-6rem)] md:h-[calc(100vh-5rem)] px-2 pb-24 md:pb-6 pt-4 flex flex-col">
            {/* Mini Games Area */}
            {activeGame ? (
                <div className="mb-4 shrink-0">
                    {activeGame === 'nhie' && <NeverHaveIEver isHost={isGameHost} onClose={() => setActiveGame(null)} />}
                    {activeGame === 'wyr' && <WouldYouRather isHost={isGameHost} onClose={() => setActiveGame(null)} />}
                    {activeGame === 'ttt' && <TicTacToe isHost={isGameHost} onClose={() => setActiveGame(null)} />}
                    {activeGame === 'whiteboard' && (
                        <div className="relative">
                            <Whiteboard />
                            {isGameHost && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="absolute top-4 right-4 text-white/50 hover:text-white"
                                    onClick={() => socket?.emit('whiteboard-end')}
                                >
                                    Stop Whiteboard
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="mb-4 shrink-0 flex flex-wrap items-center justify-center gap-3 bg-bg-dark/50 border border-white/5 p-3 rounded-2xl">
                    <span className="text-sm font-bold text-white/50 uppercase tracking-widest mr-2 hidden sm:block">Kalesh Shuru Kar:</span>
                    <Button variant="accent1" size="sm" onClick={() => socket?.emit('nhie-start')} className="gap-2 rounded-xl text-xs sm:text-sm">
                        <Gamepad2 size={16} /> Never Have I Ever
                    </Button>
                    <Button variant="accent2" size="sm" onClick={() => socket?.emit('wyr-start')} className="gap-2 rounded-xl text-xs sm:text-sm">
                        <Gamepad2 size={16} /> Would You Rather
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => socket?.emit('ttt-start')} className="gap-2 rounded-xl text-xs sm:text-sm">
                        <Gamepad2 size={16} /> Tic Tac Toe
                    </Button>
                    <Button variant="accent1" size="sm" onClick={() => socket?.emit('whiteboard-start')} className="gap-2 rounded-xl text-xs sm:text-sm bg-indigo-500 hover:bg-indigo-600 text-white">
                        <Palette size={16} /> Vello Ka Adda (Whiteboard)
                    </Button>
                </div>
            )}

            <div className={`flex-1 grid gap-3 ${gridCols} min-h-0 overflow-y-auto mb-6 content-center auto-rows-fr`}>
                <VideoBox identifier="local" username={user?.username || 'You'} stream={localStream} isLocal />
                {peers.map(p => (
                    <VideoBox key={p.socketId} identifier={p.socketId} username={p.username} stream={p.stream} />
                ))}
            </div>

            {/* Controls Bar */}
            <div className="shrink-0 max-w-md w-full mx-auto bg-bg-dark/80 backdrop-blur-xl border border-white/10 rounded-3xl p-4 flex items-center justify-center gap-6 shadow-2xl relative z-10">
                <button
                    onClick={toggleAudio}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isAudioEnabled ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-error text-white'}`}
                >
                    {isAudioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
                </button>

                <button
                    onClick={toggleVideo}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isVideoEnabled ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-error text-white'}`}
                >
                    {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
                </button>

                <div className="w-px h-10 bg-white/10 mx-2 block"></div>

                <button
                    onClick={handleLeave}
                    className="w-14 h-14 rounded-full bg-error text-white flex items-center justify-center hover:bg-error/80 transition-all shadow-lg shadow-error/20"
                >
                    <PhoneOff size={24} />
                </button>
            </div>
        </div>
    );
};
