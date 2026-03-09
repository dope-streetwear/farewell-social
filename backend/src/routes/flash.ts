import express from 'express';
import multer from 'multer';
import FlashChallenge from '../models/FlashChallenge.js';
import FlashResponse from '../models/FlashResponse.js';
import { protectRoute } from '../middleware/auth.js';

const router = express.Router();

import { storage } from '../config/cloudinary.js';

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Get current active flash challenge
router.get('/current', protectRoute, async (req, res) => {
    try {
        let challenge = await FlashChallenge.findOne({ activeUntil: { $gt: new Date() } }).sort({ createdAt: -1 });

        // If no active challenge, maybe create one for the demo/daily
        if (!challenge) {
            const prompts = [
                "Backbench ki picture dikhao!",
                "Show your classroom right now!",
                "Lunch mein kya kha rahe ho?",
                "Best friend ke saath ek selfie!",
                "Library mein padhai ho rahi hai?",
                "Ground mein kya chal raha hai?"
            ];
            const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

            challenge = await FlashChallenge.create({
                prompt: randomPrompt as string,
                activeUntil: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours active
            });
        }

        // Check if user has already responded
        const response = await FlashResponse.findOne({
            challengeId: (challenge as any)._id,
            authorId: (req as any).user._id
        } as any);

        res.status(200).json({ challenge, hasResponded: !!response });
    } catch (error) {
        console.error('Error fetching current flash challenge:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Submit response to flash challenge
router.post('/submit', protectRoute, upload.single('media'), async (req, res) => {
    try {
        const { challengeId, caption } = req.body;
        const file = req.file;

        if (!file) return res.status(400).json({ message: 'Media is required' });
        if (!challengeId) return res.status(400).json({ message: 'Challenge ID is required' });

        const challenge = await FlashChallenge.findById(challengeId);
        if (!challenge || challenge.activeUntil < new Date()) {
            return res.status(400).json({ message: 'Challenge is no longer active' });
        }

        const existingResponse = await FlashResponse.findOne({
            challengeId,
            authorId: (req as any).user._id
        });
        if (existingResponse) return res.status(400).json({ message: 'Already responded to this challenge' });

        const response = await FlashResponse.create({
            challengeId,
            authorId: (req as any).user._id,
            mediaUrl: file.path,
            caption: caption || ''
        });

        res.status(201).json(response);
    } catch (error) {
        console.error('Error submitting flash response:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Get all responses for a challenge (to show after responding)
router.get('/responses/:challengeId', protectRoute, async (req, res) => {
    try {
        const responses = await FlashResponse.find({ challengeId: req.params.challengeId } as any)
            .populate('authorId', 'username displayName profileImageUrl verificationTier')
            .sort({ createdAt: -1 });

        res.status(200).json(responses);
    } catch (error) {
        console.error('Error fetching flash responses:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;
