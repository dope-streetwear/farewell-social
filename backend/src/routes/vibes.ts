import express from 'express';
import User from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { protectRoute } from '../middleware/auth.js';

const router = express.Router();

const VIBE_QUESTIONS = [
    "Who has the best smile?",
    "Always saves the day in exams?",
    "Most likely to become a billionaire?",
    "Dresses better than the teachers?",
    "Secretly a genius?",
    "Who is the life of the party?",
    "Most likely to sleep in class and still top?",
    "Has the best music taste?",
    "Always carrying snacks?",
    "Most athletic in the batch?"
];

// Get 5 random polls
router.get('/polls', protectRoute, async (req, res) => {
    try {
        const userId = (req as any).user._id;

        // Pick 5 random questions
        const shuffledQuestions = [...VIBE_QUESTIONS].sort(() => 0.5 - Math.random());
        const selectedQuestions = shuffledQuestions.slice(0, 5);

        // Fetch user's friends (or random users from batch if not enough friends)
        const batchUsers = await User.find({ _id: { $ne: userId } }, '_id displayName profileImageUrl').limit(50);

        if (batchUsers.length < 4) {
            return res.status(200).json({ polls: [] });
        }

        const polls = selectedQuestions.map(q => {
            const shuffledUsers = [...batchUsers].sort(() => 0.5 - Math.random());
            const options = shuffledUsers.slice(0, 4);
            return {
                id: Math.random().toString(36).substring(7),
                question: q,
                options
            };
        });

        res.status(200).json({ polls });
    } catch (error) {
        console.error("Error generating vibe polls", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Submit a vote
router.post('/vote', protectRoute, async (req, res) => {
    try {
        const { targetUserId, question } = req.body;
        const voterId = (req as any).user._id;

        if (!targetUserId || !question) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Increment flames
        const targetUser = await User.findById(targetUserId);
        if (!targetUser) return res.status(404).json({ message: "User not found" });

        targetUser.flames = (targetUser.flames || 0) + 1;
        await targetUser.save();

        // Create anonymous notification
        await Notification.create({
            recipientId: targetUser._id,
            // Even though it's anonymous to the receiver, we record the real sender in DB
            // But we will alter how it displays on the frontend, OR we map the sender to a system ID. 
            // We'll store the real sender so admin/system knows, but we will send a special message
            senderId: voterId,
            type: 'LIKE', // reusing LIKE or creating VOTE type, let's just use LIKE for now
            message: `Someone thinks you are: "${question}" 🔥 (+1 Flame)`
        });

        res.status(200).json({ message: "Vote cast successfully", flames: targetUser.flames });
    } catch (error) {
        console.error("Error submitting vibe vote", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
