import { useEffect, useState } from "react";
import client from "../api/client.js";

const TYPES = ["strength", "cardio", "yoga", "sports", "other"];

export default function Workouts() {
  const [workouts, setWorkouts] = useState([]);
  const [form, setForm] = useState({
    title: "",
    type: "strength",
    durationMin: 30,
    caloriesBurned: 200,
    notes: "",
  });

  function load() {
    client.get("/workouts").then((res) => setWorkouts(res.data));
  }

  useEffect(load, []);

  async function handleSubmit(e) {
    e.preventDefault();
    await client.post("/workouts", form);
    setForm({ title: "", type: "strength", durationMin: 30, caloriesBurned: 200, notes: "" });
    load();
  }

  async function handleDelete(id) {
    await client.delete(`/workouts/${id}`);
    load();
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-800">Workouts</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-5 grid grid-cols-2 gap-3">
        <input
          placeholder="Title (e.g. Push day)"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="col-span-2 border border-gray-300 rounded-md px-3 py-2 text-sm"
          required
        />
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Duration (min)"
          value={form.durationMin}
          onChange={(e) => setForm({ ...form, durationMin: Number(e.target.value) })}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
        <input
          type="number"
          placeholder="Calories burned"
          value={form.caloriesBurned}
          onChange={(e) => setForm({ ...form, caloriesBurned: Number(e.target.value) })}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
        <input
          placeholder="Notes (optional)"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
        <button className="col-span-2 bg-brand-600 text-white rounded-md py-2 text-sm font-medium hover:bg-brand-700">
          Log workout
        </button>
      </form>

      <div className="space-y-2">
        {workouts.map((w) => (
          <div key={w._id} className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">{w.title}</p>
              <p className="text-xs text-gray-500">
                {w.type} · {w.durationMin} min · {w.caloriesBurned} kcal ·{" "}
                {new Date(w.date).toLocaleDateString("en-IN")}
              </p>
            </div>
            <button
              onClick={() => handleDelete(w._id)}
              className="text-xs text-red-500 hover:underline"
            >
              Delete
            </button>
          </div>
        ))}
        {workouts.length === 0 && <p className="text-sm text-gray-400">No workouts logged yet.</p>}
      </div>
    </div>
  );
}
