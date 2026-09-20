import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import auth from "../middleware/auth.js";
import { calculateTDEE, targetCaloriesForGoal } from "../utils/calorie.js";

const router = express.Router();

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "30d" });
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email, password are required" });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email: email.toLowerCase(), password: hashed });

    const token = signToken(user._id);
    res.status(201).json({ token, user: sanitize(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken(user._id);
    res.json({ token, user: sanitize(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(sanitize(user));
});

// Update profile (used to compute personalized calorie target)
router.put("/me", auth, async (req, res) => {
  const allowed = ["name", "age", "heightCm", "weightKg", "sex", "activityLevel", "goalType"];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const user = await User.findByIdAndUpdate(req.userId, updates, { new: true });

  const tdee = calculateTDEE(user);
  const target = targetCaloriesForGoal(tdee, user.goalType);
  user.dailyCalorieTarget = target;
  await user.save();

  res.json(sanitize(user));
});

function sanitize(user) {
  const obj = user.toObject();
  delete obj.password;
  return obj;
}

export default router;
