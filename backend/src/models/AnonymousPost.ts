import mongoose, { Document, Schema } from 'mongoose';

export interface IAnonymousPost extends Document {
    authorId: mongoose.Types.ObjectId;
    text: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video' | 'audio' | null;
    theme?: string;
    createdAt: Date;
}

const AnonymousPostSchema: Schema = new Schema(
    {
        authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true, maxlength: 800 },
        mediaUrl: { type: String },
        mediaType: { type: String, enum: ['image', 'video', 'audio', null] },
        theme: { type: String, default: 'default' },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model<IAnonymousPost>('AnonymousPost', AnonymousPostSchema);
