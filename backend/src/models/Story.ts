import mongoose, { Document, Schema } from 'mongoose';

export interface IStory extends Document {
    authorId: mongoose.Types.ObjectId;
    mediaUrl: string;
    mediaType: 'image' | 'video';
    caption?: string;
    viewers: mongoose.Types.ObjectId[];
    expiresAt: Date;
    createdAt: Date;
}

const StorySchema: Schema = new Schema(
    {
        authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        mediaUrl: { type: String, required: true },
        mediaType: { type: String, enum: ['image', 'video'], required: true },
        caption: { type: String, maxlength: 500 },
        viewers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model<IStory>('Story', StorySchema);
