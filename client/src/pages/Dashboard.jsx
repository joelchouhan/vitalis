import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import client from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Dashboard() {
  const { user, setUser } = useAuth();
  const [todayTotals, setTodayTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [workouts, setWorkouts] = useState([]);
  const [goals, setGoals] = useState([]);
  const [weightLogs, setWeightLogs] = useState([]);
  const [weightInput, setWeightInput] = useState("");
  const [loggingWeight, setLoggingWeight] = useState(false);

  function loadWeight() {
    client.get("/weight?days=90").then((res) => setWeightLogs(res.data));
  }

  useEffect(() => {
    client.get("/diet/summary/today").then((res) => setTodayTotals(res.data.totals));
    client.get("/workouts/stats/summary?days=14").then((res) => setWorkouts(res.data));
    client.get("/goals").then((res) => setGoals(res.data.filter((g) => !g.completed).slice(0, 3)));
    loadWeight();
  }, []);

  async function handleLogWeight(e) {
    e.preventDefault();
    const val = Number(weightInput);
    if (!val || val <= 0) return;
    setLoggingWeight(true);
    try {
      await client.post("/weight", { weightKg: val });
      setWeightInput("");
      loadWeight();
      // Weight logging recalculates the calorie target server-side — refresh profile
      const me = await client.get("/auth/me");
      setUser(me.data);
    } finally {
      setLoggingWeight(false);
    }
  }

  const weightChartData = weightLogs.map((w) => ({
    day: new Date(w.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
    weight: w.weightKg,
  }));
  const weightChange =
    weightLogs.length >= 2
      ? (weightLogs[weightLogs.length - 1].weightKg - weightLogs[0].weightKg).toFixed(1)
      : null;

  const target = user?.dailyCalorieTarget || 2000;
  const consumed = todayTotals.calories || 0;
  const pct = Math.min(100, Math.round((consumed / target) * 100));

  const chartData = groupByDay(workouts);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col items-center">
          <CalorieRing pct={pct} />
          <p className="mt-3 text-sm text-gray-500">
            {consumed} / {target} kcal today
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Macros today</h3>
          <MacroBar label="Protein" value={todayTotals.protein} color="bg-blue-500" />
          <MacroBar label="Carbs" value={todayTotals.carbs} color="bg-amber-500" />
          <MacroBar label="Fat" value={todayTotals.fat} color="bg-pink-500" />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Active goals</h3>
          {goals.length === 0 && <p className="text-sm text-gray-400">No active goals yet.</p>}
          {goals.map((g) => (
            <div key={g._id} className="mb-2">
              <p className="text-sm text-gray-700">{g.title}</p>
              <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
                <div
                  className="bg-brand-500 h-2 rounded-full"
                  style={{ width: `${Math.min(100, (g.currentValue / g.targetValue) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Calories burned — last 14 days</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="day" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip />
            <Line type="monotone" dataKey="calories" stroke="#4f46e5" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">
            Weight trend — last 90 days
            {weightChange !== null && (
              <span className={`ml-2 text-xs font-normal ${weightChange < 0 ? "text-green-600" : weightChange > 0 ? "text-amber-600" : "text-gray-400"}`}>
                {weightChange > 0 ? "+" : ""}
                {weightChange} kg
              </span>
            )}
          </h3>
          <form onSubmit={handleLogWeight} className="flex gap-2">
            <input
              type="number"
              step="0.1"
              placeholder="Today's kg"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              className="w-28 border border-gray-300 rounded-md px-2 py-1.5 text-sm"
            />
            <button
              disabled={loggingWeight}
              className="bg-brand-600 text-white rounded-md px-3 py-1.5 text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
            >
              Log
            </button>
          </form>
        </div>
        {weightChartData.length === 0 ? (
          <p className="text-sm text-gray-400">No weight logged yet — add today's weight above.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weightChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" fontSize={12} />
              <YAxis fontSize={12} domain={["dataMin - 2", "dataMax + 2"]} />
              <Tooltip />
              <Line type="monotone" dataKey="weight" stroke="#db2777" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function CalorieRing({ pct }) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  return (
    <svg width="130" height="130" viewBox="0 0 130 130">
      <circle cx="65" cy="65" r={radius} stroke="#e5e7eb" strokeWidth="12" fill="none" />
      <circle
        cx="65"
        cy="65"
        r={radius}
        stroke="#4f46e5"
        strokeWidth="12"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 65 65)"
      />
      <text x="65" y="70" textAnchor="middle" fontSize="20" fontWeight="700" fill="#374151">
        {pct}%
      </text>
    </svg>
  );
}

function MacroBar({ label, value = 0, color }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{label}</span>
        <span>{Math.round(value)}g</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${Math.min(100, value / 2)}%` }} />
      </div>
    </div>
  );
}

function groupByDay(workouts) {
  const map = {};
  for (const w of workouts) {
    const day = new Date(w.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    map[day] = (map[day] || 0) + (w.caloriesBurned || 0);
  }
  return Object.entries(map).map(([day, calories]) => ({ day, calories }));
}
