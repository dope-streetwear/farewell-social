import mongoose, { Schema, Document } from 'mongoose';

export interface ISuperlative extends Document {
    title: string;       // e.g., "Best Jodi", "Class Clown"
    description: string;
    icon: string;        // emoji or lucide icon name
    status: 'VOTING' | 'REVEALED';
    winnerId?: mongoose.Types.ObjectId; // Set when status becomes REVEALED
    createdAt: Date;
    updatedAt: Date;
}

const SuperlativeSchema: Schema = new Schema(
    {
        title: { type: String, required: true, unique: true },
        description: { type: String, required: true },
        icon: { type: String, required: true },
        status: { type: String, enum: ['VOTING', 'REVEALED'], default: 'VOTING' },
        winnerId: { type: Schema.Types.ObjectId, ref: 'User' }
    },
    { timestamps: true }
);

const Superlative = mongoose.model<ISuperlative>('Superlative', SuperlativeSchema);
export default Superlative;
