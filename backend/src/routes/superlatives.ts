import express from 'express';
import { protectRoute } from '../middleware/auth.js';
import Superlative from '../models/Superlative.js';
import SuperlativeVote from '../models/SuperlativeVote.js';
import User from '../models/User.js';

const router = express.Router();

const SEED_SUPERLATIVES = [
    { title: "Best Jodi", description: "The most iconic duo of the batch.", icon: "heart" },
    { title: "Bunk King/Queen", description: "Always marked present, never actually in class.", icon: "door-open" },
    { title: "Future PM", description: "Most likely to take over the world.", icon: "globe" },
    { title: "Class Clown", description: "The reason the teacher said 'Is this a fish market?'", icon: "smile" },
    { title: "The Sleepyhead", description: "Can sleep through a fire alarm.", icon: "moon" }
];

// Initialize Superlatives (run once or upon hit if empty)
const initSuperlatives = async () => {
    const count = await Superlative.countDocuments();
    if (count === 0) {
        await Superlative.insertMany(SEED_SUPERLATIVES);
        console.log('Seeded initial superlatives');
    }
};

// 1. Get all superlatives & my votes
router.get('/', protectRoute, async (req, res) => {
    try {
        await initSuperlatives();
        const currentUserId = (req as any).user._id;

        const superlatives = await Superlative.find().populate('winnerId', 'username displayName profileImageUrl').lean();

        // Find which ones the current user has voted on
        const myVotes = await SuperlativeVote.find({ voterId: currentUserId }).populate('nomineeId', 'username displayName profileImageUrl').lean();

        // Map votes to superlative ID for easy frontend lookup
        const voteMap = myVotes.reduce((acc: any, vote: any) => {
            acc[vote.superlativeId.toString()] = vote.nomineeId; // The user they nominated
            return acc;
        }, {});

        res.json({ superlatives, myVotes: voteMap });
    } catch (err: any) {
        console.error('Error fetching superlatives:', err);
        res.status(500).json({ message: err.message || 'Server error' });
    }
});

// 2. Search users to nominate
router.get('/search', protectRoute, async (req, res) => {
    try {
        const query = req.query.q as string;
        if (!query) return res.json([]);

        const users = await User.find({
            $or: [
                { username: { $regex: query, $options: 'i' } },
                { displayName: { $regex: query, $options: 'i' } }
            ]
        }).select('username displayName profileImageUrl').limit(10);

        res.json(users);
    } catch (err: any) {
        res.status(500).json({ message: err.message || 'Server error' });
    }
});

// 3. Vote for a superlative
router.post('/:superlativeId/vote', protectRoute, async (req, res) => {
    try {
        const { superlativeId } = req.params;
        const { nomineeId } = req.body;
        const currentUserId = (req as any).user._id;

        const superlative = await Superlative.findById(superlativeId);
        if (!superlative) return res.status(404).json({ message: 'Superlative not found' });

        if (superlative.status === 'REVEALED') {
            return res.status(400).json({ message: 'Voting has closed for this award.' });
        }

        const nominee = await User.findById(nomineeId);
        if (!nominee) return res.status(404).json({ message: 'Nominee not found' });

        // Upsert vote
        await (SuperlativeVote as any).findOneAndUpdate(
            { superlativeId, voterId: currentUserId },
            { nomineeId },
            { upsert: true, new: true }
        );

        res.json({ message: 'Vote recorded!' });
    } catch (err: any) {
        console.error('Error voting:', err);
        res.status(500).json({ message: err.message || 'Server error' });
    }
});

export default router;
