import express from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { protectRoute } from '../middleware/auth.js';
import multer from 'multer';
import Tesseract from 'tesseract.js';
import AuditLog from '../models/AuditLog.js';

const router = express.Router();

const safeDestroy = async (filename: string) => {
    try {
        await cloudinary.uploader.destroy(filename);
    } catch (error) {
        console.error('Failed to cleanup Cloudinary image:', filename, error);
    }
};

// ─── Multer (for OCR verification image upload during first signup) ────────────
import { storage } from '../config/cloudinary.js';
import cloudinary from '../config/cloudinary.js';

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET environment variable is not set');
    return secret;
};

const generateTokenAndSetCookie = (userId: string, res: express.Response) => {
    const token = jwt.sign({ userId }, getJwtSecret(), { expiresIn: '15d' });
    res.cookie('farewell_token', token, {
        maxAge: 15 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV !== 'development',
    });
};

const getGoogleClient = () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) throw new Error('GOOGLE_CLIENT_ID environment variable is not set');
    return new OAuth2Client(clientId);
};

/**
 * Verify a Google credential (ID token) and return the payload.
 * Returns { googleId, email, name, picture } or throws.
 */
const verifyGoogleToken = async (credential: string) => {
    const client = getGoogleClient();
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) throw new Error('GOOGLE_CLIENT_ID environment variable is not set');

    const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: clientId,
    });

    if (!ticket) throw new Error('Invalid Google ticket');
    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email) {
        throw new Error('Invalid Google token payload');
    }
    return {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name || payload.email.split('@')[0] || 'User',
        picture: payload.picture || '',
    };
};

/**
 * Check that OCR text looks like a valid Narayana credential.
 * ID card   → "NARAYANA"
 * App SS    → "NARAYANA"  OR  "ADMISSION" + school keywords
 */
const isValidNarayanaImage = (rawText: string): boolean => {
    const t = rawText.toUpperCase();

    // Check for Narayana/School keywords
    const hasNarayana = t.includes('NARAYANA');
    const hasAppKeywords =
        t.includes('ADMISSION') &&
        (t.includes('CLASS') || t.includes('GROUP') || t.includes('BRANCH') ||
            t.includes('ETECHNO') || t.includes('E-TECHNO') || t.includes('REGULAR') || t.includes('TECHNO'));

    // Strict 10th grade check
    const isTenthGrade = /(10TH|10 TH|CLASS X|CLASS-X|CLASS 10|GRADE 10|X REGULAR|X ETECHNO|X-REGULAR)/.test(t);

    return (hasNarayana || hasAppKeywords) && isTenthGrade;
};

// ─── GOOGLE AUTH — Login or detect new user ───────────────────────────────────
// POST /api/auth/google
// Body: { credential: <Google ID token> }
// Response:
//   - Existing user  → sets cookie + returns user data
//   - New user       → returns { needsSignup: true, googleId, email, name, picture }
router.post('/google', async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({ message: 'Google credential is required' });
        }

        const googleUser = await verifyGoogleToken(credential);

        // Find existing user by googleId or email
        const existingUser = await User.findOne({
            $or: [{ googleId: googleUser.googleId }, { email: googleUser.email }]
        });

        if (existingUser) {
            // Patch googleId if user was created before OAuth (e.g., via legacy route)
            if (!existingUser.googleId) {
                existingUser.googleId = googleUser.googleId;
                await existingUser.save();
            }

            // Log successful login
            const logData: any = {
                userId: existingUser._id,
                action: 'LOGIN',
                details: { method: 'google', email: googleUser.email },
            };
            if (req.ip) logData.ipAddress = req.ip;
            if (req.headers['user-agent']) logData.userAgent = req.headers['user-agent'];

            await AuditLog.create(logData);

            generateTokenAndSetCookie(existingUser._id.toString(), res);
            return res.status(200).json({
                _id: existingUser._id,
                username: existingUser.username,
                displayName: existingUser.displayName,
                classSection: existingUser.classSection,
                profileImageUrl: existingUser.profileImageUrl,
                verificationTier: existingUser.verificationTier,
            });
        }

        // New user — tell the frontend they need to complete signup
        return res.status(200).json({
            needsSignup: true,
            googleId: googleUser.googleId,
            email: googleUser.email,
            name: googleUser.name,
            picture: googleUser.picture,
        });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(401).json({ message: 'Google authentication failed. Please try again.' });
    }
});

