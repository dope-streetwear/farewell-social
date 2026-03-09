import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import AnonymousPost from '../models/AnonymousPost.js';
import { protectAdminRoute } from '../middleware/auth.js';

const router = express.Router();

// Generate Token
const generateAdminTokenAndSetCookie = (adminId: string, res: express.Response) => {
    const token = jwt.sign({ adminId }, process.env.JWT_SECRET || 'secret_key', {
        expiresIn: '24h',
    });

    res.cookie('admin_token', token, {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV !== 'development',
    });
};

// Setup initial admin (only works if no admin exists)
router.post('/setup', async (req, res) => {
    try {
        const count = await Admin.countDocuments();
        if (count > 0) {
            return res.status(400).json({ message: 'Admin is already setup.' });
        }

        const { passcode, recoveryEmail } = req.body;
        if (!passcode || passcode.length !== 10) {
            return res.status(400).json({ message: 'A 10-digit passcode is required.' });
        }

        const salt = await bcrypt.genSalt(10);
        const passcodeHash = await bcrypt.hash(passcode, salt);

        // Generate some backup codes
        const backupCodes = Array.from({ length: 5 }, () =>
            Math.random().toString(36).substring(2, 10).toUpperCase()
        );

        const newAdmin = new Admin({
            passcodeHash,
            recoveryEmail,
            backupCodes,
        });

        await newAdmin.save();
        res.status(201).json({ message: 'Admin setup successfully', backupCodes });
    } catch (error) {
        console.error('Admin setup error', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Admin Login
router.post('/login', async (req, res) => {
    try {
        const { passcode, isBackupCode } = req.body;
        const admin = await Admin.findOne();

        if (!admin) {
            return res.status(404).json({ message: 'Admin not setup yet' });
        }

        if (isBackupCode) {
            if (admin.backupCodes.includes(passcode)) {
                // Remove the used backup code
                admin.backupCodes = admin.backupCodes.filter((c: string) => c !== passcode);
                await admin.save();
                generateAdminTokenAndSetCookie(admin._id.toString(), res);
                return res.status(200).json({ message: 'Logged in with backup code' });
            } else {
                return res.status(401).json({ message: 'Invalid backup code' });
            }
        } else {
            const isMatch = await bcrypt.compare(passcode, admin.passcodeHash);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid passcode' });
            }
            generateAdminTokenAndSetCookie(admin._id.toString(), res);
            return res.status(200).json({ message: 'Logged in successfully' });
        }
    } catch (error) {
        console.error('Admin login error', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Admin Logout
router.post('/logout', (req, res) => {
    res.cookie('admin_token', '', { maxAge: 0 });
    res.status(200).json({ message: 'Logged out successfully' });
});

// Verify Auth state
router.get('/me', protectAdminRoute, async (req, res) => {
    res.status(200).json({ message: 'Authenticated' });
});

// View all users
router.get('/users', protectAdminRoute, async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Delete user
router.delete('/users/:id', protectAdminRoute, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Set User Verification Tier (0=none, 1=Silver, 2=Blue, 3=Yellow, 4=Purple, 5=Red)
router.patch('/users/:id/verify', protectAdminRoute, async (req, res) => {
    try {
        const { tier } = req.body;
        const tierNum = parseInt(tier);
        if (isNaN(tierNum) || tierNum < 0 || tierNum > 5) {
            return res.status(400).json({ message: 'Tier must be a number between 0 and 5' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.verificationTier = tierNum;
        await user.save();

        res.status(200).json({ message: 'Verification tier updated', verificationTier: user.verificationTier });
    } catch (error) {
        console.error('Error verifying user', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Get detailed stats for all users
router.get('/users/stats', protectAdminRoute, async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });

        const stats = await Promise.all(users.map(async (user) => {
            const postsCount = await Post.countDocuments({ authorId: user._id });
            const nglCount = await AnonymousPost.countDocuments({ authorId: user._id });
            const commentsCount = await Comment.countDocuments({ userId: user._id, parentCommentId: null });
            const repliesCount = await Comment.countDocuments({ userId: user._id, parentCommentId: { $ne: null } });

            return {
                _id: user._id,
                username: user.username,
                displayName: user.displayName,
                classSection: user.classSection,
                verificationImageUrl: user.verificationImageUrl,
                profileImageUrl: user.profileImageUrl,
                verificationTier: user.verificationTier,
                createdAt: user.createdAt,
                stats: { postsCount, nglCount, commentsCount, repliesCount }
            };
        }));

        res.status(200).json(stats);
    } catch (error) {
        console.error('Error fetching user stats', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Gmail Fallback Note: For full Google OAuth, we need google-auth-library.
// For now, this is a placeholder endpoint the frontend can call if we implement simple OTP.
// In a real app, you'd verify the Google JWT here and check if it matches recoveryEmail.
router.post('/google-login', async (req, res) => {
    try {
        const { email } = req.body;
        const admin = await Admin.findOne();

        if (!admin) {
            return res.status(404).json({ message: 'Admin not setup yet' });
        }

        if (admin.recoveryEmail === email) {
            generateAdminTokenAndSetCookie(admin._id.toString(), res);
            return res.status(200).json({ message: 'Logged in via Google' });
        } else {
            return res.status(401).json({ message: 'Unauthorized email' });
        }
    } catch (error) {
        console.error('Admin Google login error', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;
