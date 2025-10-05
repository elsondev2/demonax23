import mongoose from "mongoose";

const groupInviteSchema = new mongoose.Schema(
  {
    token: { type: String, unique: true, index: true, required: true },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    expiresAt: { type: Date, default: null },
    maxUses: { type: Number, default: null },
    usesCount: { type: Number, default: 0 },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Helper to check validity on doc
groupInviteSchema.methods.isValid = function () {
  if (this.revokedAt) return false;
  if (this.expiresAt && this.expiresAt <= new Date()) return false;
  if (typeof this.maxUses === 'number' && this.maxUses >= 0 && this.usesCount >= this.maxUses) return false;
  return true;
};

const GroupInvite = mongoose.model("GroupInvite", groupInviteSchema);
export default GroupInvite;