// ─── GOOGLE SIGNUP — First-time only, OCR required ───────────────────────────
// POST /api/auth/google/signup
// Multipart: credential, verificationImage, username, classSection
// (displayName and email taken from verified Google token — no user spoofing)
const handleUpload = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    upload.single('verificationImage')(req, res, (err: any) => {
        if (err) {
            console.error('Upload Error:', err);
            return res.status(400).json({ message: `Image upload failed: ${err.message || 'Please try a smaller image'}` });
        }
        next();
    });
};

router.post('/google/signup', handleUpload, async (req, res) => {
    try {
        const { credential, username, classSection } = req.body;
        const file = req.file;

        if (!credential) {
            if (file) await safeDestroy(file.filename);
            return res.status(400).json({ message: 'Google credential is required' });
        }
        if (!username) {
            if (file) await safeDestroy(file.filename);
            return res.status(400).json({ message: 'Username is required' });
        }
        if (!file) {
            return res.status(400).json({ message: 'Verification image (ID card or App Screenshot) is required' });
        }

        // Verify Google token
        let googleUser: { googleId: string; email: string; name: string; picture: string };
        try {
            googleUser = await verifyGoogleToken(credential);
        } catch {
            if (file) await safeDestroy(file.filename);
            return res.status(401).json({ message: 'Google credential is invalid or expired. Please sign in again.' });
        }

        // Check uniqueness before OCR
        const existingEmail = await User.findOne({ email: googleUser.email });
        if (existingEmail) {
            if (file) await safeDestroy(file.filename);
            return res.status(400).json({ message: 'An account with this Google email already exists. Please login instead.' });
        }
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            if (file) await safeDestroy(file.filename);
            return res.status(400).json({ message: 'Username is already taken. Please choose another.' });
        }

        // OCR — keyword check only
        try {
            const worker = await Tesseract.createWorker('eng');
            const { data: { text } } = await worker.recognize(file.path);
            await worker.terminate();

            if (!isValidNarayanaImage(text)) {
                if (file) await safeDestroy(file.filename);
                return res.status(400).json({
                    message: 'Verification failed. Image does not appear to be a valid 10th Grade Narayana ID card or nConnect App screenshot. Make sure your grade (e.g. 10th, Class X) is clearly visible.'
                });
            }
        } catch (ocrError) {
            console.error('OCR Error:', ocrError);
            if (file) await safeDestroy(file.filename);
            return res.status(500).json({ message: 'Error processing verification image. Please try a clearer image.' });
        }

        // Create user — displayName and picture come from Google (trusted source)
        const newUser = new User({
            username,
            email: googleUser.email,
            googleId: googleUser.googleId,
            displayName: googleUser.name,
            profileImageUrl: googleUser.picture || undefined,
            classSection,
            verificationImageUrl: file.path,
        });

        await newUser.save();

        // Log successful signup with critical verification details
        const signupLogData: any = {
            userId: newUser._id,
            action: 'SIGNUP',
            details: {
                method: 'google',
                email: googleUser.email,
                username: newUser.username,
                classSection: newUser.classSection,
                verificationImageUrl: newUser.verificationImageUrl
            }
        };
        if (req.ip) signupLogData.ipAddress = req.ip;
        if (req.headers['user-agent']) signupLogData.userAgent = req.headers['user-agent'];

        await AuditLog.create(signupLogData);

        generateTokenAndSetCookie(newUser._id.toString(), res);

        res.status(201).json({
            _id: newUser._id,
            username: newUser.username,
            displayName: newUser.displayName,
            classSection: newUser.classSection,
            profileImageUrl: newUser.profileImageUrl,
            verificationTier: newUser.verificationTier,
        });
    } catch (error) {
        if (req.file) await safeDestroy(req.file.filename);
        console.error('Error in google signup:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
    try {
        res.cookie('farewell_token', '', {
            maxAge: 0,
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV !== 'development',
        });
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Error in logout controller', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// ─── ME ───────────────────────────────────────────────────────────────────────
router.get('/me', protectRoute, async (req, res) => {
    try {
        res.status(200).json((req as any).user);
    } catch (error) {
        console.error('Error in /me controller', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;
