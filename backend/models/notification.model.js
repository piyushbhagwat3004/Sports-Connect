import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    type: {
        type: String,
        enum: ["connection_request", "comment", "team_invite", "team_join_request", "like", "team_message", "event_invite"],
        required: true,
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
    },
    message: {
        type: String,
        required: true,
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

const Notification = mongoose.model("Notification", NotificationSchema);
export default Notification;
