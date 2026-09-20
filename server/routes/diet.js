import express from "express";
import DietEntry from "../models/DietEntry.js";
import auth from "../middleware/auth.js";

const router = express.Router();
router.use(auth);

router.get("/", async (req, res) => {
  const { from, to } = req.query;
  const query = { user: req.userId };
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) query.date.$lte = new Date(to);
  }
  const entries = await DietEntry.find(query).sort({ date: -1 });
  res.json(entries);
});

router.post("/", async (req, res) => {
  const entry = await DietEntry.create({ ...req.body, user: req.userId });
  res.status(201).json(entry);
});

router.put("/:id", async (req, res) => {
  const entry = await DietEntry.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    req.body,
    { new: true }
  );
  if (!entry) return res.status(404).json({ error: "Not found" });
  res.json(entry);
});

router.delete("/:id", async (req, res) => {
  const result = await DietEntry.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!result) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
});

// Totals for today (or given date) — used by the dashboard calorie ring
router.get("/summary/today", async (req, res) => {
  const dateStr = req.query.date;
  const day = dateStr ? new Date(dateStr) : new Date();
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(day);
  end.setHours(23, 59, 59, 999);

  const entries = await DietEntry.find({
    user: req.userId,
    date: { $gte: start, $lte: end },
  });

  const totals = entries.reduce(
    (acc, e) => {
      acc.calories += e.calories || 0;
      acc.protein += e.protein || 0;
      acc.carbs += e.carbs || 0;
      acc.fat += e.fat || 0;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  res.json({ entries, totals });
});

export default router;
