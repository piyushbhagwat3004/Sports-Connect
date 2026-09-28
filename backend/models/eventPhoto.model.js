import mongoose from "mongoose";

const EventPhotoSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SportEvent",
        required: true
    },
    hostId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    caption: { type: String, default: "" },
    // filename in /uploads — reuses same Multer storage as Post model
    media: { type: String, required: true },
    fileType: { type: String, default: "" },
    // array of user-id strings — same shape as Post.likes
    likes: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now }
});

const EventPhoto = mongoose.model("EventPhoto", EventPhotoSchema);
export default EventPhoto;
