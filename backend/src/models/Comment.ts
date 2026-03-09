import mongoose, { Document, Schema } from 'mongoose';

export interface IComment extends Document {
    postId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    text: string;
    parentCommentId?: mongoose.Types.ObjectId | null;
    likes: mongoose.Types.ObjectId[];
    createdAt: Date;
}

const CommentSchema: Schema = new Schema(
    {
        postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        parentCommentId: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
        likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model<IComment>('Comment', CommentSchema);
