import mongoose, { Document, Schema } from 'mongoose';

export interface IConfession extends Document {
    content: string;
    backgroundGradient: string;
    isFeatured: boolean;
    featuredUntil?: Date;
    isViewed: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ConfessionSchema: Schema = new Schema(
    {
        content: { type: String, required: true, maxlength: 500 },
        backgroundGradient: { type: String, default: 'from-pink-500 to-rose-500' },
        isFeatured: { type: Boolean, default: false },
        featuredUntil: { type: Date },
        isViewed: { type: Boolean, default: false }
    },
    { timestamps: true }
);

export default mongoose.model<IConfession>('Confession', ConfessionSchema);
