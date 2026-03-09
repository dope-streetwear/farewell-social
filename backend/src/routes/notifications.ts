import express from 'express';
import { Notification } from '../models/Notification.js';
import { protectRoute } from '../middleware/auth.js';

const router = express.Router();

// Get unread notifications for the current user
router.get('/', protectRoute, async (req, res) => {
    try {
        const notifications = await Notification.find({ recipientId: (req as any).user._id })
            .sort({ createdAt: -1 })
            .limit(20)
            .populate('senderId', 'username displayName profileImageUrl')
            .populate('postId', '_id caption');

        res.status(200).json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Mark all as read
router.put('/read-all', protectRoute, async (req, res) => {
    try {
        await Notification.updateMany(
            { recipientId: (req as any).user._id, read: false },
            { $set: { read: true } }
        );
        res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking notifications read:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Mark specific notification as read
router.put('/:id/read', protectRoute, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipientId: (req as any).user._id } as any,
            { $set: { read: true } },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.status(200).json(notification);
    } catch (error) {
        console.error('Error marking notification read:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;
