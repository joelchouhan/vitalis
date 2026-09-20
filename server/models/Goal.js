import mongoose from "mongoose";

const goalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    metric: {
      type: String,
      enum: ["weight_kg", "workouts_per_week", "calories_per_day", "streak_days", "custom"],
      default: "custom",
    },
    targetValue: { type: Number, required: true },
    currentValue: { type: Number, default: 0 },
    deadline: Date,
    completed: { type: Boolean, default: false },
    streakCount: { type: Number, default: 0 },
    lastStreakDate: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Goal", goalSchema);
