import mongoose from "mongoose";

const postItemSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    storageKey: { type: String, default: "" },
    contentType: { type: String, default: "application/octet-stream" },
    filename: { type: String, default: "" },
    size: { type: Number, default: 0 },
  },
  { _id: false }
);

const replySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, trim: true, required: true },
    likes: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
    level: { type: Number, default: 1, min: 1, max: 5 },
  },
  { timestamps: { createdAt: true, updatedAt: false }, _id: true }
);

// Self-referencing for nested replies - max 5 levels
replySchema.add({ replies: { type: [replySchema], default: [] } });

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, trim: true, required: true },
    likes: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
    replies: { type: [replySchema], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false }, _id: true }
);

const postSchema = new mongoose.Schema(
  {
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, trim: true, default: "" },
    caption: { type: String, trim: true, default: "" },
    items: { type: [postItemSchema], default: [] },
    visibility: { type: String, enum: ["public", "members"], default: "members" },
    expiresAt: { type: Date, required: true },
    likes: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
    comments: { type: [commentSchema], default: [] },
  },
  { timestamps: true }
);

postSchema.index({ expiresAt: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ postedBy: 1, createdAt: -1 });
postSchema.index({ visibility: 1, createdAt: -1 });

const Post = mongoose.model("Post", postSchema);
export default Post;