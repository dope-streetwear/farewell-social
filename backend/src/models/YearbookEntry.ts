import mongoose, { Schema, Document } from 'mongoose';

export interface IYearbookEntry extends Document {
    recipientId: mongoose.Types.ObjectId;
    authorId: mongoose.Types.ObjectId;
    message: string;
    color: string;
    createdAt: Date;
}

const YearbookEntrySchema: Schema = new Schema({
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true, maxlength: 500 },
    color: { type: String, default: '#FFC857' }, // Default Narayana Yellow
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IYearbookEntry>('YearbookEntry', YearbookEntrySchema);
