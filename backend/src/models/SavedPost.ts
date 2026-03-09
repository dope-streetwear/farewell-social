import mongoose, { Document, Schema } from 'mongoose';

export interface ISavedPost extends Document {
    postId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    createdAt: Date;
}

const SavedPostSchema: Schema = new Schema(
    {
        postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

// Prevent duplicate saves
SavedPostSchema.index({ postId: 1, userId: 1 }, { unique: true });

export default mongoose.model<ISavedPost>('SavedPost', SavedPostSchema);
