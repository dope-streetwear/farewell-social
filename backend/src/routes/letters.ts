import express from 'express';
import { protectRoute } from '../middleware/auth.js';
import Letter from '../models/Letter.js';
import User from '../models/User.js';
import { sendNotification } from '../utils/notifications.js';

const router = express.Router();

// 1. Write a letter
router.post('/', protectRoute, async (req, res) => {
    try {
        const { recipientUsername, content, isPublic, paperStyle } = req.body;
        const authorId = (req as any).user._id;

        if (!content) {
            return res.status(400).json({ message: 'Content is required' });
        }

        const recipient = await User.findOne({ username: recipientUsername } as any);
        if (!recipient) {
            return res.status(404).json({ message: 'Recipient not found' });
        }

        // Check if writing to self
        if (recipient._id.toString() === authorId.toString()) {
            return res.status(400).json({ message: 'You cannot write a farewell letter to yourself.' });
        }

        const letter = new Letter({
            authorId,
            recipientId: recipient._id,
            content,
            isPublic: isPublic !== undefined ? isPublic : true,
            paperStyle: paperStyle || 'classic'
        });

        await letter.save();

        // Notify recipient (assuming VIBE is a generic catch-all, but we should use a specific one if possible. Using MENTION for now as it triggers an alert)
        // Wait, Notification schema doesn't have LETTER type. Let's send a MENTION type notification, or maybe we can add LETTER to Notification schema quickly.
        // I will just use 'LIKE' for now, or update Notifications schema.

        await sendNotification({
            recipientId: recipient._id,
            senderId: authorId,
            type: 'MENTION' as const, // Re-using MENTION for "Mentioned you in a letter" 
            message: 'wrote you a farewell letter"Alvida Khat"'
        });

        res.status(201).json(letter);
    } catch (err: any) {
        console.error('Error writing letter:', err);
        res.status(500).json({ message: err.message || 'Server error' });
    }
});

// 2. Get global public letters feed
router.get('/feed', protectRoute, async (req, res) => {
    try {
        const letters = await Letter.find({ isPublic: true })
            .populate('authorId', 'username displayName profileImageUrl verificationTier')
            .populate('recipientId', 'username displayName profileImageUrl verificationTier')
            .sort({ createdAt: -1 })
            .limit(50); // Pagination in future

        res.json(letters);
    } catch (err: any) {
        console.error('Error fetching public letters:', err);
        res.status(500).json({ message: err.message || 'Server error' });
    }
});

// 3. Get my letters (inbox + sent)
router.get('/me', protectRoute, async (req, res) => {
    try {
        const currentUserId = (req as any).user._id;

        const received = await Letter.find({ recipientId: currentUserId })
            .populate('authorId', 'username displayName profileImageUrl verificationTier')
            .populate('recipientId', 'username displayName profileImageUrl verificationTier')
            .sort({ createdAt: -1 });

        const sent = await Letter.find({ authorId: currentUserId })
            .populate('authorId', 'username displayName profileImageUrl verificationTier')
            .populate('recipientId', 'username displayName profileImageUrl verificationTier')
            .sort({ createdAt: -1 });

        res.json({ received, sent });
    } catch (err: any) {
        console.error('Error fetching your letters:', err);
        res.status(500).json({ message: err.message || 'Server error' });
    }
});

// 4. Get a specific user's public received letters
router.get('/user/:username', protectRoute, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username } as any);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const letters = await Letter.find({ recipientId: user._id, isPublic: true })
            .populate('authorId', 'username displayName profileImageUrl verificationTier')
            .populate('recipientId', 'username displayName profileImageUrl verificationTier')
            .sort({ createdAt: -1 });

        res.json(letters);
    } catch (err: any) {
        console.error('Error fetching user letters:', err);
        res.status(500).json({ message: err.message || 'Server error' });
    }
});

export default router;
