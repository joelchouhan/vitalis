import express from "express";
import WeightLog from "../models/WeightLog.js";
import User from "../models/User.js";
import auth from "../middleware/auth.js";
import { calculateTDEE, targetCaloriesForGoal } from "../utils/calorie.js";

const router = express.Router();
router.use(auth);

// History, most recent last (good for charts), default last 90 days
router.get("/", async (req, res) => {
  const days = parseInt(req.query.days) || 90;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const logs = await WeightLog.find({ user: req.userId, date: { $gte: since } }).sort({ date: 1 });
  res.json(logs);
});

// Log today's weight — if an entry already exists for today, update it instead of duplicating
router.post("/", async (req, res) => {
  const { weightKg, note, date } = req.body;
  if (!weightKg || weightKg <= 0 || weightKg > 500) {
    return res.status(400).json({ error: "weightKg must be a realistic positive number" });
  }

  const day = date ? new Date(date) : new Date();
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(day);
  end.setHours(23, 59, 59, 999);

  let entry = await WeightLog.findOne({ user: req.userId, date: { $gte: start, $lte: end } });
  if (entry) {
    entry.weightKg = weightKg;
    entry.note = note;
    await entry.save();
  } else {
    entry = await WeightLog.create({ user: req.userId, weightKg, note, date: day });
  }

  // Keep the user's current weight + calorie target in sync with the latest log
  const user = await User.findById(req.userId);
  user.weightKg = weightKg;
  const tdee = calculateTDEE(user);
  user.dailyCalorieTarget = targetCaloriesForGoal(tdee, user.goalType);
  await user.save();

  res.status(201).json(entry);
});

router.delete("/:id", async (req, res) => {
  const result = await WeightLog.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!result) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
});

export default router;
