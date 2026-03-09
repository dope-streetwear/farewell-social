import express from 'express';
import User from '../models/User.js';
import AnonymousPost from '../models/AnonymousPost.js';
import Post from '../models/Post.js';
import { protectRoute } from '../middleware/auth.js';
import multer from 'multer';

const router = express.Router();

import { storage } from '../config/cloudinary.js';
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Search users for @mention autocomplete
router.get('/search', protectRoute, async (req, res) => {
    try {
        const q = (req.query.q as string || '').trim();
        if (!q || q.length < 1) return res.status(200).json([]);

        const regex = new RegExp(q, 'i');
        const users = await User.find({
            $or: [
                { username: { $regex: regex } },
                { displayName: { $regex: regex } }
            ]
        })
            .select('username displayName profileImageUrl verificationTier')
            .limit(8);

        res.status(200).json(users);
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Get Main Character of the Day (Spotlight)
router.get('/spotlight', async (req, res) => {
    try {
        const today = new Date();
        const dateString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

        let hash = 0;
        for (let i = 0; i < dateString.length; i++) {
            hash = dateString.charCodeAt(i) + ((hash << 5) - hash);
        }

        const count = await User.countDocuments();
        if (count === 0) return res.status(200).json(null);

        const index = Math.abs(hash) % count;
        const spotlightUser = await User.findOne().skip(index).select('username displayName profileImageUrl classSection');

        res.status(200).json(spotlightUser);
    } catch (error) {
        console.error('Error fetching spotlight user:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Get public user profile by username
router.get('/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username })
            .select('username email displayName bio classSection profileImageUrl verificationTier slamBook');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const stats = {
            postCount: await Post.countDocuments({ authorId: user._id }),
            nglCount: await AnonymousPost.countDocuments({ authorId: user._id })
        };

        res.status(200).json({ ...user.toObject(), stats });
    } catch (error) {
        console.error('Error fetching user profile', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Update Profile
router.put('/profile', protectRoute, upload.single('profileImage'), async (req, res) => {
    try {
        const { username, email } = req.body;
        const file = req.file;

        const userId = (req as any).user._id;
        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ message: 'User not found' });

        if (username && username !== user.username) {
            const existingUser = await User.findOne({ username });
            if (existingUser) return res.status(400).json({ message: 'Username is already taken' });
            user.username = username;
        }

        if (email && email !== user.email) {
            const existingEmail = await User.findOne({ email });
            if (existingEmail) return res.status(400).json({ message: 'Email is already in use by another account' });
            user.email = email;
        }

        if (file) {
            user.profileImageUrl = file.path;
        }

        await user.save();
        res.status(200).json(user);
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Update Slam Book
router.put('/slambook', protectRoute, async (req, res) => {
    try {
        const { nickname, favoriteMemory, biggestRegret, crushName, dreamJob } = req.body;
        const userId = (req as any).user._id;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.slamBook = { nickname, favoriteMemory, biggestRegret, crushName, dreamJob };
        await user.save();

        res.status(200).json(user.slamBook);
    } catch (error) {
        console.error('Error updating slam book:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Check and award achievements
router.get('/achievements/check', protectRoute, async (req, res) => {
    try {
        const userId = (req as any).user._id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const postCount = await Post.countDocuments({ authorId: userId });
        const nglCount = await AnonymousPost.countDocuments({ authorId: userId });

        const unlockedBadges: any[] = [];
        const currentBadges = new Set(user.achievements.map(a => a.badgeId));

        const checkAndAward = (id: string, name: string, icon: string, condition: boolean) => {
            if (condition && !currentBadges.has(id)) {
                const newBadge = { badgeId: id, name, icon, unlockedAt: new Date() };
                user.achievements.push(newBadge);
                unlockedBadges.push(newBadge);
            }
        };

        checkAndAward('first_post', 'First Step', '🌟', postCount >= 1);
        checkAndAward('five_posts', 'Rising Star', '✨', postCount >= 5);
        checkAndAward('first_ngl', 'Secret Keeper', '🤫', nglCount >= 1);
        checkAndAward('hot_streak', 'On Fire', '🔥', user.flames >= 10);
        checkAndAward('trivia_master', 'Trivia Master', '🧠', user.stats.triviaScore >= 50);

        if (unlockedBadges.length > 0) {
            await user.save();
        }

        res.status(200).json({ unlocked: unlockedBadges, all: user.achievements });
    } catch (error) {
        console.error('Error checking achievements:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;
