import mongoose from "mongoose";

const TeamRefSchema = new mongoose.Schema({
    name:  { type: String, required: true },
    color: { type: String, default: "#667eea" }
}, { _id: false });

const EventMatchSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SportEvent",
        required: true
    },
    sport: { type: String, required: true },
    homeTeam: { type: TeamRefSchema, required: true },
    awayTeam: { type: TeamRefSchema, required: true },

    // Canonical scores used for standings calculations.
    // For basketball: sum of quarter points.
    // For set-based sports: sets won.
    // For everything else: direct score (goals, runs, etc.)
    homeScore: { type: Number, default: 0 },
    awayScore: { type: Number, default: 0 },

    // Current period / phase label shown live.
    // Football: "1st Half" | "Half Time" | "2nd Half" | "Full Time" | "Extra Time" | "Penalties"
    // Basketball: "Q1" | "Q2" | "Q3" | "Q4" | "OT"
    // Cricket: "1st Innings" | "Innings Break" | "2nd Innings" | "Match Complete"
    // Others: free text
    period: { type: String, default: "" },

    // Sport-specific extended details stored as a flexible object.
    // Football:    { htHomeScore, htAwayScore }
    // Cricket:     { homeWickets, awayWickets, homeOvers, awayOvers, battingTeam, innings }
    // Basketball:  { quarters: [{home, away}, {home, away}, {home, away}, {home, away}] }
    // Set sports:  { sets: [{home, away}, ...] }
    scoreDetails: { type: mongoose.Schema.Types.Mixed, default: {} },

    status: {
        type: String,
        enum: ["scheduled", "live", "completed"],
        default: "scheduled"
    },
    round:     { type: String, default: "Group Stage" },
    matchDate: { type: Date },
    venue:     { type: String, default: "" },
    winner:    { type: String, default: "" },
}, { timestamps: true });

const EventMatch = mongoose.model("EventMatch", EventMatchSchema);
export default EventMatch;
