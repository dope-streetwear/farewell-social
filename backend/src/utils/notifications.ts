import { Notification } from '../models/Notification.js';
import { io } from '../server.js';
import mongoose from 'mongoose';

export const sendNotification = async (payload: {
    recipientId: string | mongoose.Types.ObjectId;
    senderId: string | mongoose.Types.ObjectId;
    type: 'MENTION' | 'LIKE' | 'COMMENT' | 'REPLY' | 'REPOST' | 'MATCH' | 'VIBE';
    postId?: string | mongoose.Types.ObjectId;
    commentId?: string | mongoose.Types.ObjectId;
    message: string;
}) => {
    try {
        const notif = await Notification.create(payload);
        const populatedNotif = await notif.populate('senderId', 'username displayName profileImageUrl verificationTier');

        // Emit via Socket.io to the recipient's room
        io.to(`user:${payload.recipientId}`).emit('new-notification', populatedNotif);

        return populatedNotif;
    } catch (error) {
        console.error('Error sending real-time notification:', error);
    }
};
