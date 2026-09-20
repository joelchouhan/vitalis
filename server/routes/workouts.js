import express from "express";
import Workout from "../models/Workout.js";
import auth from "../middleware/auth.js";

const router = express.Router();
router.use(auth);

// List (optionally filter by date range)
router.get("/", async (req, res) => {
  const { from, to } = req.query;
  const query = { user: req.userId };
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) query.date.$lte = new Date(to);
  }
  const workouts = await Workout.find(query).sort({ date: -1 });
  res.json(workouts);
});

router.post("/", async (req, res) => {
  const workout = await Workout.create({ ...req.body, user: req.userId });
  res.status(201).json(workout);
});

router.put("/:id", async (req, res) => {
  const workout = await Workout.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    req.body,
    { new: true }
  );
  if (!workout) return res.status(404).json({ error: "Not found" });
  res.json(workout);
});

router.delete("/:id", async (req, res) => {
  const result = await Workout.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!result) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
});

// Stats for charts: calories burned & duration per day, last N days
router.get("/stats/summary", async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const workouts = await Workout.find({ user: req.userId, date: { $gte: since } }).sort({
    date: 1,
  });

  res.json(workouts);
});

export default router;
