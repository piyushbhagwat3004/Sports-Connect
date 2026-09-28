import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import {
    createEvent,
    getAllEvents,
    getEventById,
    joinEventByKey,
    addTeamToSport,
    createMatch,
    updateMatchScore,
    getMatches,
    uploadEventPhoto,
    getEventPhotos,
    likeEventPhoto,
} from "../controllers/sportEvent.controller.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Reuse the same Multer disk storage as posts & user routes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../uploads"));
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `event-${unique}${ext}`);
    },
});
const upload = multer({ storage });

// ── Public event listing ──────────────────────────────────────────────────────
router.route("/events").get(getAllEvents);

// ── Host creates an event (optional cover image) ─────────────────────────────
router.route("/events").post(upload.single("coverImage"), createEvent);

// ── Follower joins via event key ──────────────────────────────────────────────
router.route("/events/join").post(joinEventByKey);

// ── Event detail (public; token in x-auth-token header for isHost/isFollower) ─
router.route("/events/:eventId").get(getEventById);

// ── Teams management (host-only) ──────────────────────────────────────────────
router.route("/events/:eventId/teams").post(addTeamToSport);

// ── Match management ──────────────────────────────────────────────────────────
router.route("/events/:eventId/matches").get(getMatches);
router.route("/events/:eventId/matches").post(createMatch);
router.route("/events/:eventId/matches/:matchId/score").post(updateMatchScore);

// ── Event photo feed ──────────────────────────────────────────────────────────
router.route("/events/:eventId/photos").get(getEventPhotos);
router.route("/events/:eventId/photos").post(upload.single("media"), uploadEventPhoto);
router.route("/events/:eventId/photos/:photoId/like").post(likeEventPhoto);

export default router;
