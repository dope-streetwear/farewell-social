import express from 'express';
import multer from 'multer';
import path from 'path';
import { protectRoute } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// Configure multer for baby pictures
import { storage } from '../config/cloudinary.js';

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});

// 1. Upload Baby Picture
router.post('/upload-baby-pic', protectRoute, upload.single('babyPicture'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        const userId = (req as any).user._id;
        const babyPictureUrl = req.file.path;

        const user = await User.findByIdAndUpdate(
            userId,
            { babyPictureUrl },
            { new: true }
        ).select('-passwordHash');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'Baby picture uploaded successfully', user });
    } catch (err: any) {
        console.error('Error uploading baby pic:', err);
        res.status(500).json({ message: err.message || 'Server error' });
    }
});

// 2. Get Trivia Question
router.get('/question', protectRoute, async (req, res) => {
    try {
        const userId = (req as any).user._id;

        // Find users who have a baby picture (excluding current user)
        const candidates = await User.aggregate([
            { $match: { babyPictureUrl: { $gt: "" }, _id: { $ne: userId } } },
            { $sample: { size: 1 } } // Pick 1 random user
        ]);

        if (candidates.length === 0) {
            return res.status(404).json({ message: 'Not enough players have uploaded baby pictures yet. Check back later!' });
        }

        const correctUser = candidates[0];

        // Now pick 3 random other users for incorrect options
        const incorrectOptions = await User.aggregate([
            { $match: { _id: { $ne: correctUser._id } } }, // Can be the current user
            { $sample: { size: 3 } },
            { $project: { _id: 1, displayName: 1, username: 1 } }
        ]);

        // If we don't have enough users yet overall, fetch what we can

        let options = [
            { _id: correctUser._id, displayName: correctUser.displayName, username: correctUser.username },
            ...incorrectOptions
        ];

        // Shuffle options
        options = options.sort(() => Math.random() - 0.5);

        res.json({
            questionId: correctUser._id, // Send ID so frontend knows which one 'owns' the pic (but keep it hidden!)
            babyPictureUrl: correctUser.babyPictureUrl,
            options: options
        });

    } catch (err: any) {
        console.error('Error fetching trivia question:', err);
        res.status(500).json({ message: err.message || 'Server error' });
    }
});

// 3. Submit Guess
router.post('/guess', protectRoute, async (req, res) => {
    try {
        const { questionId, guessedUserId } = req.body;
        const userId = (req as any).user._id;

        if (!questionId || !guessedUserId) {
            return res.status(400).json({ message: 'Missing questionId or guessedUserId' });
        }

        const isCorrect = questionId === guessedUserId;

        if (isCorrect) {
            // Increment score
            await User.findByIdAndUpdate(
                userId,
                { $inc: { 'stats.triviaScore': 1 } }
            );
        }

        // Return actual answers to help frontend say "You guessed X, it was actually Y!"
        const actualUser = await User.findById(questionId).select('displayName username');

        res.json({
            isCorrect,
            actualUser,
            message: isCorrect ? 'Spot on!' : 'Oof, that was incorrect!'
        });

    } catch (err: any) {
        console.error('Error submitting guess:', err);
        res.status(500).json({ message: err.message || 'Server error' });
    }
});

// 4. Get Leaderboard (Optional, for showing top guessers)
router.get('/leaderboard', protectRoute, async (req, res) => {
    try {
        const leaders = await User.find({ 'stats.triviaScore': { $gt: 0 } })
            .sort({ 'stats.triviaScore': -1 })
            .limit(10)
            .select('displayName username profileImageUrl stats.triviaScore');

        res.json(leaders);
    } catch (err: any) {
        res.status(500).json({ message: err.message || 'Server error' });
    }
});

export default router;
