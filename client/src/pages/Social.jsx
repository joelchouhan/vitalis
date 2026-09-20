import { useEffect, useState } from "react";
import client from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Social() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [friendEmail, setFriendEmail] = useState("");
  const [friendMsg, setFriendMsg] = useState("");

  function loadFeed() {
    client.get("/social/feed").then((res) => setPosts(res.data));
  }
  useEffect(loadFeed, []);

  async function handlePost(e) {
    e.preventDefault();
    if (!content.trim()) return;
    await client.post("/social/posts", { type: "text", content });
    setContent("");
    loadFeed();
  }

  async function handleLike(id) {
    await client.post(`/social/posts/${id}/like`);
    loadFeed();
  }

  async function handleAddFriend(e) {
    e.preventDefault();
    try {
      await client.post("/social/friends", { email: friendEmail });
      setFriendMsg("Friend added!");
      setFriendEmail("");
    } catch (err) {
      setFriendMsg(err.response?.data?.error || "Could not add friend");
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-800">Social</h1>

      <form onSubmit={handleAddFriend} className="bg-white rounded-xl shadow-sm p-4 flex gap-2">
        <input
          placeholder="Add a friend by email"
          value={friendEmail}
          onChange={(e) => setFriendEmail(e.target.value)}
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
        <button className="bg-brand-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-brand-700">
          Add
        </button>
      </form>
      {friendMsg && <p className="text-xs text-gray-500">{friendMsg}</p>}

      <form onSubmit={handlePost} className="bg-white rounded-xl shadow-sm p-4 space-y-2">
        <textarea
          placeholder="Share a workout win, progress update..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          rows={2}
        />
        <button className="bg-brand-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-brand-700">
          Post
        </button>
      </form>

      <div className="space-y-3">
        {posts.map((p) => (
          <div key={p._id} className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: p.user?.avatarColor || "#4f46e5" }}
              >
                {p.user?.name?.[0]?.toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-800">{p.user?.name}</span>
            </div>
            <p className="text-sm text-gray-700">{p.content}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
              <button
                onClick={() => handleLike(p._id)}
                className={`hover:underline ${
                  p.likes?.includes(user?._id) ? "text-brand-600 font-medium" : ""
                }`}
              >
                ♥ {p.likes?.length || 0}
              </button>
              <span>{p.comments?.length || 0} comments</span>
            </div>
          </div>
        ))}
        {posts.length === 0 && <p className="text-sm text-gray-400">No posts yet.</p>}
      </div>
    </div>
  );
}
