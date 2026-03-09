import mongoose, { Schema, Document } from 'mongoose';

export interface ILetter extends Document {
    authorId: mongoose.Types.ObjectId;
    recipientId: mongoose.Types.ObjectId;
    content: string;
    isPublic: boolean;
    paperStyle: string;
    createdAt: Date;
    updatedAt: Date;
}

const LetterSchema: Schema = new Schema(
    {
        authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        content: { type: String, required: true },
        isPublic: { type: Boolean, default: true },
        paperStyle: { type: String, default: 'classic' } // classic, parchment, ruled, polaroid
    },
    { timestamps: true }
);

const Letter = mongoose.model<ILetter>('Letter', LetterSchema);
export default Letter;
