import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import workoutRoutes from "./routes/workouts.js";
import goalRoutes from "./routes/goals.js";
import dietRoutes from "./routes/diet.js";
import socialRoutes from "./routes/social.js";
import aiRoutes from "./routes/ai.js";
import weightRoutes from "./routes/weight.js";

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/diet", dietRoutes);
app.use("/api/social", socialRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/weight", weightRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });
