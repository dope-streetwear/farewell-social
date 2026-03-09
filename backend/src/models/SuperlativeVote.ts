import mongoose, { Schema, Document } from 'mongoose';

export interface ISuperlativeVote extends Document {
    superlativeId: mongoose.Types.ObjectId;
    voterId: mongoose.Types.ObjectId;
    nomineeId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const SuperlativeVoteSchema: Schema = new Schema(
    {
        superlativeId: { type: Schema.Types.ObjectId, ref: 'Superlative', required: true },
        voterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        nomineeId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
    },
    { timestamps: true }
);

// One user can only vote once per superlative
SuperlativeVoteSchema.index({ superlativeId: 1, voterId: 1 }, { unique: true });

const SuperlativeVote = mongoose.model<ISuperlativeVote>('SuperlativeVote', SuperlativeVoteSchema);
export default SuperlativeVote;
