import { useEffect, useState } from "react";
import client from "../api/client.js";

const METRICS = ["weight_kg", "workouts_per_week", "calories_per_day", "streak_days", "custom"];

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [form, setForm] = useState({ title: "", metric: "streak_days", targetValue: 7 });

  function load() {
    client.get("/goals").then((res) => setGoals(res.data));
  }
  useEffect(load, []);

  async function handleSubmit(e) {
    e.preventDefault();
    await client.post("/goals", form);
    setForm({ title: "", metric: "streak_days", targetValue: 7 });
    load();
  }

  async function checkIn(id) {
    await client.post(`/goals/${id}/checkin`);
    load();
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-800">Goals</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-5 grid grid-cols-2 gap-3">
        <input
          placeholder="Goal title (e.g. Workout 4x/week)"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="col-span-2 border border-gray-300 rounded-md px-3 py-2 text-sm"
          required
        />
        <select
          value={form.metric}
          onChange={(e) => setForm({ ...form, metric: e.target.value })}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          {METRICS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Target value"
          value={form.targetValue}
          onChange={(e) => setForm({ ...form, targetValue: Number(e.target.value) })}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
        <button className="col-span-2 bg-brand-600 text-white rounded-md py-2 text-sm font-medium hover:bg-brand-700">
          Add goal
        </button>
      </form>

      <div className="space-y-3">
        {goals.map((g) => (
          <div key={g._id} className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">
                  {g.title} {g.completed && <span className="text-green-600 text-xs ml-1">✓ done</span>}
                </p>
                <p className="text-xs text-gray-500">
                  {g.currentValue}/{g.targetValue} · streak {g.streakCount}d
                </p>
              </div>
              <button
                onClick={() => checkIn(g._id)}
                disabled={g.completed}
                className="text-sm px-3 py-1.5 rounded-md border border-brand-600 text-brand-600 hover:bg-brand-50 disabled:opacity-40"
              >
                Check in today
              </button>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 mt-3">
              <div
                className="bg-brand-500 h-2 rounded-full"
                style={{ width: `${Math.min(100, (g.currentValue / g.targetValue) * 100)}%` }}
              />
            </div>
          </div>
        ))}
        {goals.length === 0 && <p className="text-sm text-gray-400">No goals yet — add one above.</p>}
      </div>
    </div>
  );
}
