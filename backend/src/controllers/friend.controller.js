import FriendRequest from "../models/FriendRequest.js";
import User from "../models/User.js";
import { io, getReceiverSocketId } from "../lib/socket.js";

export const getStatus = async (req, res) => {
  try {
    const otherId = req.params.id;
    const me = req.user._id;

    // friends?
    const meUser = await User.findById(me);
    if (meUser.friends?.map(id => id.toString()).includes(otherId.toString())) {
      return res.status(200).json({ status: "friends" });
    }

    // pending incoming
    const incoming = await FriendRequest.findOne({ from: otherId, to: me, status: "pending" });
    if (incoming) return res.status(200).json({ status: "incoming", requestId: incoming._id });

    // pending outgoing
    const outgoing = await FriendRequest.findOne({ from: me, to: otherId, status: "pending" });
    if (outgoing) return res.status(200).json({ status: "outgoing", requestId: outgoing._id });

    return res.status(200).json({ status: "none" });
  } catch (e) {
    console.log("getStatus error", e);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const sendRequest = async (req, res) => {
  try {
    const to = req.params.id;
    const from = req.user._id;
    if (from.toString() === to.toString()) return res.status(400).json({ message: "Cannot friend yourself" });

    const me = await User.findById(from);
    if (me.friends?.map(id => id.toString()).includes(to.toString())) {
      return res.status(400).json({ message: "Already friends" });
    }

    let existing = await FriendRequest.findOne({ from, to, status: "pending" });
    if (existing) return res.status(200).json(existing);

    // also check reverse pending to auto-accept
    const reverse = await FriendRequest.findOne({ from: to, to: from, status: "pending" });
    if (reverse) {
      // accept both
      reverse.status = "accepted";
      await reverse.save();
      me.friends.push(to);
      await me.save();
      const other = await User.findById(to);
      other.friends.push(from);
      await other.save();

      const toSock = getReceiverSocketId(to);
      const fromSock = getReceiverSocketId(from);
      if (toSock) io.to(toSock).emit("friendRequestUpdated", { requestId: reverse._id, status: "accepted" });
      if (fromSock) io.to(fromSock).emit("friendRequestUpdated", { requestId: reverse._id, status: "accepted" });

      return res.status(200).json(reverse);
    }

    const fr = await FriendRequest.create({ from, to });

    const toSock = getReceiverSocketId(to);
    if (toSock) io.to(toSock).emit("friendRequestReceived", { requestId: fr._id, from });

    res.status(201).json(fr);
  } catch (e) {
    console.log("sendRequest error", e);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const acceptRequest = async (req, res) => {
  try {
    const { id } = req.params; // request id
    const me = req.user._id;

    const fr = await FriendRequest.findById(id);
    if (!fr || fr.to.toString() !== me.toString()) return res.status(404).json({ message: "Request not found" });

    fr.status = "accepted";
    await fr.save();

    const meUser = await User.findById(me);
    const otherUser = await User.findById(fr.from);
    if (!meUser.friends.includes(fr.from)) meUser.friends.push(fr.from);
    if (!otherUser.friends.includes(me)) otherUser.friends.push(me);
    await meUser.save();
    await otherUser.save();

    const toSock = getReceiverSocketId(fr.from);
    const meSock = getReceiverSocketId(me);
    if (toSock) io.to(toSock).emit("friendRequestUpdated", { requestId: fr._id, status: "accepted" });
    if (meSock) io.to(meSock).emit("friendRequestUpdated", { requestId: fr._id, status: "accepted" });

    res.status(200).json(fr);
  } catch (e) {
    console.log("acceptRequest error", e);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const rejectRequest = async (req, res) => {
  try {
    const { id } = req.params; // request id
    const me = req.user._id;

    const fr = await FriendRequest.findById(id);
    if (!fr || fr.to.toString() !== me.toString()) return res.status(404).json({ message: "Request not found" });

    fr.status = "rejected";
    await fr.save();

    const toSock = getReceiverSocketId(fr.from);
    const meSock = getReceiverSocketId(me);
    if (toSock) io.to(toSock).emit("friendRequestUpdated", { requestId: fr._id, status: "rejected" });
    if (meSock) io.to(meSock).emit("friendRequestUpdated", { requestId: fr._id, status: "rejected" });

    res.status(200).json(fr);
  } catch (e) {
    console.log("rejectRequest error", e);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const cancelOutgoingRequest = async (req, res) => {
  try {
    const { id } = req.params; // request id
    const me = req.user._id;

    const fr = await FriendRequest.findById(id);
    if (!fr || fr.from.toString() !== me.toString() || fr.status !== "pending") {
      return res.status(404).json({ message: "Pending request not found" });
    }

    await fr.deleteOne();

    const toSock = getReceiverSocketId(fr.to);
    const meSock = getReceiverSocketId(me);
    if (toSock) io.to(toSock).emit("friendRequestUpdated", { requestId: id, status: "cancelled" });
    if (meSock) io.to(meSock).emit("friendRequestUpdated", { requestId: id, status: "cancelled" });

    res.status(200).json({ message: "Cancelled" });
  } catch (e) {
    console.log("cancelOutgoingRequest error", e);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const listRequests = async (req, res) => {
  try {
    const me = req.user._id;

    const incomingPending = await FriendRequest.find({ to: me, status: "pending" })
      .populate("from", "fullName profilePic email username");
    const outgoingPending = await FriendRequest.find({ from: me, status: "pending" })
      .populate("to", "fullName profilePic email username");
    const rejected = await FriendRequest.find({ $or: [{ from: me }, { to: me }], status: "rejected" })
      .populate("from to", "fullName profilePic email username");

    const meUser = await User.findById(me).populate("friends", "fullName profilePic email username");

    res.status(200).json({
      incomingPending,
      outgoingPending,
      rejected,
      friends: meUser?.friends || [],
    });
  } catch (e) {
    console.log("listRequests error", e);
    res.status(500).json({ message: "Internal server error" });
  }
};
