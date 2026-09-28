import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import SportEvent from "../models/sportEvent.model.js";
import EventMatch from "../models/eventMatch.model.js";
import EventPhoto from "../models/eventPhoto.model.js";
import User from "../models/user.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Auth helper ────────────────────────────────────────────────────────────
// Reads token from x-auth-token header OR body.token — never from query string.
const resolveUser = async (req) => {
    const token = req.headers["x-auth-token"] || req.body?.token;
    if (!token) return null;
    return User.findOne({ token });
};

// ─── Standings helper ────────────────────────────────────────────────────────
// Deterministic 5-tier tie-break sort (plan point 2):
//   1. Points (desc)  2. Goal Difference (desc)  3. Goals Scored (desc)
//   4. Head-to-head winner  5. Alphabetical (asc)
function sortStandings(rows, completedMatches) {
    return [...rows].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;

        const gdA = a.goalsFor - a.goalsAgainst;
        const gdB = b.goalsFor - b.goalsAgainst;
        if (gdB !== gdA) return gdB - gdA;

        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;

        // Head-to-head between exactly these two teams
        const h2h = completedMatches.find(
            (m) =>
                (m.homeTeam.name === a.teamName && m.awayTeam.name === b.teamName) ||
                (m.homeTeam.name === b.teamName && m.awayTeam.name === a.teamName)
        );
        if (h2h && h2h.homeScore !== h2h.awayScore) {
            const aWon =
                (h2h.homeTeam.name === a.teamName && h2h.homeScore > h2h.awayScore) ||
                (h2h.awayTeam.name === a.teamName && h2h.awayScore > h2h.homeScore);
            return aWon ? -1 : 1;
        }

        // Last resort: alphabetical
        return a.teamName.localeCompare(b.teamName);
    });
}

// ─── Recalculate standings for one sport entry ───────────────────────────────
async function recalcStandings(event, sportName) {
    const sportEntry = event.sports.find((s) => s.sportName === sportName);
    if (!sportEntry) return;

    const matches = await EventMatch.find({
        _id: { $in: sportEntry.groupMatchIds },
        status: "completed",
    });

    // Reset all rows to zero
    const rowMap = {};
    for (const team of sportEntry.teams) {
        rowMap[team.name] = {
            teamName: team.name,
            played: 0, won: 0, lost: 0, drawn: 0,
            goalsFor: 0, goalsAgainst: 0, points: 0,
        };
    }

    for (const m of matches) {
        const home = rowMap[m.homeTeam.name];
        const away = rowMap[m.awayTeam.name];
        if (!home || !away) continue;

        home.played++;  away.played++;
        home.goalsFor     += m.homeScore; home.goalsAgainst += m.awayScore;
        away.goalsFor     += m.awayScore; away.goalsAgainst += m.homeScore;

        if (m.homeScore > m.awayScore) {
            home.won++;  home.points += 3;
            away.lost++;
        } else if (m.awayScore > m.homeScore) {
            away.won++;  away.points += 3;
            home.lost++;
        } else {
            home.drawn++;  home.points += 1;
            away.drawn++;  away.points += 1;
        }
    }

    sportEntry.standings = sortStandings(Object.values(rowMap), matches);
    await event.save();
}

// ─── Generate a unique 8-char uppercase event key ───────────────────────────
async function generateEventKey() {
    let key, exists;
    do {
        key = crypto.randomBytes(4).toString("hex").toUpperCase(); // 8 chars
        exists = await SportEvent.findOne({ eventKey: key });
    } while (exists);
    return key;
}

// ════════════════════════════════════════════════════════════════════════════
// CONTROLLERS
// ════════════════════════════════════════════════════════════════════════════

