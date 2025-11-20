import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listChannels = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const allChannels = await ctx.db.query("channels").collect();
    const channels = allChannels.filter((channel) =>
      channel.participants.includes(userId)
    );

    return Promise.all(
      channels.map(async (channel) => {
        const lastMessage = await ctx.db
          .query("messages")
          .withIndex("by_channel", (q) => q.eq("channelId", channel._id))
          .order("desc")
          .first();

        const otherParticipantId = channel.participants.find((id) => id !== userId);
        const otherUser = otherParticipantId ? await ctx.db.get(otherParticipantId) : null;

        return {
          ...channel,
          lastMessage,
          otherUser,
        };
      })
    );
  },
});

export const listMessages = query({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .order("asc")
      .collect();

    return Promise.all(
      messages.map(async (message) => {
        const author = await ctx.db.get(message.authorId);
        return {
          ...message,
          author,
        };
      })
    );
  },
});

export const sendMessage = mutation({
  args: {
    channelId: v.id("channels"),
    content: v.string(),
    type: v.union(v.literal("text"), v.literal("voice")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.insert("messages", {
      channelId: args.channelId,
      authorId: userId,
      content: args.content,
      type: args.type,
      isRead: false,
    });

    // Clear typing/recording status
    const existingStatus = await ctx.db
      .query("userStatus")
      .withIndex("by_user_and_channel", (q) =>
        q.eq("userId", userId).eq("channelId", args.channelId)
      )
      .first();

    if (existingStatus) {
      await ctx.db.patch(existingStatus._id, {
        status: "idle",
        lastUpdated: Date.now(),
      });
    }
  },
});

export const createChannel = mutation({
  args: {
    otherUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if channel already exists
    const allChannels = await ctx.db.query("channels").collect();
    const existingChannel = allChannels.find(
      (channel) =>
        channel.participants.length === 2 &&
        channel.participants.includes(userId) &&
        channel.participants.includes(args.otherUserId)
    );

    if (existingChannel) {
      return existingChannel._id;
    }

    // Create new channel
    return await ctx.db.insert("channels", {
      name: "Direct Message",
      isGroup: false,
      participants: [userId, args.otherUserId],
    });
  },
});

export const updateStatus = mutation({
  args: {
    channelId: v.id("channels"),
    status: v.union(v.literal("typing"), v.literal("recording"), v.literal("idle")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existingStatus = await ctx.db
      .query("userStatus")
      .withIndex("by_user_and_channel", (q) =>
        q.eq("userId", userId).eq("channelId", args.channelId)
      )
      .first();

    if (existingStatus) {
      await ctx.db.patch(existingStatus._id, {
        status: args.status,
        lastUpdated: Date.now(),
      });
    } else {
      await ctx.db.insert("userStatus", {
        userId,
        channelId: args.channelId,
        status: args.status,
        lastUpdated: Date.now(),
      });
    }
  },
});

export const getChannelStatus = query({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const statuses = await ctx.db
      .query("userStatus")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .collect();

    // Filter out current user and stale statuses (older than 5 seconds)
    const now = Date.now();
    const activeStatuses = statuses.filter(
      (status) =>
        status.userId !== userId &&
        status.status !== "idle" &&
        now - status.lastUpdated < 5000
    );

    return Promise.all(
      activeStatuses.map(async (status) => {
        const user = await ctx.db.get(status.userId);
        return {
          ...status,
          user,
        };
      })
    );
  },
});

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const users = await ctx.db.query("users").collect();
    return users.filter((user) => user._id !== userId);
  },
});
