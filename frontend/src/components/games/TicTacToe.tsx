import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Button } from '../ui/Button';

type Player = 'X' | 'O' | null;

interface TTTState {
    board: Player[];
    xPlayer: string | null;
    oPlayer: string | null;
    turn: 'X' | 'O';
    winner: Player | 'Draw';
}

const INITIAL_STATE: TTTState = {
    board: Array(9).fill(null),
    xPlayer: null,
    oPlayer: null,
    turn: 'X',
    winner: null
};

export const TicTacToe: React.FC<{
    isHost: boolean,
    onClose: () => void
}> = ({ isHost, onClose }) => {
    const { socket } = useSocket();
    const [gameState, setGameState] = useState<TTTState>(INITIAL_STATE);
    const [hasStarted, setHasStarted] = useState(false);

    useEffect(() => {
        if (!socket) return;

        socket.on('ttt-start', ({ host }) => {
            setHasStarted(true);
            setGameState({ ...INITIAL_STATE, xPlayer: host });
        });

        socket.on('ttt-state-sync', (newState: TTTState) => {
            setGameState(newState);
        });

        socket.on('ttt-end', () => {
            onClose();
        });

        return () => {
            socket.off('ttt-start');
            socket.off('ttt-state-sync');
            socket.off('ttt-end');
        };
    }, [socket, onClose]);

    const broadcastState = (newState: TTTState) => {
        setGameState(newState);
        socket?.emit('ttt-state-update', newState);
    };

    const handleStart = () => {
        socket?.emit('ttt-start');
        setHasStarted(true);
        broadcastState({ ...INITIAL_STATE, xPlayer: socket?.id || null });
    };

    const handleJoinGame = () => {
        if (!gameState.oPlayer && socket?.id !== gameState.xPlayer) {
            broadcastState({ ...gameState, oPlayer: socket?.id || null });
        }
    };

    const handleReset = () => {
        broadcastState({
            ...INITIAL_STATE,
            xPlayer: gameState.xPlayer,
            oPlayer: gameState.oPlayer
        });
    };

    const checkWinner = (board: Player[]): Player | 'Draw' => {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        for (let i = 0; i < lines.length; i++) {
            const [a, b, c] = lines[i];
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a];
            }
        }
        if (board.every(cell => cell !== null)) return 'Draw';
        return null;
    };

    const handleCellClick = (index: number) => {
        if (gameState.winner || gameState.board[index]) return; // Cell filled or game over

        // Ensure only the active player can click
        const myRole = socket?.id === gameState.xPlayer ? 'X' : (socket?.id === gameState.oPlayer ? 'O' : null);
        if (myRole !== gameState.turn) return;

        const newBoard = [...gameState.board];
        newBoard[index] = gameState.turn;

        const turnWinner = checkWinner(newBoard);

        broadcastState({
            ...gameState,
            board: newBoard,
            turn: gameState.turn === 'X' ? 'O' : 'X',
            winner: turnWinner
        });
    };

    const handleEndGame = () => {
        socket?.emit('ttt-end');
    };

    const myRole = socket?.id === gameState.xPlayer ? 'X' : (socket?.id === gameState.oPlayer ? 'O' : 'Spectator');

    return (
        <div className="w-full bg-secondary/10 border border-secondary/20 rounded-2xl p-6 relative shadow-2xl backdrop-blur-md">
            {isHost && (
                <button onClick={handleEndGame} className="absolute top-4 right-4 text-white/40 hover:text-white text-xs font-bold tracking-widest uppercase transition-colors">
                    Khel Khatam
                </button>
            )}

            <h2 className="text-xl md:text-2xl font-black text-secondary mb-8 uppercase tracking-widest text-center drop-shadow-md">Zero Kaata</h2>

            {!hasStarted ? (
                <div className="text-center py-4">
                    {isHost ? (
                        <Button variant="secondary" onClick={handleStart} className="animate-pulse shadow-lg shadow-secondary/20">Aaja Bhid Le</Button>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 rounded-full border-2 border-secondary border-t-transparent animate-spin mb-2"></div>
                            <p className="text-white/60 font-medium">Host ke board kholne ka intezaar...</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6 max-w-sm mx-auto">
                    {/* Players Info */}
                    <div className="flex justify-between items-center bg-bg-dark rounded-xl p-3 border border-white/5 shadow-inner">
                        <div className={`text-center px-4 py-2 flex-1 rounded-lg ${gameState.turn === 'X' && !gameState.winner ? 'bg-secondary/20 ring-1 ring-secondary/50' : 'opacity-50'}`}>
                            <span className="block text-2xl font-black text-secondary leading-none mb-1">X</span>
                            <span className="text-[10px] uppercase font-bold tracking-widest text-white/50">{socket?.id === gameState.xPlayer ? 'Tu (P1)' : 'P1'}</span>
                        </div>
                        <div className="text-white/30 font-black px-4">VS</div>
                        <div className={`text-center px-4 py-2 flex-1 rounded-lg ${gameState.turn === 'O' && !gameState.winner ? 'bg-error/20 ring-1 ring-error/50' : 'opacity-50'}`}>
                            <span className="block text-2xl font-black text-error leading-none mb-1">O</span>
                            {gameState.oPlayer ? (
                                <span className="text-[10px] uppercase font-bold tracking-widest text-white/50">{socket?.id === gameState.oPlayer ? 'Tu (P2)' : 'P2'}</span>
                            ) : (
                                <button onClick={handleJoinGame} className="text-[10px] uppercase font-bold tracking-widest text-secondary hover:text-white transition-colors">Aaja</button>
                            )}
                        </div>
                    </div>

                    {/* The Board */}
                    <div className="grid grid-cols-3 gap-2 bg-white/5 p-2 rounded-2xl shadow-inner">
                        {gameState.board.map((cell, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleCellClick(idx)}
                                disabled={!!gameState.winner || cell !== null || myRole === 'Spectator' || myRole !== gameState.turn}
                                className={`aspect-square rounded-xl flex items-center justify-center text-4xl md:text-5xl font-black shadow-lg transition-all
                                    ${cell === 'X' ? 'text-secondary bg-bg-dark border border-secondary/20' :
                                        cell === 'O' ? 'text-error bg-bg-dark border border-error/20' :
                                            'bg-bg-dark/50 hover:bg-bg-dark border border-transparent'}`}
                            >
                                {cell}
                            </button>
                        ))}
                    </div>

                    {/* Status area */}
                    <div className="text-center h-8">
                        {gameState.winner && (
                            <div className="animate-bounce">
                                {gameState.winner === 'Draw' ? (
                                    <span className="text-lg font-black text-white px-4 py-1 bg-white/20 rounded-full">Khel Khatam, Paisa Hajam (Draw!)</span>
                                ) : (
                                    <span className={`text-lg font-black px-4 py-1 rounded-full ${gameState.winner === 'X' ? 'text-secondary bg-secondary/20' : 'text-error bg-error/20'}`}>
                                        Khiladi {gameState.winner} baazi maar gaya!
                                    </span>
                                )}
                            </div>
                        )}

                        {!gameState.winner && myRole === 'Spectator' && gameState.xPlayer && gameState.oPlayer && (
                            <span className="text-sm font-bold text-white/40 tracking-widest uppercase">Bas dekh raha hu</span>
                        )}
                    </div>

                    {/* Reset Button (Host or Players only) */}
                    {gameState.winner && myRole !== 'Spectator' && (
                        <Button variant="ghost" className="w-full" onClick={handleReset}>Ek Aur Baar 🔄</Button>
                    )}
                </div>
            )}
        </div>
    );
};
