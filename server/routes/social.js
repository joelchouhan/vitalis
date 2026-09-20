import express from "express";
import Post from "../models/Post.js";
import User from "../models/User.js";
import auth from "../middleware/auth.js";

const router = express.Router();
router.use(auth);

// Feed: posts from self + friends, newest first
router.get("/feed", async (req, res) => {
  const me = await User.findById(req.userId);
  const authorIds = [req.userId, ...me.friends];
  const posts = await Post.find({ user: { $in: authorIds } })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("user", "name avatarColor")
    .populate("comments.user", "name avatarColor");
  res.json(posts);
});

router.post("/posts", async (req, res) => {
  const post = await Post.create({ ...req.body, user: req.userId });
  const populated = await post.populate("user", "name avatarColor");
  res.status(201).json(populated);
});

router.post("/posts/:id/like", async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ error: "Not found" });

  const idx = post.likes.findIndex((id) => id.toString() === req.userId);
  if (idx === -1) post.likes.push(req.userId);
  else post.likes.splice(idx, 1);

  await post.save();
  res.json(post);
});

router.post("/posts/:id/comments", async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ error: "Not found" });

  post.comments.push({ user: req.userId, text: req.body.text });
  await post.save();
  const populated = await post.populate("comments.user", "name avatarColor");
  res.json(populated);
});

// Add a friend by email (simple mutual-add, no request/accept flow for v1)
router.post("/friends", async (req, res) => {
  const { email } = req.body;
  const friend = await User.findOne({ email: (email || "").toLowerCase() });
  if (!friend) return res.status(404).json({ error: "User not found" });
  if (friend._id.toString() === req.userId) {
    return res.status(400).json({ error: "Can't add yourself" });
  }

  await User.findByIdAndUpdate(req.userId, { $addToSet: { friends: friend._id } });
  await User.findByIdAndUpdate(friend._id, { $addToSet: { friends: req.userId } });

  res.json({ ok: true });
});

router.get("/friends", async (req, res) => {
  const me = await User.findById(req.userId).populate("friends", "name email avatarColor");
  res.json(me.friends);
});

export default router;
