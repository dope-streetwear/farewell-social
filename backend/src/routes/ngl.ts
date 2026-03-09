import express from 'express';
import multer from 'multer';
import AnonymousPost from '../models/AnonymousPost.js';
import { protectRoute, optionalAuth } from '../middleware/auth.js';
import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';
import { sendNotification } from '../utils/notifications.js';

const router = express.Router();

import { storage } from '../config/cloudinary.js';

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Create Anonymous Post
// We protect this route so only logged-in users can post to prevent spam,
// but their identity is never populated in the feed.
router.post('/', protectRoute, upload.single('media'), async (req, res) => {
    try {
        const { text, theme } = req.body;
        const file = req.file;

        if (!text && !file) {
            return res.status(400).json({ message: 'Text or media is required for anonymous post' });
        }

        let mediaUrl = undefined;
        let mediaType = undefined;

        if (file) {
            const isVideo = file.mimetype.startsWith('video/');
            const isAudio = file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/webm'); // sometimes webm audio records as video/webm
            mediaUrl = file.path;
            mediaType = isAudio && !isVideo ? 'audio' : (isVideo ? 'video' : 'image');

            // Explicit override if it's an audio blob from our recorder
            if (req.body.isAudio === 'true') {
                mediaType = 'audio';
            }
        }

        const newAnonPost = new AnonymousPost({
            authorId: (req as any).user._id, // stored internally only
            text,
            mediaUrl,
            mediaType,
            theme: theme || 'default'
        });

        await newAnonPost.save();

        // Log the anonymous post securely in the backend
        const anonLogData: any = {
            userId: newAnonPost.authorId,
            action: 'CREATE_NGL',
            details: {
                text: newAnonPost.text,
                mediaUrl: newAnonPost.mediaUrl,
            }
        };
        if (req.ip) anonLogData.ipAddress = req.ip;
        if (req.headers['user-agent']) anonLogData.userAgent = req.headers['user-agent'];
        await AuditLog.create(anonLogData);

        // Parse mentions in NGL post
        if (text) {
            const mentions = text.match(/@([a-zA-Z0-9_]+)/g);
            if (mentions) {
                const usernames = mentions.map((m: string) => m.substring(1));
                const uniqueUsernames = [...new Set(usernames)];
                const users = await User.find({ username: { $in: uniqueUsernames } } as any);

                for (const u of users) {
                    if (u._id.toString() !== (req as any).user._id.toString()) {
                        await sendNotification({
                            recipientId: u._id,
                            senderId: (req as any).user._id,
                            type: 'MENTION' as const,
                            postId: newAnonPost._id,
                            message: `mentioned you in an anonymous post`
                        });
                    }
                }
            }
        }

        res.status(201).json({
            _id: newAnonPost._id,
            text: newAnonPost.text,
            mediaUrl: newAnonPost.mediaUrl,
            mediaType: newAnonPost.mediaType,
            theme: newAnonPost.theme,
            createdAt: newAnonPost.createdAt
        });
    } catch (error) {
        console.error('Error creating anon post', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Get Anonymous Feed
// Notice we DO NOT populate authorId, preserving complete anonymity on the frontend!
router.get('/', optionalAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 15;
        const skip = (page - 1) * limit;

        const anonPosts = await AnonymousPost.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const userId = (req as any).user?._id?.toString();
        const now = Date.now();

        // Map posts to hide authorId but inject isEditable if they are the author and within 15 min
        const formattedPosts = anonPosts.map(post => {
            const ageMs = now - post.createdAt.getTime();
            const isAuthor = userId && post.authorId.toString() === userId;
            const isEditable = isAuthor && ageMs <= 15 * 60 * 1000;

            const { authorId, ...rest } = post.toObject();
            return {
                ...rest,
                isEditable,
            };
        });

        res.status(200).json(formattedPosts);
    } catch (error) {
        console.error('Error getting anon posts', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Edit Anonymous Post
router.put('/:id', protectRoute, async (req, res) => {
    try {
        const { text, theme } = req.body;
        const post = await AnonymousPost.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post.authorId.toString() !== (req as any).user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized. You can only edit your own posts.' });
        }

        if (Date.now() - post.createdAt.getTime() > 15 * 60 * 1000) {
            return res.status(403).json({ message: 'Edit window expired. Posts can only be edited within 15 minutes of creation.' });
        }

        if (text !== undefined) post.text = text;
        if (theme !== undefined) post.theme = theme;

        await post.save();

        const { authorId, ...rest } = post.toObject();
        res.status(200).json({ ...rest, isEditable: true });
    } catch (error) {
        console.error('Error updating anon post', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Delete Anonymous Post
router.delete('/:id', protectRoute, async (req, res) => {
    try {
        const post = await AnonymousPost.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post.authorId.toString() !== (req as any).user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized. You can only delete your own posts.' });
        }

        if (Date.now() - post.createdAt.getTime() > 15 * 60 * 1000) {
            return res.status(403).json({ message: 'Delete window expired. Posts can only be deleted within 15 minutes of creation.' });
        }

        await post.deleteOne();
        res.status(200).json({ message: 'Anonymous post deleted completely.' });
    } catch (error) {
        console.error('Error deleting anon post', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;
