import mongoose from "mongoose";

const TeamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    sport: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    creatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    maxSize: {
        type: Number,
        default: 11
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Team = mongoose.model("Team", TeamSchema);
export default Team;
