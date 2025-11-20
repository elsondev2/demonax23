import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const applicationTables = {
  channels: defineTable({
    name: v.string(),
    isGroup: v.boolean(),
    participants: v.array(v.id("users")),
  }),

  messages: defineTable({
    channelId: v.id("channels"),
    authorId: v.id("users"),
    content: v.string(),
    type: v.union(v.literal("text"), v.literal("voice")),
    isRead: v.boolean(),
  }).index("by_channel", ["channelId"]),

  userStatus: defineTable({
    userId: v.id("users"),
    channelId: v.id("channels"),
    status: v.union(v.literal("typing"), v.literal("recording"), v.literal("idle")),
    lastUpdated: v.number(),
  })
    .index("by_channel", ["channelId"])
    .index("by_user_and_channel", ["userId", "channelId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
