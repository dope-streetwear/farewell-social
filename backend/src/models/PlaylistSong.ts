import mongoose, { Schema, Document } from 'mongoose';

export interface IPlaylistSong extends Document {
    trackId: string;
    title: string;
    artist: string;
    albumArtUrl: string;
    previewUrl?: string; // iTunes 30-sec preview
    submittedBy: mongoose.Types.ObjectId;
    voters: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const PlaylistSongSchema: Schema = new Schema(
    {
        trackId: { type: String, required: true, unique: true },
        title: { type: String, required: true },
        artist: { type: String, required: true },
        albumArtUrl: { type: String, required: true },
        previewUrl: { type: String },
        submittedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        voters: [{ type: Schema.Types.ObjectId, ref: 'User' }]
    },
    { timestamps: true }
);

const PlaylistSong = mongoose.model<IPlaylistSong>('PlaylistSong', PlaylistSongSchema);
export default PlaylistSong;
