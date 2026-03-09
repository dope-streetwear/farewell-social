import mongoose, { Document, Schema } from 'mongoose';

export interface IAdmin extends Document {
    passcodeHash: string;
    backupCodes: string[];
    recoveryEmail: string;
}

const AdminSchema: Schema = new Schema(
    {
        passcodeHash: { type: String, required: true },
        backupCodes: [{ type: String }],
        recoveryEmail: { type: String, required: true },
    },
    { timestamps: true }
);

export default mongoose.model<IAdmin>('Admin', AdminSchema);
