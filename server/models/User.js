import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    age: Number,
    heightCm: Number,
    weightKg: Number,
    sex: { type: String, enum: ["male", "female", "other"] },
    activityLevel: {
      type: String,
      enum: ["sedentary", "light", "moderate", "active", "very_active"],
      default: "moderate",
    },
    goalType: {
      type: String,
      enum: ["lose_weight", "maintain", "gain_muscle"],
      default: "maintain",
    },
    dailyCalorieTarget: { type: Number, default: null },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    avatarColor: { type: String, default: "#4f46e5" },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
