import Team from "../models/teams.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

export const getAllTeams = async (req, res) => {
    try {
        const teams = await Team.find()
            .populate('creatorId', 'name username email profilePicture')
            .populate('members', 'name username email profilePicture');
        return res.json({ teams });
    } catch (error) {
        console.error("Get all teams error:", error);
        return res.status(500).json({ message: error.message });
    }
};

export const createTeam = async (req, res) => {
    const { token, name, sport, description, maxSize } = req.body;

    try {
        if (!name || !sport || !description) {
            return res.status(400).json({ message: "Name, sport, and description are required" });
        }

        const user = await User.findOne({ token });
        if (!user) return res.status(404).json({ message: "User not found" });

        const existingTeam = await Team.findOne({ name });
        if (existingTeam) return res.status(400).json({ message: "A team with this name already exists" });

        const team = new Team({
            name,
            sport,
            description,
            maxSize: maxSize || 11,
            creatorId: user._id,
            members: [user._id] // Creator is the first member
        });

        await team.save();

        const populatedTeam = await Team.findById(team._id)
            .populate('creatorId', 'name username email profilePicture')
            .populate('members', 'name username email profilePicture');

        return res.status(201).json({ message: "Team created successfully", team: populatedTeam });
    } catch (error) {
        console.error("Create team error:", error);
        return res.status(500).json({ message: error.message });
    }
};

// ── CHANGED: joinTeam now sends a request notification to the team owner ──
export const joinTeam = async (req, res) => {
    const { token, teamId } = req.body;

    try {
        const user = await User.findOne({ token });
        if (!user) return res.status(404).json({ message: "User not found" });

        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ message: "Team not found" });

        if (team.members.some(m => m.toString() === user._id.toString())) {
            return res.status(400).json({ message: "You are already a member of this team" });
        }

        if (team.members.length >= team.maxSize) {
            return res.status(400).json({ message: "This team is already at full capacity" });
        }

        // Check if a pending join request already exists
        const existingRequest = await Notification.findOne({
            userId: team.creatorId,
            senderId: user._id,
            type: "team_join_request",
            relatedId: team._id,
            isRead: false
        });

        if (existingRequest) {
            return res.status(400).json({ message: "Your join request is already pending approval" });
        }

        // Send notification to team owner instead of directly adding
        const joinNotification = new Notification({
            userId: team.creatorId,     // goes to the team owner
            senderId: user._id,         // the user who wants to join
            type: "team_join_request",
            relatedId: team._id,
            message: `${user.name} wants to join your team "${team.name}".`
        });

        await joinNotification.save();

        return res.json({ message: "Join request sent to team owner. Waiting for approval." });
    } catch (error) {
        console.error("Join team error:", error);
        return res.status(500).json({ message: error.message });
    }
};

// ── NEW: Owner accepts a join request ──
export const acceptJoinRequest = async (req, res) => {
    const { token, teamId, notificationId, requesterId } = req.body;

    try {
        const owner = await User.findOne({ token });
        if (!owner) return res.status(404).json({ message: "User not found" });

        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ message: "Team not found" });

        if (team.creatorId.toString() !== owner._id.toString()) {
            return res.status(403).json({ message: "Only the team owner can accept join requests" });
        }

        const requester = await User.findById(requesterId);
        if (!requester) return res.status(404).json({ message: "Requester user not found" });

        if (team.members.some(m => m.toString() === requester._id.toString())) {
            await Notification.updateOne({ _id: notificationId }, { $set: { isRead: true } });
            return res.status(400).json({ message: "User is already a member of this team" });
        }

        if (team.members.length >= team.maxSize) {
            return res.status(400).json({ message: "Team is at full capacity" });
        }

        team.members.push(requester._id);
        await team.save();

        // Mark the join request notification as read
        await Notification.updateOne({ _id: notificationId }, { $set: { isRead: true } });

        // Notify the requester that they have been accepted
        const acceptNotification = new Notification({
            userId: requester._id,
            senderId: owner._id,
            type: "team_invite",
            relatedId: team._id,
            message: `Your request to join "${team.name}" has been accepted! You are now a member.`
        });
        await acceptNotification.save();

        return res.json({ message: `${requester.name} has been added to the team` });
    } catch (error) {
        console.error("Accept join request error:", error);
        return res.status(500).json({ message: error.message });
    }
};

// ── NEW: Owner rejects a join request ──
export const rejectJoinRequest = async (req, res) => {
    const { token, teamId, notificationId, requesterId } = req.body;

    try {
        const owner = await User.findOne({ token });
        if (!owner) return res.status(404).json({ message: "User not found" });

        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ message: "Team not found" });

        if (team.creatorId.toString() !== owner._id.toString()) {
            return res.status(403).json({ message: "Only the team owner can reject join requests" });
        }

        // Mark the join request notification as read (dismissed)
        await Notification.updateOne({ _id: notificationId }, { $set: { isRead: true } });

        // Optionally notify the requester
        const requester = await User.findById(requesterId);
        if (requester) {
            const rejectNotification = new Notification({
                userId: requester._id,
                senderId: owner._id,
                type: "comment", // reuse generic type for info
                relatedId: team._id,
                message: `Your request to join "${team.name}" has been declined.`
            });
            await rejectNotification.save();
        }

        return res.json({ message: "Join request has been declined" });
    } catch (error) {
        console.error("Reject join request error:", error);
        return res.status(500).json({ message: error.message });
    }
};

