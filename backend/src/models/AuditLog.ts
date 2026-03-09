import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
    userId?: mongoose.Types.ObjectId;
    action: string;
    details: any;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
}

const AuditLogSchema: Schema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        action: { type: String, required: true },
        details: { type: Schema.Types.Mixed, default: {} },
        ipAddress: { type: String },
        userAgent: { type: String },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
