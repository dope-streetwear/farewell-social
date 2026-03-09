import express from 'express';
import { protectRoute } from '../middleware/auth.js';
import Confession from '../models/Confession.js';

const router = express.Router();

// 1. Submit a generic confession
router.post('/', protectRoute, async (req, res) => {
    try {
        const { content, backgroundGradient } = req.body;

        if (!content) {
            return res.status(400).json({ message: 'Content is required' });
        }

        const confession = new Confession({
            content,
            backgroundGradient: backgroundGradient || 'from-pink-500 to-rose-500'
        });

        await confession.save();

        res.status(201).json({ message: 'Confession submitted anonymously!' });
    } catch (err: any) {
        console.error('Error submitting confession:', err);
        res.status(500).json({ message: err.message || 'Server error' });
    }
});

// 2. Play Roulette (Fetch 1 random confession)
router.get('/roulette', protectRoute, async (req, res) => {
    try {
        const now = new Date();

        // 1. Is there an actively featured confession that hasn't expired?
        let activeConfession = await Confession.findOne({
            isFeatured: true,
            featuredUntil: { $gt: now }
        });

        if (activeConfession) {
            return res.json(activeConfession);
        }

        // 2. If an active confession exists but exists past expiration, mark it viewed.
        await Confession.updateMany(
            { isFeatured: true },
            { $set: { isFeatured: false, isViewed: true } }
        );

        // 3. Select a new random, unviewed confession to feature
        const unviewedConfessions = await Confession.aggregate([
            { $match: { isViewed: false, isFeatured: false } },
            { $sample: { size: 1 } }
        ]);

        if (unviewedConfessions.length === 0) {
            return res.status(404).json({ message: 'The wheel is empty. No one has dropped any new secrets!' });
        }

        // 4. Mark as featured for the next 5 minutes
        const expirationTime = new Date(now.getTime() + 5 * 60000); // 5 mins
        activeConfession = await Confession.findByIdAndUpdate(
            unviewedConfessions[0]._id,
            {
                isFeatured: true,
                featuredUntil: expirationTime
            },
            { new: true }
        );

        res.json(activeConfession);
    } catch (err: any) {
        console.error('Error fetching random confession:', err);
        res.status(500).json({ message: err.message || 'Server error' });
    }
});

export default router;
