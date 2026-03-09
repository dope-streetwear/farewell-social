import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Eraser, Pencil, Trash2, Download } from 'lucide-react';


interface DrawData {
    x: number;
    y: number;
    lastX: number;
    lastY: number;
    color: string;
    width: number;
}

export const Whiteboard: React.FC = () => {
    const { socket } = useSocket();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#FFC857');
    const [width, setWidth] = useState(3);
    const [brushMode, setBrushMode] = useState<'pencil' | 'eraser'>('pencil');
    const lastPos = useRef({ x: 0, y: 0 });

    const draw = useCallback((data: DrawData, emit: boolean = false) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.beginPath();
        ctx.strokeStyle = data.color;
        ctx.lineWidth = data.width;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.moveTo(data.lastX, data.lastY);
        ctx.lineTo(data.x, data.y);
        ctx.stroke();
        ctx.closePath();

        if (emit && socket) {
            socket.emit('whiteboard-draw', data);
        }
    }, [socket]);

    useEffect(() => {
        if (!socket) return;

        socket.on('whiteboard-draw-sync', (data: DrawData) => {
            draw(data, false);
        });

        socket.on('whiteboard-clear-sync', () => {
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx?.clearRect(0, 0, canvas.width, canvas.height);
            }
        });

        return () => {
            socket.off('whiteboard-draw-sync');
            socket.off('whiteboard-clear-sync');
        };
    }, [socket, draw]);

    const getMousePos = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();

        let clientX = 0;
        let clientY = 0;

        if ('touches' in e.nativeEvent) {
            clientX = e.nativeEvent.touches[0].clientX;
            clientY = e.nativeEvent.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const pos = getMousePos(e);
        lastPos.current = pos;
        setIsDrawing(true);
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const pos = getMousePos(e);

        const drawData: DrawData = {
            x: pos.x,
            y: pos.y,
            lastX: lastPos.current.x,
            lastY: lastPos.current.y,
            color: brushMode === 'eraser' ? '#0F0F0F' : color, // Erase with background color
            width: brushMode === 'eraser' ? width * 4 : width
        };

        draw(drawData, true);
        lastPos.current = pos;
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        if (socket) socket.emit('whiteboard-clear');
    };

    const downloadCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `farewell-adda-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
    };

    // Pre-draw background
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#0F0F0F';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }
    }, []);

    return (
        <div className="w-full h-full flex flex-col items-center gap-4 bg-bg-card border border-white/10 rounded-2xl p-4 shadow-2xl overflow-hidden min-h-[400px]">
            <div className="w-full flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-white/5">
                <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5">
                    <button
                        onClick={() => setBrushMode('pencil')}
                        className={`p-2 rounded-lg transition-all ${brushMode === 'pencil' ? 'bg-secondary text-primary shadow-lg shadow-secondary/20' : 'text-white/40 hover:text-white'}`}
                    >
                        <Pencil size={18} />
                    </button>
                    <button
                        onClick={() => setBrushMode('eraser')}
                        className={`p-2 rounded-lg transition-all ${brushMode === 'eraser' ? 'bg-secondary text-primary shadow-lg shadow-secondary/20' : 'text-white/40 hover:text-white'}`}
                    >
                        <Eraser size={18} />
                    </button>
                </div>

                <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5 overflow-x-auto no-scrollbar max-w-[200px] sm:max-w-none">
                    {['#FFC857', '#E23B3B', '#48BB78', '#4299E1', '#9F7AEA', '#FFFFFF'].map(c => (
                        <button
                            key={c}
                            className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-125 ${color === c && brushMode === 'pencil' ? 'border-white scale-110 shadow-lg' : 'border-transparent'}`}
                            style={{ backgroundColor: c }}
                            onClick={() => { setColor(c); setBrushMode('pencil'); }}
                        />
                    ))}
                    <div className="w-px h-6 bg-white/10 ml-1"></div>
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => { setColor(e.target.value); setBrushMode('pencil'); }}
                        className="w-6 h-6 p-0 bg-transparent border-none cursor-pointer"
                    />
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/5">
                        <span className="text-[10px] font-black uppercase text-white/40">Size</span>
                        <input
                            type="range"
                            min="1" max="20"
                            value={width}
                            onChange={(e) => setWidth(parseInt(e.target.value))}
                            className="w-16 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-secondary"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={downloadCanvas} className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all">
                        <Download size={18} />
                    </button>
                    <button onClick={clearCanvas} className="p-2.5 rounded-xl bg-error/10 border border-error/20 text-error hover:bg-error hover:text-white transition-all">
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            <div className="flex-1 w-full bg-black rounded-xl overflow-hidden cursor-crosshair relative touch-none shadow-inner select-none border border-white/10">
                <canvas
                    ref={canvasRef}
                    width={1200}
                    height={800}
                    className="w-full h-full object-contain"
                    onMouseDown={startDrawing}
                    onMouseMove={handleMouseMove}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={handleMouseMove}
                    onTouchEnd={stopDrawing}
                />
            </div>
        </div>
    );
};
