import mongoose from "mongoose";

const weightLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: Date, default: Date.now, index: true },
    weightKg: { type: Number, required: true },
    note: String,
  },
  { timestamps: true }
);

// One entry per user per calendar day — logging again same day updates it
weightLogSchema.index({ user: 1, date: 1 });

export default mongoose.model("WeightLog", weightLogSchema);
