import { useState } from "react";
import client from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    age: user?.age || "",
    heightCm: user?.heightCm || "",
    weightKg: user?.weightKg || "",
    sex: user?.sex || "male",
    activityLevel: user?.activityLevel || "moderate",
    goalType: user?.goalType || "maintain",
  });
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const res = await client.put("/auth/me", form);
    setUser(res.data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-md mx-auto p-4 md:p-6">
      <h1 className="text-xl font-bold text-gray-800 mb-4">Profile</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-5 space-y-3">
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            placeholder="Age"
            value={form.age}
            onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          <select
            value={form.sex}
            onChange={(e) => setForm({ ...form, sex: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          <input
            type="number"
            placeholder="Height (cm)"
            value={form.heightCm}
            onChange={(e) => setForm({ ...form, heightCm: Number(e.target.value) })}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Weight (kg)"
            value={form.weightKg}
            onChange={(e) => setForm({ ...form, weightKg: Number(e.target.value) })}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <select
          value={form.activityLevel}
          onChange={(e) => setForm({ ...form, activityLevel: e.target.value })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="sedentary">Sedentary</option>
          <option value="light">Lightly active</option>
          <option value="moderate">Moderately active</option>
          <option value="active">Active</option>
          <option value="very_active">Very active</option>
        </select>
        <select
          value={form.goalType}
          onChange={(e) => setForm({ ...form, goalType: e.target.value })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="lose_weight">Lose weight</option>
          <option value="maintain">Maintain</option>
          <option value="gain_muscle">Gain muscle</option>
        </select>
        <button className="w-full bg-brand-600 text-white rounded-md py-2 text-sm font-medium hover:bg-brand-700">
          Save & recalculate calorie target
        </button>
        {saved && <p className="text-xs text-green-600 text-center">Saved!</p>}
        {user?.dailyCalorieTarget && (
          <p className="text-xs text-gray-500 text-center">
            Current daily target: {user.dailyCalorieTarget} kcal
          </p>
        )}
      </form>
    </div>
  );
}
