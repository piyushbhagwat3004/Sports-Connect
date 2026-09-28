import mongoose from "mongoose";

const PlayerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false }
}, { _id: false });

const EventTeamSchema = new mongoose.Schema({
    name: { type: String, required: true },
    color: { type: String, default: "#667eea" },
    players: [PlayerSchema]
}, { _id: false });

const StandingRowSchema = new mongoose.Schema({
    teamName: { type: String, required: true },
    played:       { type: Number, default: 0 },
    won:          { type: Number, default: 0 },
    lost:         { type: Number, default: 0 },
    drawn:        { type: Number, default: 0 },
    goalsFor:     { type: Number, default: 0 },
    goalsAgainst: { type: Number, default: 0 },
    points:       { type: Number, default: 0 }
}, { _id: false });

const SportEntrySchema = new mongoose.Schema({
    sportName: { type: String, required: true },
    // top-N teams that advance from group stage to knockout (point 3)
    advanceCount: { type: Number, default: 2, min: 1 },
    teams:              [EventTeamSchema],
    standings:          [StandingRowSchema],
    groupMatchIds:      [{ type: mongoose.Schema.Types.ObjectId, ref: "EventMatch" }],
    knockoutMatchIds:   [{ type: mongoose.Schema.Types.ObjectId, ref: "EventMatch" }]
}, { _id: false });

const SportEventSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: "" },
    hostId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    startDate: { type: Date, required: true },
    endDate:   { type: Date, required: true },
    // 8-char uppercase unique key followers use to join (e.g. "GOLD2024")
    eventKey: { type: String, unique: true, required: true, uppercase: true },
    coverImage: { type: String, default: "" },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    sports: [SportEntrySchema],
    createdAt: { type: Date, default: Date.now }
});

const SportEvent = mongoose.model("SportEvent", SportEventSchema);
export default SportEvent;
