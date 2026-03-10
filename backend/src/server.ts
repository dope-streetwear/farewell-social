import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import connectDB from './db.js';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.CLIENT_ORIGIN || ''
].filter(Boolean);

const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            return callback(null, true);
        }

        // Allow strictly defined origins
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // Allow any vercel deployment
        if (origin.endsWith('vercel.app')) {
            return callback(null, true);
        }

        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
};

export const io = new Server(httpServer, {
    cors: {
        origin: corsOptions.origin,
        methods: ["GET", "POST"],
        credentials: true
    }
});
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Database Connection
connectDB();

// Routes
import authRoutes from './routes/auth.js';
import postRoutes from './routes/posts.js';
import nglRoutes from './routes/ngl.js';
import adminRoutes from './routes/adminRoutes.js';
import userRoutes from './routes/users.js';
import notificationRoutes from './routes/notifications.js';
import vibeRoutes from './routes/vibes.js';
import storyRoutes from './routes/stories.js';
import wrappedRoutes from './routes/wrapped.js';
import secretCrushRoutes from './routes/secretCrush.js';
import flashRoutes from './routes/flash.js';
import yearbookRoutes from './routes/yearbook.js';
import triviaRoutes from './routes/trivia.js';
import confessionRoutes from './routes/confessions.js';
import letterRoutes from './routes/letters.js';
import playlistRoutes from './routes/playlist.js';
import superlativeRoutes from './routes/superlatives.js';

// Static files (media uploads)
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/ngl/posts', nglRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/vibes', vibeRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/wrapped', wrappedRoutes);
app.use('/api/secret-crush', secretCrushRoutes);
app.use('/api/flash', flashRoutes);
app.use('/api/yearbook', yearbookRoutes);
app.use('/api/trivia', triviaRoutes);
app.use('/api/confessions', confessionRoutes);
app.use('/api/letters', letterRoutes);
app.use('/api/playlist', playlistRoutes);
app.use('/api/superlatives', superlativeRoutes);

// Music search proxy (iTunes)
app.get('/api/music/search', async (req, res) => {
    try {
        const q = req.query.q as string;
        if (!q) return res.status(400).json({ error: 'Missing query' });

        const response = await fetch(
            `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=8`
        );
        const data = await response.json();

        const songs = (data.results || [])
            .filter((r: any) => r.previewUrl)
            .map((r: any) => ({
                trackId: r.trackId.toString(),
                songTitle: r.trackName,
                artistName: r.artistName,
                audioPreviewUrl: r.previewUrl,
                artworkUrl: r.artworkUrl100
            }));

        res.json({ data: songs });
    } catch (err) {
        console.error('Music search error', err);
        res.status(500).json({ error: 'Music search failed' });
    }
});

// Basic route
app.get('/', (req, res) => {
    res.send('Farewell Social API is running');
});

import { handleLoungeSockets } from './sockets/lounge.js';

// Socket.io setup
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Attach room/game specific handlers
    handleLoungeSockets(io, socket);

    socket.on('join-user-room', (userId) => {
        socket.join(`user:${userId}`);
        console.log(`Socket ${socket.id} joined room user:${userId}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

import { ErrorRequestHandler } from 'express';

// Global error handler to catch unhandled promise rejections or sync crashes
// Guarantees our frontend *always* receives JSON instead of Express default HTML
const globalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
    console.error('Unhandled Server Error Caught by Global Handler:', err);
    res.status(500).json({ message: err.message || 'An unexpected error occurred on the server.' });
};
app.use(globalErrorHandler);

// Start server
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
