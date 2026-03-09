import mongoose, { Document, Schema } from 'mongoose';

export interface ILike extends Document {
    postId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    createdAt: Date;
}

const LikeSchema: Schema = new Schema(
    {
        postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

// Prevent duplicate likes
LikeSchema.index({ postId: 1, userId: 1 }, { unique: true });

export default mongoose.model<ILike>('Like', LikeSchema);
