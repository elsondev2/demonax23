import Group from "../models/Group.js";
import User from "../models/User.js";
import Message from "../models/Message.js";
import { getReceiverSocketId } from "../lib/socket.js";
import { io } from "../lib/socket.js";
import crypto from "crypto";
import GroupInvite from "../models/GroupInvite.js";

export const createGroup = async (req, res) => {
  try {
    const { name, description, members, groupPic, admin: adminFromClient } = req.body;
    let admin = req.user._id;
    // Allow creator to set a different admin among selected members
    if (adminFromClient && Array.isArray(members) && members.map(m=>m.toString()).includes(adminFromClient.toString())) {
      admin = adminFromClient;
    }

    // Validate that all members exist
    const validMembers = await User.find({ _id: { $in: members } });
    if (validMembers.length !== members.length) {
      return res.status(400).json({ message: "Some members do not exist" });
    }

    // Ensure admin is part of the group
    if (!members.includes(admin.toString())) {
      members.push(admin);
    }

    let groupPicUrl = groupPic;
    if (typeof groupPic === "string" && groupPic.startsWith("data:image")) {
      try {
        const { uploadBase64ImageToSupabase } = await import("../lib/supabase.js");
        const uploaded = await uploadBase64ImageToSupabase({ base64: groupPic, folder: "groups" });
        groupPicUrl = uploaded.url;
      } catch (e) {
        console.log("createGroup groupPic upload failed:", e.message);
      }
    }

    const newGroup = new Group({
      name,
      description,
      members,
      admin,
      groupPic: groupPicUrl,
    });

    await newGroup.save();

    // Populate members and admin details
    await newGroup.populate("members admin", "fullName profilePic");

    res.status(201).json(newGroup);
  } catch (error) {
    console.log("Error in createGroup controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createInviteLink = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { expiresInMinutes = null, maxUses = null } = req.body || {};
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (group.admin.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only admin can create invite links" });
    }

    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = expiresInMinutes ? new Date(Date.now() + Number(expiresInMinutes) * 60 * 1000) : null;

    const invite = await GroupInvite.create({
      token,
      groupId: group._id,
      createdBy: userId,
      expiresAt,
      maxUses: maxUses != null ? Number(maxUses) : null,
    });

    res.status(201).json({
      token: invite.token,
      expiresAt: invite.expiresAt,
      maxUses: invite.maxUses,
      usesCount: invite.usesCount,
      group: { _id: group._id, name: group.name, groupPic: group.groupPic, membersCount: group.members.length },
    });
  } catch (e) {
    console.log("Error in createInviteLink:", e.message);
    res.status(500).json({ message: "Failed to create invite link" });
  }
};

export const getInviteMeta = async (req, res) => {
  try {
    const { token } = req.params;
    const invite = await GroupInvite.findOne({ token }).populate("groupId", "name groupPic members admin");
    if (!invite) return res.status(404).json({ message: "Invalid invite" });

    const valid = invite.isValid();
    const group = invite.groupId;

    res.status(200).json({
      token: invite.token,
      valid,
      reason: !invite.isValid() ? (invite.revokedAt ? 'revoked' : (invite.expiresAt && invite.expiresAt <= new Date()) ? 'expired' : (invite.maxUses != null && invite.usesCount >= invite.maxUses) ? 'max-uses-reached' : 'invalid') : null,
      expiresAt: invite.expiresAt,
      maxUses: invite.maxUses,
      usesCount: invite.usesCount,
      group: { _id: group._id, name: group.name, groupPic: group.groupPic, membersCount: group.members.length }
    });
  } catch (e) {
    console.log("Error in getInviteMeta:", e.message);
    res.status(500).json({ message: "Failed to read invite" });
  }
};

export const joinByInvite = async (req, res) => {
  try {
    const { token } = req.params;
    const userId = req.user._id.toString();
    const invite = await GroupInvite.findOne({ token });
    if (!invite) return res.status(404).json({ message: "Invalid invite" });
    if (!invite.isValid()) return res.status(400).json({ message: "Invite not valid" });

    const group = await Group.findById(invite.groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // If already a member, just return group
    const alreadyMember = group.members.some(m => m.toString() === userId);
    if (!alreadyMember) {
      group.members.push(userId);
      await group.save();
      await group.populate("members admin", "fullName profilePic");
      // Increment uses
      invite.usesCount = (invite.usesCount || 0) + 1;
      await invite.save();

      // Notify all group members about the update
      group.members.forEach(member => {
        const sid = getReceiverSocketId(member.toString());
        if (sid) io.to(sid).emit("groupUpdated", group);
      });
    }

    res.status(200).json(group);
  } catch (e) {
    console.log("Error in joinByInvite:", e.message);
    res.status(500).json({ message: "Failed to join group" });
  }
};

export const revokeInvite = async (req, res) => {
  try {
    const { token } = req.params;
    const userId = req.user._id.toString();
    const invite = await GroupInvite.findOne({ token }).populate("groupId", "admin");
    if (!invite) return res.status(404).json({ message: "Invite not found" });

    const group = invite.groupId;
    if (group.admin.toString() !== userId) {
      return res.status(403).json({ message: "Only admin can revoke invite" });
    }

    invite.revokedAt = new Date();
    await invite.save();
    res.status(200).json({ message: "Invite revoked" });
  } catch (e) {
    console.log("Error in revokeInvite:", e.message);
    res.status(500).json({ message: "Failed to revoke invite" });
  }
};

export const getGroups = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all groups where the user is a member
    let groups = await Group.find({ members: userId })
      .populate("members admin", "fullName profilePic")
      .sort({ updatedAt: -1 });

    // For each group, get the last message and unread count
    groups = await Promise.all(groups.map(async (group) => {
      const lastMessage = await Message.findOne({ groupId: group._id })
        .sort({ createdAt: -1 })
        .populate("senderId", "fullName profilePic"); // Populate sender info
      const unreadCount = await Message.countDocuments({ groupId: group._id, readBy: { $nin: [userId] } });
      
      return {
        ...group.toObject(),
        lastMessage: lastMessage?.text || null,
        lastMessageTime: lastMessage?.createdAt || null,
        lastMessageSenderId: lastMessage?.senderId || null,
        unreadCount,
      };
    }));

    res.status(200).json(groups);
  } catch (error) {
    console.log("Error in getGroups controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getGroupById = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findOne({ _id: groupId, members: userId })
      .populate("members admin", "fullName profilePic");

    if (!group) {
      return res.status(404).json({ message: "Group not found or you're not a member" });
    }

    res.status(200).json(group);
  } catch (error) {
    console.log("Error in getGroupById controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateGroup = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { name, description, members, groupPic } = req.body;
    const userId = req.user._id;

    const group = await Group.findOne({ _id: groupId, admin: userId });

    if (!group) {
      return res.status(404).json({ message: "Group not found or you're not the admin" });
    }

    // Validate that all members exist
    if (members) {
      const validMembers = await User.find({ _id: { $in: members } });
      if (validMembers.length !== members.length) {
        return res.status(400).json({ message: "Some members do not exist" });
      }
      
      // Ensure admin is part of the group
      if (!members.includes(userId.toString())) {
        members.push(userId.toString());
      }
      
      group.members = members;
    }

    if (name) group.name = name;
    if (description) group.description = description;
    if (groupPic) {
      if (typeof groupPic === "string" && groupPic.startsWith("data:image")) {
        try {
          const { uploadBase64ImageToSupabase } = await import("../lib/supabase.js");
          const uploaded = await uploadBase64ImageToSupabase({ base64: groupPic, folder: "groups" });
          group.groupPic = uploaded.url;
        } catch (e) {
          console.log("updateGroup groupPic upload failed:", e.message);
        }
      } else {
        group.groupPic = groupPic;
      }
    }

    await group.save();
    await group.populate("members admin", "fullName profilePic");

    // Notify all group members about the update
    group.members.forEach(member => {
      const memberSocketId = getReceiverSocketId(member._id.toString());
      if (memberSocketId) {
        // Get updated group info for this member
        Group.findById(groupId)
          .populate("members admin", "fullName profilePic")
          .then(updatedGroup => {
            if (updatedGroup) {
              io.to(memberSocketId).emit("groupUpdated", updatedGroup);
            }
          })
          .catch(err => {
            console.log("Error fetching updated group:", err);
          });
      }
    });

    res.status(200).json(group);
  } catch (error) {
    console.log("Error in updateGroup controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findOne({ _id: groupId, admin: userId });

    if (!group) {
      return res.status(404).json({ message: "Group not found or you're not the admin" });
    }

    // Store members before deleting the group
    const members = [...group.members];

    // Delete all messages in the group
    await Message.deleteMany({ groupId: groupId });

    // Delete the group
    await Group.findByIdAndDelete(groupId);

    // Notify all group members about the deletion
    members.forEach(member => {
      const memberSocketId = getReceiverSocketId(member.toString());
      if (memberSocketId) {
        io.to(memberSocketId).emit("groupDeleted", groupId);
      }
    });

    res.status(200).json({ message: "Group deleted successfully" });
  } catch (error) {
    console.log("Error in deleteGroup controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Admin cannot leave the group, they must delete it
    if (group.admin.toString() === userId.toString()) {
      return res.status(400).json({ message: "Admin cannot leave the group. Please delete the group instead." });
    }

    // Remove user from members
    group.members = group.members.filter(
      member => member.toString() !== userId.toString()
    );

    await group.save();

    // Notify all group members about the user leaving
    group.members.forEach(member => {
      const memberSocketId = getReceiverSocketId(member.toString());
      if (memberSocketId) {
        io.to(memberSocketId).emit("userLeftGroup", { groupId, userId: userId.toString() });
      }
    });

    // Also notify the user who left
    const leavingUserSocketId = getReceiverSocketId(userId.toString());
    if (leavingUserSocketId) {
      io.to(leavingUserSocketId).emit("userLeftGroup", { groupId, userId: userId.toString() });
    }

    res.status(200).json({ message: "Left group successfully" });
  } catch (error) {
    console.log("Error in leaveGroup controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
