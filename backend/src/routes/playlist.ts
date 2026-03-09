import express from 'express';
import { protectRoute } from '../middleware/auth.js';
import PlaylistSong from '../models/PlaylistSong.js';
import { sendNotification } from '../utils/notifications.js';

const router = express.Router();

// 1. Get entire playlist sorted by votes
router.get('/', protectRoute, async (req, res) => {
    try {
        const playlist = await PlaylistSong.aggregate([
            {
                $addFields: {
                    voteCount: { $size: "$voters" }
                }
            },
            { $sort: { voteCount: -1, createdAt: -1 } }
        ]);

        // Populate submittedBy manually since aggregate drops populates
        await PlaylistSong.populate(playlist, { path: 'submittedBy', select: 'username displayName profileImageUrl' });

        res.json(playlist);
    } catch (err: any) {
        console.error('Error fetching playlist:', err);
        res.status(500).json({ message: err.message || 'Server error' });
    }
});

// 2. Add a new song to the playlist
router.post('/add', protectRoute, async (req, res) => {
    try {
        const { trackId, title, artist, albumArtUrl, previewUrl } = req.body;
        const currentUserId = (req as any).user._id;

        if (!trackId || !title || !artist) {
            return res.status(400).json({ message: 'Missing track details' });
        }

        // Check if song already exists
        const existing = await PlaylistSong.findOne({ trackId });
        if (existing) {
            return res.status(400).json({ message: 'This song is already in the batch playlist!' });
        }

        const song = new PlaylistSong({
            trackId,
            title,
            artist,
            albumArtUrl,
            previewUrl,
            submittedBy: currentUserId,
            voters: [currentUserId] // Auto-vote for your own submission
        });

        await song.save();
        res.status(201).json(song);
    } catch (err: any) {
        console.error('Error adding song:', err);
        res.status(500).json({ message: err.message || 'Server error' });
    }
});

// 3. Upvote / Remove vote for a song
router.post('/vote/:id', protectRoute, async (req, res) => {
    try {
        const songId = req.params.id;
        const currentUserId = (req as any).user._id;

        const song = await PlaylistSong.findById(songId);
        if (!song) return res.status(404).json({ message: 'Song not found' });

        const hasVoted = song.voters.some((id: any) => id.toString() === currentUserId.toString());

        if (hasVoted) {
            song.voters = song.voters.filter(id => id.toString() !== currentUserId.toString());
        } else {
            song.voters.push(currentUserId);

            // Notify submitter if it's someone else's song
            if (song.submittedBy.toString() !== currentUserId.toString()) {
                await sendNotification({
                    recipientId: song.submittedBy,
                    senderId: currentUserId,
                    type: 'LIKE' as const,
                    message: `upvoted your playlist addition: ${song.title}`
                });
            }
        }

        await song.save();
        res.json(song);
    } catch (err: any) {
        console.error('Error voting for song:', err);
        res.status(500).json({ message: err.message || 'Server error' });
    }
});

export default router;
