import mongoose, { Document, Schema } from 'mongoose';

export interface IFlashResponse extends Document {
    challengeId: mongoose.Types.ObjectId;
    authorId: mongoose.Types.ObjectId;
    mediaUrl: string;
    caption?: string;
    createdAt: Date;
}

const FlashResponseSchema: Schema = new Schema(
    {
        challengeId: { type: Schema.Types.ObjectId, ref: 'FlashChallenge', required: true },
        authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        mediaUrl: { type: String, required: true },
        caption: { type: String, maxlength: 200 },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model<IFlashResponse>('FlashResponse', FlashResponseSchema);
