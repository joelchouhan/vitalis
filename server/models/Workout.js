import mongoose from "mongoose";

const exerciseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    sets: Number,
    reps: Number,
    weightKg: Number,
    durationMin: Number,
  },
  { _id: false }
);

const workoutSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["strength", "cardio", "yoga", "sports", "other"],
      default: "strength",
    },
    title: { type: String, required: true },
    date: { type: Date, default: Date.now, index: true },
    durationMin: { type: Number, default: 0 },
    caloriesBurned: { type: Number, default: 0 },
    exercises: [exerciseSchema],
    notes: String,
  },
  { timestamps: true }
);

export default mongoose.model("Workout", workoutSchema);
