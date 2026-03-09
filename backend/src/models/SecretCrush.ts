import mongoose, { Document, Schema } from 'mongoose';

export interface ISecretCrush extends Document {
    fromUserId: mongoose.Types.ObjectId;
    toUserId: mongoose.Types.ObjectId;
    createdAt: Date;
}

const SecretCrushSchema: Schema = new Schema(
    {
        fromUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        toUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

// One user can only crush on another user once
SecretCrushSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true });

export default mongoose.model<ISecretCrush>('SecretCrush', SecretCrushSchema);