export const leaveTeam = async (req, res) => {
    const { token, teamId } = req.body;

    try {
        const user = await User.findOne({ token });
        if (!user) return res.status(404).json({ message: "User not found" });

        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ message: "Team not found" });

        const index = team.members.findIndex(m => m.toString() === user._id.toString());
        if (index === -1) {
            return res.status(400).json({ message: "You are not a member of this team" });
        }

        // If the creator is leaving and they are the only member, delete the team.
        // Otherwise, if they are the creator but there are other members, assign a new creator.
        team.members.splice(index, 1);

        if (team.members.length === 0) {
            await Team.deleteOne({ _id: teamId });
            return res.json({ message: "Left team and deleted empty team successfully", deleted: true, teamId });
        }

        if (team.creatorId.toString() === user._id.toString()) {
            team.creatorId = team.members[0]; // Assign to the next member
        }

        await team.save();

        const populatedTeam = await Team.findById(team._id)
            .populate('creatorId', 'name username email profilePicture')
            .populate('members', 'name username email profilePicture');

        return res.json({ message: "Left team successfully", team: populatedTeam });
    } catch (error) {
        console.error("Leave team error:", error);
        return res.status(500).json({ message: error.message });
    }
};

export const inviteToTeam = async (req, res) => {
    const { token, teamId, targetUserId } = req.body;

    try {
        if (!teamId || !targetUserId) {
            return res.status(400).json({ message: "Team ID and target User ID are required" });
        }

        const user = await User.findOne({ token });
        if (!user) return res.status(404).json({ message: "User not found" });

        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ message: "Team not found" });

        if (team.creatorId.toString() !== user._id.toString()) {
            return res.status(403).json({ message: "Only the team owner can invite members" });
        }

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) return res.status(404).json({ message: "Target user not found" });

        if (team.members.some(m => m.toString() === targetUser._id.toString())) {
            return res.status(400).json({ message: "User is already a member of this team" });
        }

        if (team.members.length >= team.maxSize) {
            return res.status(400).json({ message: "Team is at full capacity" });
        }

        // Check if there is already a pending invite notification
        const existingInvite = await Notification.findOne({
            userId: targetUser._id,
            senderId: user._id,
            type: "team_invite",
            relatedId: team._id,
            isRead: false
        });

        if (existingInvite) {
            return res.status(400).json({ message: "Invitation request already sent and pending" });
        }

        const inviteNotification = new Notification({
            userId: targetUser._id,
            senderId: user._id,
            type: "team_invite",
            relatedId: team._id,
            message: `${user.name} invited you to join team "${team.name}".`
        });

        await inviteNotification.save();

        return res.json({ message: "Team invitation sent successfully" });
    } catch (error) {
        console.error("Invite to team error:", error);
        return res.status(500).json({ message: error.message });
    }
};

export const acceptTeamInvite = async (req, res) => {
    const { token, teamId, notificationId } = req.body;

    try {
        if (!teamId || !notificationId) {
            return res.status(400).json({ message: "Team ID and notification ID are required" });
        }

        const user = await User.findOne({ token });
        if (!user) return res.status(404).json({ message: "User not found" });

        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ message: "Team not found" });

        if (team.members.some(m => m.toString() === user._id.toString())) {
            // Already a member, just mark notification as read
            await Notification.updateOne(
                { _id: notificationId, userId: user._id },
                { $set: { isRead: true } }
            );
            return res.status(400).json({ message: "You are already a member of this team" });
        }

        if (team.members.length >= team.maxSize) {
            return res.status(400).json({ message: "This team is already at full capacity" });
        }

        team.members.push(user._id);
        await team.save();

        // Mark notification as read
        await Notification.updateOne(
            { _id: notificationId, userId: user._id },
            { $set: { isRead: true } }
        );

        return res.json({ message: "Joined team successfully via invitation" });
    } catch (error) {
        console.error("Accept team invite error:", error);
        return res.status(500).json({ message: error.message });
    }
};

// ── NEW: Get all teams a specific user is a member of ──
export const getTeamsByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) return res.status(400).json({ message: "User ID is required" });

        const teams = await Team.find({ members: userId })
            .populate('creatorId', 'name username email profilePicture')
            .populate('members', 'name username email profilePicture');

        return res.json({ teams });
    } catch (error) {
        console.error("Get teams by user error:", error);
        return res.status(500).json({ message: error.message });
    }
};
