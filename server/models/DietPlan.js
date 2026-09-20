import mongoose from "mongoose";

const dietPlanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    goalType: String,
    dailyCalorieTarget: Number,
    macros: {
      proteinG: Number,
      carbsG: Number,
      fatG: Number,
    },
    plan: [
      {
        meal: String, // "Breakfast", "Lunch", etc.
        suggestion: String,
        estimatedCalories: Number,
      },
    ],
    notes: String,
    rawModelResponse: String,
  },
  { timestamps: true }
);

export default mongoose.model("DietPlan", dietPlanSchema);