// POST /events
export const createEvent = async (req, res) => {
    const user = await resolveUser(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { name, description, startDate, endDate, sports } = req.body;
    if (!name || !startDate || !endDate)
        return res.status(400).json({ message: "name, startDate, and endDate are required" });

    if (new Date(endDate) < new Date(startDate))
        return res.status(400).json({ message: "endDate must be after startDate" });

    try {
        const eventKey = await generateEventKey();

        // Parse sports from JSON string if sent as form data
        let parsedSports = [];
        if (sports) {
            parsedSports = typeof sports === "string" ? JSON.parse(sports) : sports;
        }

        const sportEntries = parsedSports.map((s) => ({
            sportName: s.sportName,
            advanceCount: s.advanceCount || 2,
            teams: [],
            standings: [],
            groupMatchIds: [],
            knockoutMatchIds: [],
        }));

        const event = new SportEvent({
            name,
            description: description || "",
            hostId: user._id,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            eventKey,
            followers: [user._id], // host also follows their own event
            sports: sportEntries,
            coverImage: req.file ? req.file.filename : "",
        });

        await event.save();
        return res.status(201).json({ message: "Event created", event, eventKey });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// GET /events  (public — no auth required)
export const getAllEvents = async (req, res) => {
    try {
        const events = await SportEvent.find()
            .populate("hostId", "name username profilePicture")
            .sort({ createdAt: -1 });
        return res.json({ events });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// GET /events/:eventId  (public — token optional, used only to flag isFollower/isHost)
export const getEventById = async (req, res) => {
    try {
        const event = await SportEvent.findById(req.params.eventId)
            .populate("hostId", "name username profilePicture")
            .populate("followers", "name username profilePicture");

        if (!event) return res.status(404).json({ message: "Event not found" });

        // Optionally resolve caller identity from header (never query string)
        const token = req.headers["x-auth-token"];
        let isHost = false, isFollower = false;
        if (token) {
            const caller = await User.findOne({ token });
            if (caller) {
                isHost = event.hostId._id.toString() === caller._id.toString();
                isFollower = event.followers.some(
                    (f) => f._id.toString() === caller._id.toString()
                );
            }
        }

        return res.json({ event, isHost, isFollower });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// POST /events/join  — follower enters eventKey to join
export const joinEventByKey = async (req, res) => {
    const user = await resolveUser(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { eventKey } = req.body;
    if (!eventKey) return res.status(400).json({ message: "eventKey is required" });

    try {
        const event = await SportEvent.findOne({ eventKey: eventKey.toUpperCase() });
        if (!event) return res.status(404).json({ message: "No event found with that key" });

        const alreadyFollowing = event.followers.some(
            (f) => f.toString() === user._id.toString()
        );
        if (alreadyFollowing)
            return res.status(400).json({ message: "You are already following this event" });

        event.followers.push(user._id);
        await event.save();

        return res.json({ message: "Joined event successfully", eventId: event._id });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// POST /events/:eventId/teams  — host-only
export const addTeamToSport = async (req, res) => {
    const user = await resolveUser(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { sportName, teamName, color, players } = req.body;
    if (!sportName || !teamName)
        return res.status(400).json({ message: "sportName and teamName are required" });

    try {
        const event = await SportEvent.findById(req.params.eventId);
        if (!event) return res.status(404).json({ message: "Event not found" });

        if (event.hostId.toString() !== user._id.toString())
            return res.status(403).json({ message: "Only the host can add teams" });

        const sport = event.sports.find((s) => s.sportName === sportName);
        if (!sport)
            return res.status(404).json({ message: `Sport '${sportName}' not found in this event` });

        const duplicate = sport.teams.find((t) => t.name === teamName);
        if (duplicate)
            return res.status(400).json({ message: "A team with that name already exists in this sport" });

        const parsedPlayers = players
            ? typeof players === "string"
                ? JSON.parse(players)
                : players
            : [];

        sport.teams.push({ name: teamName, color: color || "#667eea", players: parsedPlayers });

        // Add a standings row for the new team
        sport.standings.push({
            teamName, played: 0, won: 0, lost: 0, drawn: 0,
            goalsFor: 0, goalsAgainst: 0, points: 0,
        });

        await event.save();
        return res.status(201).json({ message: "Team added", sport });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// POST /events/:eventId/matches  — host-only, with 3 validations (plan point 4)
export const createMatch = async (req, res) => {
    const user = await resolveUser(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { sportName, homeTeamName, awayTeamName, round, matchDate, venue } = req.body;
    if (!sportName || !homeTeamName || !awayTeamName)
        return res.status(400).json({ message: "sportName, homeTeamName, and awayTeamName are required" });

    try {
        const event = await SportEvent.findById(req.params.eventId);
        if (!event) return res.status(404).json({ message: "Event not found" });

        if (event.hostId.toString() !== user._id.toString())
            return res.status(403).json({ message: "Only the host can create matches" });

        const sport = event.sports.find((s) => s.sportName === sportName);
        if (!sport)
            return res.status(404).json({ message: `Sport '${sportName}' not found in this event` });

        // Validation 1 — no self-play
        if (homeTeamName === awayTeamName)
            return res.status(400).json({ message: "A team cannot play against itself" });

        // Validation 2 — both teams must be registered
        const registeredNames = sport.teams.map((t) => t.name);
        if (!registeredNames.includes(homeTeamName))
            return res.status(400).json({ message: `'${homeTeamName}' is not registered in this sport` });
        if (!registeredNames.includes(awayTeamName))
            return res.status(400).json({ message: `'${awayTeamName}' is not registered in this sport` });

        // Validation 3 — matchDate within event range (if provided)
        if (matchDate) {
            const md = new Date(matchDate);
            if (md < new Date(event.startDate) || md > new Date(event.endDate))
                return res.status(400).json({ message: "Match date must fall within the event date range" });
        }

        const homeTeam = sport.teams.find((t) => t.name === homeTeamName);
        const awayTeam = sport.teams.find((t) => t.name === awayTeamName);

        const matchRound = round || "Group Stage";
        const isKnockout = matchRound !== "Group Stage";

        const match = new EventMatch({
            eventId: event._id,
            sport: sportName,
            homeTeam: { name: homeTeam.name, color: homeTeam.color },
            awayTeam: { name: awayTeam.name, color: awayTeam.color },
            round: matchRound,
            matchDate: matchDate ? new Date(matchDate) : undefined,
            venue: venue || "",
        });

        await match.save();

        if (isKnockout) {
            sport.knockoutMatchIds.push(match._id);
        } else {
            sport.groupMatchIds.push(match._id);
        }
        await event.save();

        return res.status(201).json({ message: "Match created", match });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// POST /events/:eventId/matches/:matchId/score  — host-only
export const updateMatchScore = async (req, res) => {
    const user = await resolveUser(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { homeScore, awayScore, status, period, scoreDetails } = req.body;

    try {
        const event = await SportEvent.findById(req.params.eventId);
        if (!event) return res.status(404).json({ message: "Event not found" });

        if (event.hostId.toString() !== user._id.toString())
            return res.status(403).json({ message: "Only the host can update scores" });

        const match = await EventMatch.findById(req.params.matchId);
        if (!match) return res.status(404).json({ message: "Match not found" });

        // Update canonical scores
        if (homeScore !== undefined) match.homeScore = Number(homeScore);
        if (awayScore !== undefined) match.awayScore = Number(awayScore);
        if (status)                  match.status    = status;
        if (period  !== undefined)   match.period    = period;

        // Merge sport-specific details (don't wipe existing data on partial updates)
        if (scoreDetails && typeof scoreDetails === "object") {
            match.scoreDetails = { ...(match.scoreDetails || {}), ...scoreDetails };
            // Mongoose Mixed fields need this to detect the change
            match.markModified("scoreDetails");
        }

        // Set winner when completed
        if (status === "completed") {
            if (match.homeScore > match.awayScore) {
                match.winner = match.homeTeam.name;
            } else if (match.awayScore > match.homeScore) {
                match.winner = match.awayTeam.name;
            } else {
                match.winner = "draw";
            }
            // Recalculate standings for group stage matches
            const sport = event.sports.find((s) => s.sportName === match.sport);
            if (sport && sport.groupMatchIds.some((id) => id.toString() === match._id.toString())) {
                await match.save();
                await recalcStandings(event, match.sport);
                const updatedEvent = await SportEvent.findById(event._id);
                const updatedSport = updatedEvent.sports.find((s) => s.sportName === match.sport);
                return res.json({ message: "Score updated, standings recalculated", match, standings: updatedSport?.standings });
            }
        }

        await match.save();
        return res.json({ message: "Score updated", match });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// GET /events/:eventId/matches  (public)
export const getMatches = async (req, res) => {
    try {
        const { sport } = req.query;
        const query = { eventId: req.params.eventId };
        if (sport) query.sport = sport;

        const matches = await EventMatch.find(query).sort({ matchDate: 1, createdAt: 1 });
        return res.json({ matches });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// POST /events/:eventId/photos  — host-only, multipart
export const uploadEventPhoto = async (req, res) => {
    const user = await resolveUser(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    try {
        const event = await SportEvent.findById(req.params.eventId);
        if (!event) return res.status(404).json({ message: "Event not found" });

        if (event.hostId.toString() !== user._id.toString())
            return res.status(403).json({ message: "Only the host can upload event photos" });

        if (!req.file)
            return res.status(400).json({ message: "No image file provided" });

        const photo = new EventPhoto({
            eventId: event._id,
            hostId: user._id,
            caption: req.body.caption || "",
            media: req.file.filename,
            fileType: req.file.mimetype.split("/")[1],
        });

        await photo.save();
        return res.status(201).json({ message: "Photo uploaded", photo });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// GET /events/:eventId/photos  (public)
export const getEventPhotos = async (req, res) => {
    try {
        const photos = await EventPhoto.find({ eventId: req.params.eventId })
            .populate("hostId", "name username profilePicture")
            .sort({ createdAt: -1 });
        return res.json({ photos });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// POST /events/:eventId/photos/:photoId/like  — any authenticated follower
export const likeEventPhoto = async (req, res) => {
    const user = await resolveUser(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    try {
        const photo = await EventPhoto.findById(req.params.photoId);
        if (!photo) return res.status(404).json({ message: "Photo not found" });

        const uid = user._id.toString();
        const idx = photo.likes.indexOf(uid);
        if (idx === -1) {
            photo.likes.push(uid);
        } else {
            photo.likes.splice(idx, 1);
        }
        await photo.save();
        return res.json({ message: "Like toggled", likes: photo.likes, likeCount: photo.likes.length });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};
