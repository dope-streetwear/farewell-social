import mongoose, { Document, Schema } from 'mongoose';

export interface IFlashChallenge extends Document {
    prompt: string;
    activeUntil: Date;
    createdAt: Date;
}

const FlashChallengeSchema: Schema = new Schema(
    {
        prompt: { type: String, required: true },
        activeUntil: { type: Date, required: true },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model<IFlashChallenge>('FlashChallenge', FlashChallengeSchema);
