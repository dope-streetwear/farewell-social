import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protectRoute = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies['farewell_token'];

        if (!token) {
            return res.status(401).json({ message: 'Unauthorized - No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || (() => { throw new Error('JWT_SECRET not set'); })()) as { userId: string };

        const user = await User.findById(decoded.userId).select('-passwordHash');
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized - User not found' });
        }

        (req as any).user = user;
        next();
    } catch (error) {
        console.error('Error in protectRoute middleware:', error);
        res.status(401).json({ message: 'Unauthorized - Invalid token' });
    }
};

export const protectAdminRoute = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies['admin_token'];

        if (!token) {
            return res.status(401).json({ message: 'Unauthorized Admin - No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || (() => { throw new Error('JWT_SECRET not set'); })()) as { adminId: string };
        (req as any).adminId = decoded.adminId;
        next();
    } catch (error) {
        console.error('Error in protectAdminRoute middleware:', error);
        res.status(401).json({ message: 'Unauthorized Admin - Invalid token' });
    }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies['farewell_token'];
        if (!token) return next();

        const decoded = jwt.verify(token, process.env.JWT_SECRET || (() => { throw new Error('JWT_SECRET not set'); })()) as { userId: string };
        const user = await User.findById(decoded.userId).select('-passwordHash');
        if (user) {
            (req as any).user = user;
        }
        next();
    } catch (error) {
        // Just proceed without auth if token is invalid
        next();
    }
};
