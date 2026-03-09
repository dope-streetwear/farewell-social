import mongoose, { Document, Schema } from 'mongoose';

export interface IPost extends Document {
    authorId: mongoose.Types.ObjectId;
    mediaUrl: string;
    mediaUrl2?: string;
    mediaType: 'image' | 'video' | 'none';
    type: 'REGULAR' | 'THEN_VS_NOW';
    unlockDate?: Date;
    caption?: string;
    tags?: string[];
    spotifyTrackId?: string;
    songTitle?: string;
    artistName?: string;
    audioPreviewUrl?: string;
    audioStartTime?: number;
    repostOf?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const PostSchema: Schema = new Schema(
    {
        authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        mediaUrl: { type: String, required: function (this: any) { return !this.repostOf && this.type !== 'THEN_VS_NOW'; } },
        mediaUrl2: { type: String },
        mediaType: { type: String, enum: ['image', 'video', 'none'], default: 'none' },
        type: { type: String, enum: ['REGULAR', 'THEN_VS_NOW'], default: 'REGULAR' },
        unlockDate: { type: Date },
        caption: { type: String, maxlength: 2200 },
        tags: [{ type: String }],
        spotifyTrackId: { type: String },
        songTitle: { type: String },
        artistName: { type: String },
        audioPreviewUrl: { type: String },
        audioStartTime: { type: Number, default: 0 },
        repostOf: { type: Schema.Types.ObjectId, ref: 'Post' }
    },
    { timestamps: true }
);

export default mongoose.model<IPost>('Post', PostSchema);
