import mongoose from "mongoose";

const dietEntrySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: Date, default: Date.now, index: true },
    mealType: {
      type: String,
      enum: ["breakfast", "lunch", "dinner", "snack"],
      default: "snack",
    },
    description: { type: String, required: true }, // e.g. "2 rotis, dal, salad"
    calories: { type: Number, default: null }, // filled by AI or user
    protein: Number,
    carbs: Number,
    fat: Number,
    source: { type: String, enum: ["manual", "ai_estimated"], default: "manual" },
  },
  { timestamps: true }
);

export default mongoose.model("DietEntry", dietEntrySchema);
