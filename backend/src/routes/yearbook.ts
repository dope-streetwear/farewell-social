import express from 'express';
import { protectRoute } from '../middleware/auth.js';
import YearbookEntry from '../models/YearbookEntry.js';
import User from '../models/User.js';
import { Notification } from '../models/Notification.js';

const router = express.Router();

// Get yearbook for a user
router.get('/:username', protectRoute, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username } as any);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const entries = await YearbookEntry.find({ recipientId: user._id })
            .populate('authorId', 'username displayName profileImageUrl')
            .sort({ createdAt: -1 });

        res.json(entries);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// Sign a yearbook
router.post('/:username', protectRoute, async (req, res) => {
    try {
        const { message, color } = req.body;
        const recipient = await User.findOne({ username: req.params.username } as any);
        if (!recipient) return res.status(404).json({ message: 'User not found' });

        const newEntry = new YearbookEntry({
            recipientId: recipient._id,
            authorId: (req as any).user._id,
            message,
            color: color || '#FFC857'
        });

        await newEntry.save();

        // Send Notification
        if (recipient._id.toString() !== (req as any).user._id.toString()) {
            const notification = new Notification({
                recipientId: recipient._id,
                senderId: (req as any).user._id,
                type: 'MENTION',
                message: `signed your digital yearbook!`,
                postId: undefined // Optional, but helps keep it clean
            });
            await notification.save();

            // Emit via socket if io is global (usually handled in server.ts or socket handlers)
            const io = req.app.get('io');
            if (io) {
                io.to(`user:${recipient._id}`).emit('new-notification', {
                    type: 'yearbook_sign',
                    senderName: (req as any).user.displayName,
                    message: 'signed your digital yearbook!'
                });
            }
        }

        const populated = await newEntry.populate('authorId', 'username displayName profileImageUrl');
        res.status(201).json(populated);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
