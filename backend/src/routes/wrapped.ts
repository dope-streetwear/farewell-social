import express from 'express';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Like from '../models/Like.js';
import AnonymousPost from '../models/AnonymousPost.js';
import User from '../models/User.js';
import { protectRoute } from '../middleware/auth.js';

const router = express.Router();

// Get wrapped stats for current user
router.get('/me', protectRoute, async (req, res) => {
    try {
        const userId = (req as any).user._id;
        const userDoc = (req as any).user;

        // Total posts by user
        const totalPosts = await Post.countDocuments({ authorId: userId });

        // Total likes received on user's posts
        const userPostIds = await Post.find({ authorId: userId }).select('_id');
        const postIds = userPostIds.map(p => p._id);
        const totalLikesReceived = await Like.countDocuments({ postId: { $in: postIds } });

        // Total comments made by user
        const totalCommentsMade = await Comment.countDocuments({ userId });

        // Total comments received on user's posts
        const totalCommentsReceived = await Comment.countDocuments({ postId: { $in: postIds } });

        // Total NGL posts
        const totalNgls = await AnonymousPost.countDocuments({ authorId: userId });

        // Flames received
        const flames = userDoc.flames || 0;

        // Most liked post
        let mostLikedPost = null;
        if (postIds.length > 0) {
            const likeCounts = await Like.aggregate([
                { $match: { postId: { $in: postIds } } },
                { $group: { _id: '$postId', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 1 }
            ]);
            if (likeCounts.length > 0) {
                const post = await Post.findById(likeCounts[0]._id).select('caption mediaUrl mediaType');
                mostLikedPost = { post, likes: likeCounts[0].count };
            }
        }

        // Top commenter on user's posts (most frequent commenter)
        let topCommenter = null;
        if (postIds.length > 0) {
            const commenters = await Comment.aggregate([
                { $match: { postId: { $in: postIds }, userId: { $ne: userId } } },
                { $group: { _id: '$userId', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 1 }
            ]);
            if (commenters.length > 0) {
                const commenterUser = await User.findById(commenters[0]._id)
                    .select('username displayName profileImageUrl verificationTier');
                topCommenter = { user: commenterUser, count: commenters[0].count };
            }
        }

        // User who liked user's posts the most
        let topLiker = null;
        if (postIds.length > 0) {
            const likers = await Like.aggregate([
                { $match: { postId: { $in: postIds }, userId: { $ne: userId } } },
                { $group: { _id: '$userId', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 1 }
            ]);
            if (likers.length > 0) {
                const likerUser = await User.findById(likers[0]._id)
                    .select('username displayName profileImageUrl verificationTier');
                topLiker = { user: likerUser, count: likers[0].count };
            }
        }

        // Join date
        const joinDate = userDoc.createdAt;

        res.status(200).json({
            username: userDoc.username,
            displayName: userDoc.displayName,
            profileImageUrl: userDoc.profileImageUrl,
            totalPosts,
            totalLikesReceived,
            totalCommentsMade,
            totalCommentsReceived,
            totalNgls,
            flames,
            mostLikedPost,
            topCommenter,
            topLiker,
            joinDate,
        });
    } catch (error) {
        console.error('Error generating wrapped:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;
