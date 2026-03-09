import express from 'express';
import multer from 'multer';
import Post from '../models/Post.js';
import Like from '../models/Like.js';
import Comment from '../models/Comment.js';
import SavedPost from '../models/SavedPost.js';
import { protectRoute } from '../middleware/auth.js';
import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { sendNotification } from '../utils/notifications.js';

const router = express.Router();

import { storage } from '../config/cloudinary.js';

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Create Post
router.post('/', protectRoute, upload.array('media', 2), async (req, res) => {
    try {
        const { caption, tags, spotifyTrackId, unlockDate, type } = req.body;
        const files = req.files as Express.Multer.File[];

        if ((!files || files.length === 0) && !caption) {
            return res.status(400).json({ message: 'Post must contain either media or caption' });
        }

        let mediaUrl = undefined;
        let mediaUrl2 = undefined;
        let mediaType = 'none';

        if (files && files.length > 0) {
            const isVideo = (files[0] as any)?.mimetype?.startsWith('video/');
            mediaUrl = (files[0] as any)?.path;
            mediaType = isVideo ? 'video' : 'image';

            if (files.length > 1) {
                mediaUrl2 = (files[1] as any)?.path;
            }
        }

        const newPost = new Post({
            authorId: (req as any).user._id,
            caption,
            mediaUrl,
            mediaUrl2,
            mediaType,
            type: type || 'REGULAR',
            tags: tags ? JSON.parse(tags) : [],
            spotifyTrackId,
            unlockDate: unlockDate ? new Date(unlockDate) : undefined
        });

        await newPost.save();

        // Log the standard post creation
        const postLogData: any = {
            userId: newPost.authorId,
            action: 'CREATE_POST',
            details: {
                caption: newPost.caption,
                mediaUrl: newPost.mediaUrl,
            }
        };
        if (req.ip) postLogData.ipAddress = req.ip;
        if (req.headers['user-agent']) postLogData.userAgent = req.headers['user-agent'];
        await AuditLog.create(postLogData);

        await newPost.populate('authorId', 'username displayName profileImageUrl verificationTier');

        // Parse mentions
        if (caption) {
            const mentions = caption.match(/@([a-zA-Z0-9_]+)/g);
            if (mentions) {
                const usernames = mentions.map((m: string) => m.substring(1));
                const uniqueUsernames = [...new Set(usernames)];
                const users = await User.find({ username: { $in: uniqueUsernames } } as any);

                const notifications = users.map(u => ({
                    recipientId: u._id,
                    senderId: (req as any).user._id,
                    type: 'MENTION' as const,
                    postId: newPost._id,
                    message: `mentioned you in a post`
                }));

                for (const notif of notifications) {
                    await sendNotification(notif);
                }
            }
        }

        res.status(201).json(newPost);
    } catch (error) {
        console.error('Error creating post', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Repost
router.post('/:id/repost', protectRoute, async (req, res) => {
    try {
        const originalPost = await Post.findById(req.params.id);
        if (!originalPost) return res.status(404).json({ message: 'Original post not found' });

        const currentUserId = (req as any).user._id;
        const newPost = new Post({
            authorId: currentUserId,
            repostOf: originalPost._id,
        });

        await newPost.save();

        // Send REPOST notification to original author
        if (originalPost.authorId.toString() !== currentUserId.toString()) {
            await sendNotification({
                recipientId: originalPost.authorId,
                senderId: currentUserId,
                type: 'REPOST',
                postId: originalPost._id,
                message: 'reposted your post'
            });
        }

        await newPost.populate('authorId', 'username displayName profileImageUrl verificationTier');
        await newPost.populate({
            path: 'repostOf',
            populate: { path: 'authorId', select: 'username displayName profileImageUrl verificationTier' }
        });

        res.status(201).json(newPost);
    } catch (err) {
        console.error('Error reposting', err);
        res.status(500).json({ message: 'Error reposting' });
    }
});

// Global Feed (all normal posts)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('authorId', 'username displayName profileImageUrl classSection verificationTier')
            .populate({
                path: 'repostOf',
                populate: { path: 'authorId', select: 'username displayName profileImageUrl classSection verificationTier' }
            });

        // Attach basic stats (for simplicity in this local scale we can just fetch or aggregate)
        // A more scalable approach is denormalization or aggregation pipeline.
        const postsWithStats = await Promise.all(posts.map(async (post: any) => {
            const likesCount = await Like.countDocuments({ postId: post._id });
            const commentsCount = await Comment.countDocuments({ postId: post._id });
            return { ...post.toObject(), likesCount, commentsCount };
        }));

        res.status(200).json(postsWithStats);
    } catch (error) {
        console.error('Error getting global feed', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Get User's Posts
router.get('/user/:userId', async (req, res) => {
    try {
        const posts = await Post.find({ authorId: req.params.userId })
            .sort({ createdAt: -1 })
            .populate('authorId', 'username displayName profileImageUrl classSection verificationTier')
            .populate({
                path: 'repostOf',
                populate: { path: 'authorId', select: 'username displayName profileImageUrl classSection verificationTier' }
            });

        res.status(200).json(posts);
    } catch (error) {
        console.error('Error getting user posts', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Get Single Post
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('authorId', 'username displayName profileImageUrl classSection verificationTier')
            .populate({
                path: 'repostOf',
                populate: { path: 'authorId', select: 'username displayName profileImageUrl classSection verificationTier' }
            });

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const likesCount = await Like.countDocuments({ postId: post._id });
        const commentsCount = await Comment.countDocuments({ postId: post._id });

        res.status(200).json({ ...post.toObject(), likesCount, commentsCount });
    } catch (error) {
        console.error('Error getting single post', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// LIKES
router.post('/:id/like', protectRoute, async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = (req as any).user._id;

        const existingLike = await Like.findOne({ postId, userId } as any);

        if (existingLike) {
            await Like.deleteOne({ _id: existingLike._id });
            return res.status(200).json({ message: 'Unliked post', liked: false });
        } else {
            await new Like({ postId, userId }).save();

            // Send LIKE notification to post author (not to yourself)
            const post = await Post.findById(postId);
            if (post && post.authorId.toString() !== userId.toString()) {
                await sendNotification({
                    recipientId: post.authorId,
                    senderId: userId,
                    type: 'LIKE',
                    postId: req.params.id as string,
                    message: 'liked your post'
                });
            }

            return res.status(200).json({ message: 'Liked post', liked: true });
        }
    } catch (error) {
        console.error('Error toggling like', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// COMMENTS
router.get('/:id/comments', async (req, res) => {
    try {
        const comments = await Comment.find({ postId: req.params.id })
            .sort({ createdAt: 1 })
            .populate('userId', 'username displayName profileImageUrl verificationTier');

        res.status(200).json(comments);
    } catch (error) {
        console.error('Error getting comments', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.post('/:id/comments', protectRoute, async (req, res) => {
    try {
        const { text, parentCommentId } = req.body;
        if (!text) return res.status(400).json({ message: 'Comment text is required' });

        const currentUserId = (req as any).user._id;

        const newComment = new Comment({
            postId: req.params.id,
            userId: currentUserId,
            text,
            parentCommentId: parentCommentId || null
        });

        await newComment.save();
        await newComment.populate('userId', 'username displayName profileImageUrl verificationTier');

        // Send COMMENT or REPLY notification
        if (parentCommentId) {
            // It's a reply — notify the parent comment author
            const parentComment = await Comment.findById(parentCommentId);
            if (parentComment && parentComment.userId.toString() !== currentUserId.toString()) {
                await sendNotification({
                    recipientId: parentComment.userId,
                    senderId: currentUserId,
                    type: 'REPLY',
                    postId: req.params.id as string,
                    commentId: newComment._id as any,
                    message: 'replied to your comment'
                });
            }
        } else {
            // It's a top-level comment — notify the post author
            const post = await Post.findById(req.params.id);
            if (post && post.authorId.toString() !== currentUserId.toString()) {
                await sendNotification({
                    recipientId: post.authorId,
                    senderId: currentUserId,
                    type: 'COMMENT',
                    postId: req.params.id as string,
                    commentId: newComment._id as any,
                    message: 'commented on your post'
                });
            }
        }

        // Parse @mentions in comment text
        const mentions = text.match(/@([a-zA-Z0-9_]+)/g);
        if (mentions) {
            const usernames = mentions.map((m: string) => m.substring(1));
            const uniqueUsernames = [...new Set(usernames)];
            const mentionedUsers = await User.find({ username: { $in: uniqueUsernames } } as any);

            const mentionNotifs = mentionedUsers
                .filter(u => u._id.toString() !== currentUserId.toString())
                .map(u => ({
                    recipientId: u._id,
                    senderId: currentUserId,
                    type: 'MENTION' as const,
                    postId: req.params.id as string,
                    commentId: newComment._id as any,
                    message: 'mentioned you in a comment'
                }));

            for (const notif of mentionNotifs) {
                await sendNotification(notif);
            }
        }

        res.status(201).json(newComment);
    } catch (error) {
        console.error('Error creating comment', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// SAVES
router.post('/:id/comments/:commentId/like', protectRoute, async (req, res) => {
    try {
        const commentId = req.params.commentId;
        const userId = (req as any).user._id;

        const comment = await Comment.findById(commentId);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        const isLiked = comment.likes.some((id: any) => id.toString() === userId.toString());

        if (isLiked) {
            comment.likes = comment.likes.filter((id) => id.toString() !== userId.toString());
        } else {
            comment.likes.push(userId);
        }

        await comment.save();
        res.status(200).json(comment.likes);
    } catch (error) {
        console.error('Error in like comment controller: ', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// SAVES
router.post('/:id/save', protectRoute, async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = (req as any).user._id;

        const existingSave = await SavedPost.findOne({ postId, userId } as any);

        if (existingSave) {
            await SavedPost.deleteOne({ _id: existingSave._id });
            return res.status(200).json({ message: 'Removed from saved', saved: false });
        } else {
            await new SavedPost({ postId, userId }).save();
            return res.status(200).json({ message: 'Saved post', saved: true });
        }
    } catch (error) {
        console.error('Error toggling save', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Get User's Saved Posts
router.get('/saved/me', protectRoute, async (req, res) => {
    try {
        const saves = await SavedPost.find({ userId: (req as any).user._id })
            .sort({ createdAt: -1 })
            .populate({
                path: 'postId',
                populate: [
                    { path: 'authorId', select: 'username displayName profileImageUrl verificationTier' },
                    { path: 'repostOf', populate: { path: 'authorId', select: 'username displayName profileImageUrl verificationTier' } }
                ]
            });

        res.status(200).json(saves.map(s => s.postId));
    } catch (error) {
        console.error('Error getting saved posts', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;
