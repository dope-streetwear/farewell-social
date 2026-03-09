import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
    recipientId: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    type: 'MENTION' | 'LIKE' | 'COMMENT' | 'REPLY' | 'REPOST' | 'MATCH';
    postId?: mongoose.Types.ObjectId;
    commentId?: mongoose.Types.ObjectId;
    message: string;
    read: boolean;
    createdAt: Date;
}

const notificationSchema = new Schema<INotification>({
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['MENTION', 'LIKE', 'COMMENT', 'REPLY', 'REPOST', 'MATCH'], required: true },
    postId: { type: Schema.Types.ObjectId, ref: 'Post' },
    commentId: { type: Schema.Types.ObjectId, ref: 'Comment' },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
