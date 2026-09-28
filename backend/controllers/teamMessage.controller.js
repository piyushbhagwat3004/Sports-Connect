import TeamMessage from "../models/teamMessage.model.js";
import Team from "../models/teams.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

export const getTeamMessages = async (req, res) => {
    const { teamId } = req.params;
    const token = req.headers["x-auth-token"] || req.query.token || req.body?.token;

    try {
        const user = await User.findOne({ token });
        if (!user) return res.status(404).json({ message: "User not found" });

        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ message: "Team not found" });

        // Check if the user is a member
        const isMember = team.members.some(m => m.toString() === user._id.toString());
        if (!isMember) {
            return res.status(403).json({ message: "You must be a member of the team to view messages" });
        }

        const messages = await TeamMessage.find({ teamId })
            .populate('senderId', 'name username profilePicture')
            .sort({ createdAt: 1 })
            .limit(100);

        return res.json({ messages });
    } catch (error) {
        console.error("Get team messages error:", error);
        return res.status(500).json({ message: error.message });
    }
};

export const sendTeamMessage = async (req, res) => {
    const { teamId } = req.params;
    const token = req.headers["x-auth-token"] || req.body?.token || req.query.token;
    const { message } = req.body;

    try {
        if (!message || !message.trim()) {
            return res.status(400).json({ message: "Message content is required" });
        }

        const user = await User.findOne({ token });
        if (!user) return res.status(404).json({ message: "User not found" });

        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ message: "Team not found" });

        // Check if the user is a member
        const isMember = team.members.some(m => m.toString() === user._id.toString());
        if (!isMember) {
            return res.status(403).json({ message: "You must be a member of the team to send messages" });
        }

        const teamMsg = new TeamMessage({
            teamId,
            senderId: user._id,
            message: message.trim()
        });

        await teamMsg.save();

        // Notify other team members about the new message
        try {
            const otherMembers = team.members.filter(m => m.toString() !== user._id.toString());
            if (otherMembers.length > 0) {
                const notifications = otherMembers.map(memberId => new Notification({
                    userId: memberId,
                    senderId: user._id,
                    type: "team_message",
                    relatedId: team._id,
                    message: `New message in "${team.name}" squad chat from ${user.name}.`
                }));
                await Notification.insertMany(notifications);
                console.log(`Dispatched team chat notifications to ${otherMembers.length} teammates.`);
            }
        } catch (notiErr) {
            console.error("Failed to dispatch team message notifications:", notiErr);
        }

        const populatedMsg = await TeamMessage.findById(teamMsg._id)
            .populate('senderId', 'name username profilePicture');

        return res.status(201).json({ message: "Message sent successfully", messageData: populatedMsg });
    } catch (error) {
        console.error("Send team message error:", error);
        return res.status(500).json({ message: error.message });
    }
};
