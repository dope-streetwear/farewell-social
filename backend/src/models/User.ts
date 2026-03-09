import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    username: string;
    email?: string;
    googleId?: string;
    displayName: string;
    bio?: string;
    profileImageUrl?: string;
    babyPictureUrl?: string; // For Who's Who Trivia
    verificationImageUrl?: string;
    classSection?: string;
    followers: mongoose.Types.ObjectId[];
    following: mongoose.Types.ObjectId[];
    role: 'user' | 'admin';
    verificationTier: number;
    flames: number;
    stats: {
        postCount: number;
        nglCount: number;
        matchCount: number;
        triviaScore: number;
    };
    slamBook?: {
        nickname?: string;
        favoriteMemory?: string;
        biggestRegret?: string;
        crushName?: string;
        dreamJob?: string;
    };
    achievements: {
        badgeId: string;
        name: string;
        icon: string;
        unlockedAt: Date;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema(
    {
        username: { type: String, required: true, unique: true },
        email: { type: String, sparse: true, unique: true },
        googleId: { type: String, sparse: true, unique: true },
        displayName: { type: String, required: true },
        bio: { type: String, maxlength: 500 },
        classSection: { type: String, default: '' },
        profileImageUrl: { type: String, default: '' },
        babyPictureUrl: { type: String, default: '' },
        verificationImageUrl: { type: String, default: '' },
        followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        following: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        role: { type: String, enum: ['user', 'admin'], default: 'user' },
        verificationTier: { type: Number, default: 0, min: 0, max: 5 },
        flames: { type: Number, default: 0 },
        stats: {
            postCount: { type: Number, default: 0 },
            nglCount: { type: Number, default: 0 },
            matchCount: { type: Number, default: 0 },
            triviaScore: { type: Number, default: 0 }
        },
        slamBook: {
            nickname: { type: String, maxlength: 50 },
            favoriteMemory: { type: String, maxlength: 200 },
            biggestRegret: { type: String, maxlength: 200 },
            crushName: { type: String, maxlength: 50 },
            dreamJob: { type: String, maxlength: 100 }
        },
        achievements: [{
            badgeId: { type: String, required: true },
            name: { type: String, required: true },
            icon: { type: String, required: true },
            unlockedAt: { type: Date, default: Date.now }
        }]
    },
    { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
