import express from 'express';
import SecretCrush from '../models/SecretCrush.js';
import User from '../models/User.js';
import { protectRoute } from '../middleware/auth.js';
import { sendNotification } from '../utils/notifications.js';

const router = express.Router();

// Send a secret crush
router.post('/send', protectRoute, async (req, res) => {
    try {
        const fromUserId = (req as any).user._id;
        const { toUserId } = req.body;

        if (!toUserId) return res.status(400).json({ message: 'Target user is required' });
        if (fromUserId.toString() === toUserId) return res.status(400).json({ message: 'Apne aap ko crush nahi bana sakte' });

        // Check if already sent
        const existing = await SecretCrush.findOne({ fromUserId, toUserId } as any);
        if (existing) return res.status(400).json({ message: 'Already sent a crush to this user' });

        await SecretCrush.create({ fromUserId, toUserId });

        // Check for mutual match
        const mutual = await SecretCrush.findOne({ fromUserId: toUserId, toUserId: fromUserId } as any);

        if (mutual) {
            // Notify both users (or at least the target, as the sender already knows from the response)
            await sendNotification({
                recipientId: toUserId,
                senderId: fromUserId,
                type: 'MATCH',
                message: 'It\'s a match! You both crushed on each other.'
            });
            // Also notify the sender just to be consistent with real-time UI
            await sendNotification({
                recipientId: fromUserId,
                senderId: toUserId,
                type: 'MATCH',
                message: 'It\'s a match! You both crushed on each other.'
            });
        }

        res.status(201).json({
            message: mutual ? 'IT\'S A MATCH!' : 'Crush sent secretly',
            isMatch: !!mutual,
        });
    } catch (error: any) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Already sent a crush to this user' });
        }
        console.error('Error sending crush:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Remove a crush
router.delete('/unsend/:toUserId', protectRoute, async (req, res) => {
    try {
        const fromUserId = (req as any).user._id;
        await SecretCrush.deleteOne({ fromUserId, toUserId: req.params.toUserId } as any);
        res.status(200).json({ message: 'Crush removed' });
    } catch (error) {
        console.error('Error removing crush:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Get my matches (mutual crushes)
router.get('/matches', protectRoute, async (req, res) => {
    try {
        const userId = (req as any).user._id;

        // Find all users I've crushed on
        const myCrushes = await SecretCrush.find({ fromUserId: userId });
        const crushTargetIds = myCrushes.map(c => c.toUserId);

        // Find which of those have also crushed on me
        const mutualCrushes = await SecretCrush.find({
            fromUserId: { $in: crushTargetIds },
            toUserId: userId
        }).populate('fromUserId', 'username displayName profileImageUrl verificationTier');

        const matches = mutualCrushes.map(c => c.fromUserId);

        res.status(200).json(matches);
    } catch (error) {
        console.error('Error fetching matches:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Get my crush status (who I've crushed on - just IDs, no revealing who crushed on me)
router.get('/my-crushes', protectRoute, async (req, res) => {
    try {
        const userId = (req as any).user._id;
        const crushes = await SecretCrush.find({ fromUserId: userId }).select('toUserId');
        const crushIds = crushes.map(c => c.toUserId.toString());
        res.status(200).json(crushIds);
    } catch (error) {
        console.error('Error fetching crushes:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Get user list for browsing (paginated)
router.get('/browse', protectRoute, async (req, res) => {
    try {
        const userId = (req as any).user._id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;

        const users = await User.find({ _id: { $ne: userId } })
            .select('username displayName profileImageUrl classSection verificationTier')
            .skip(skip)
            .limit(limit);

        res.status(200).json(users);
    } catch (error) {
        console.error('Error browsing users:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;
