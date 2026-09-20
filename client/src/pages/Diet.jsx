import { useEffect, useState } from "react";
import client from "../api/client.js";

export default function Diet() {
  const [entries, setEntries] = useState([]);
  const [description, setDescription] = useState("");
  const [mealType, setMealType] = useState("lunch");
  const [estimating, setEstimating] = useState(false);
  const [plan, setPlan] = useState(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [error, setError] = useState("");

  function loadEntries() {
    client.get("/diet").then((res) => setEntries(res.data.slice(0, 20)));
  }

  useEffect(() => {
    loadEntries();
    client.get("/ai/diet-plan/latest").then((res) => setPlan(res.data));
  }, []);

  async function handleAiLog(e) {
    e.preventDefault();
    if (!description.trim()) return;
    setEstimating(true);
    setError("");
    try {
      await client.post("/ai/estimate-meal", { description, mealType });
      setDescription("");
      loadEntries();
    } catch (err) {
      setError(err.response?.data?.error || "Estimation failed");
    } finally {
      setEstimating(false);
    }
  }

  async function handleGeneratePlan() {
    setGeneratingPlan(true);
    setError("");
    try {
      const res = await client.post("/ai/generate-diet-plan");
      setPlan(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Plan generation failed");
    } finally {
      setGeneratingPlan(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-800">Diet & Calories</h1>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* AI meal logger */}
      <form onSubmit={handleAiLog} className="bg-white rounded-xl shadow-sm p-5 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Log a meal (AI estimates calories)</h3>
        <div className="flex gap-2">
          <select
            value={mealType}
            onChange={(e) => setMealType(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            {["breakfast", "lunch", "dinner", "snack"].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <input
            placeholder="e.g. 2 rotis, dal, salad"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <button
          disabled={estimating}
          className="bg-brand-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
        >
          {estimating ? "Estimating..." : "Log with AI"}
        </button>
      </form>

      {/* AI diet plan */}
      <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Your AI diet plan</h3>
          <button
            onClick={handleGeneratePlan}
            disabled={generatingPlan}
            className="text-sm px-3 py-1.5 rounded-md border border-brand-600 text-brand-600 hover:bg-brand-50 disabled:opacity-50"
          >
            {generatingPlan ? "Generating..." : plan ? "Regenerate" : "Generate plan"}
          </button>
        </div>

        {!plan && <p className="text-sm text-gray-400">No plan yet — generate one based on your profile.</p>}

        {plan && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Target: <span className="font-semibold">{plan.dailyCalorieTarget} kcal/day</span> ·
              Protein {plan.macros?.proteinG}g · Carbs {plan.macros?.carbsG}g · Fat {plan.macros?.fatG}g
            </p>
            <div className="grid gap-2">
              {plan.plan?.map((m, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-800">
                    {m.meal} <span className="text-gray-400 font-normal">· {m.estimatedCalories} kcal</span>
                  </p>
                  <p className="text-sm text-gray-600">{m.suggestion}</p>
                </div>
              ))}
            </div>
            {plan.notes && <p className="text-xs text-gray-500 italic">{plan.notes}</p>}
          </div>
        )}
      </div>

      {/* Recent entries */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700">Recent entries</h3>
        {entries.map((e) => (
          <div key={e._id} className="bg-white rounded-lg shadow-sm p-3 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-800">{e.description}</p>
              <p className="text-xs text-gray-400">
                {e.mealType} · {new Date(e.date).toLocaleString("en-IN")}
                {e.source === "ai_estimated" && " · AI estimated"}
              </p>
            </div>
            <span className="text-sm font-medium text-gray-700">{e.calories ?? "—"} kcal</span>
          </div>
        ))}
        {entries.length === 0 && <p className="text-sm text-gray-400">No entries yet.</p>}
      </div>
    </div>
  );
}
