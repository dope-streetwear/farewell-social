import express from 'express';
import multer from 'multer';
import Story from '../models/Story.js';
import { protectRoute } from '../middleware/auth.js';

const router = express.Router();

import { storage } from '../config/cloudinary.js';

const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB

// Create a story (expires in 24 hours)
router.post('/', protectRoute, upload.single('media'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) return res.status(400).json({ message: 'Media is required for a story' });

        const isVideo = file.mimetype.startsWith('video/');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

        const story = new Story({
            authorId: (req as any).user._id,
            mediaUrl: file.path,
            mediaType: isVideo ? 'video' : 'image',
            caption: req.body.caption || '',
            expiresAt,
        });

        await story.save();
        await story.populate('authorId', 'username displayName profileImageUrl verificationTier');

        res.status(201).json(story);
    } catch (error) {
        console.error('Error creating story:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Get all active stories grouped by user
router.get('/', protectRoute, async (req, res) => {
    try {
        const now = new Date();
        const stories = await Story.find({ expiresAt: { $gt: now } })
            .sort({ createdAt: -1 })
            .populate('authorId', 'username displayName profileImageUrl verificationTier');

        // Group stories by author
        const grouped: Record<string, { user: any; stories: any[] }> = {};
        for (const story of stories) {
            const author = story.authorId as any;
            const authorId = author._id.toString();
            if (!grouped[authorId]) {
                grouped[authorId] = { user: author, stories: [] };
            }
            grouped[authorId].stories.push(story);
        }

        // Convert to array, put current user's stories first
        const currentUserId = (req as any).user._id.toString();
        const result = Object.values(grouped).sort((a, b) => {
            if (a.user._id.toString() === currentUserId) return -1;
            if (b.user._id.toString() === currentUserId) return 1;
            return 0;
        });

        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching stories:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// View a story (mark as viewed)
router.post('/:id/view', protectRoute, async (req, res) => {
    try {
        const userId = (req as any).user._id;
        const story = await Story.findById(req.params.id);
        if (!story) return res.status(404).json({ message: 'Story not found' });

        if (!story.viewers.some((id: any) => id.toString() === userId.toString())) {
            story.viewers.push(userId);
            await story.save();
        }

        res.status(200).json({ viewed: true });
    } catch (error) {
        console.error('Error viewing story:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Delete own story
router.delete('/:id', protectRoute, async (req, res) => {
    try {
        const story = await Story.findById(req.params.id);
        if (!story) return res.status(404).json({ message: 'Story not found' });

        if (story.authorId.toString() !== (req as any).user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await Story.deleteOne({ _id: story._id });
        res.status(200).json({ message: 'Story deleted' });
    } catch (error) {
        console.error('Error deleting story:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;
