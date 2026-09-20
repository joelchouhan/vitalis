import express from "express";
import Goal from "../models/Goal.js";
import auth from "../middleware/auth.js";

const router = express.Router();
router.use(auth);

router.get("/", async (req, res) => {
  const goals = await Goal.find({ user: req.userId }).sort({ createdAt: -1 });
  res.json(goals);
});

router.post("/", async (req, res) => {
  const goal = await Goal.create({ ...req.body, user: req.userId });
  res.status(201).json(goal);
});

router.put("/:id", async (req, res) => {
  const goal = await Goal.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    req.body,
    { new: true }
  );
  if (!goal) return res.status(404).json({ error: "Not found" });
  res.json(goal);
});

// Mark progress for today -> bumps streak if consecutive day
router.post("/:id/checkin", async (req, res) => {
  const goal = await Goal.findOne({ _id: req.params.id, user: req.userId });
  if (!goal) return res.status(404).json({ error: "Not found" });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const last = goal.lastStreakDate ? new Date(goal.lastStreakDate) : null;
  if (last) last.setHours(0, 0, 0, 0);

  const oneDayMs = 24 * 60 * 60 * 1000;
  if (!last) {
    goal.streakCount = 1;
  } else if (today - last === oneDayMs) {
    goal.streakCount += 1;
  } else if (today - last > oneDayMs) {
    goal.streakCount = 1; // streak broken, restart
  } // same day check-in twice -> no change

  goal.lastStreakDate = today;
  goal.currentValue += 1;
  if (goal.currentValue >= goal.targetValue) goal.completed = true;

  await goal.save();
  res.json(goal);
});

router.delete("/:id", async (req, res) => {
  const result = await Goal.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!result) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
});

export default router;
