import express from "express";
import auth from "../middleware/auth.js";
import User from "../models/User.js";
import Workout from "../models/Workout.js";
import DietEntry from "../models/DietEntry.js";
import DietPlan from "../models/DietPlan.js";
import { calculateTDEE, targetCaloriesForGoal } from "../utils/calorie.js";

const router = express.Router();
router.use(auth);

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-20b";

async function callGroq(systemPrompt, userPrompt) {
  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Groq API error (${response.status}): ${text}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

function extractJson(raw) {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

// --- Validation helpers -----------------------------------------------
// The model's output is untrusted input from the app's point of view: it can
// hallucinate fields, return wrong types, or produce implausible numbers.
// Validate shape + sane ranges before it ever touches the database.

class AiValidationError extends Error {}

function isFiniteNumber(n) {
  return typeof n === "number" && Number.isFinite(n);
}

function validateMealEstimate(parsed) {
  const errors = [];
  if (!parsed || typeof parsed !== "object") errors.push("response is not an object");
  else {
    if (!isFiniteNumber(parsed.calories) || parsed.calories < 0 || parsed.calories > 5000)
      errors.push("calories missing or out of realistic range (0-5000)");
    for (const key of ["protein", "carbs", "fat"]) {
      if (parsed[key] !== undefined && (!isFiniteNumber(parsed[key]) || parsed[key] < 0 || parsed[key] > 500)) {
        errors.push(`${key} out of realistic range (0-500g)`);
      }
    }
    if (parsed.note !== undefined && typeof parsed.note !== "string") errors.push("note must be a string");
  }
  if (errors.length) throw new AiValidationError(errors.join("; "));
  return {
    calories: Math.round(parsed.calories),
    protein: parsed.protein !== undefined ? Math.round(parsed.protein) : undefined,
    carbs: parsed.carbs !== undefined ? Math.round(parsed.carbs) : undefined,
    fat: parsed.fat !== undefined ? Math.round(parsed.fat) : undefined,
    note: typeof parsed.note === "string" ? parsed.note.slice(0, 500) : "",
  };
}

function validateDietPlan(parsed) {
  const errors = [];
  if (!parsed || typeof parsed !== "object") {
    throw new AiValidationError("response is not an object");
  }
  if (!isFiniteNumber(parsed.dailyCalorieTarget) || parsed.dailyCalorieTarget < 800 || parsed.dailyCalorieTarget > 6000) {
    errors.push("dailyCalorieTarget missing or out of realistic range (800-6000)");
  }
  const macros = parsed.macros || {};
  for (const key of ["proteinG", "carbsG", "fatG"]) {
    if (!isFiniteNumber(macros[key]) || macros[key] < 0 || macros[key] > 600) {
      errors.push(`macros.${key} missing or out of realistic range`);
    }
  }
  if (!Array.isArray(parsed.plan) || parsed.plan.length === 0) {
    errors.push("plan must be a non-empty array");
  } else {
    parsed.plan.forEach((item, i) => {
      if (!item || typeof item.meal !== "string" || !item.meal.trim()) {
        errors.push(`plan[${i}].meal missing`);
      }
      if (!item || typeof item.suggestion !== "string" || !item.suggestion.trim()) {
        errors.push(`plan[${i}].suggestion missing`);
      }
      if (!isFiniteNumber(item?.estimatedCalories) || item.estimatedCalories < 0 || item.estimatedCalories > 3000) {
        errors.push(`plan[${i}].estimatedCalories missing or out of range`);
      }
    });
  }
  if (parsed.notes !== undefined && typeof parsed.notes !== "string") {
    errors.push("notes must be a string");
  }
  if (errors.length) throw new AiValidationError(errors.join("; "));

  return {
    dailyCalorieTarget: Math.round(parsed.dailyCalorieTarget),
    macros: {
      proteinG: Math.round(macros.proteinG),
      carbsG: Math.round(macros.carbsG),
      fatG: Math.round(macros.fatG),
    },
    plan: parsed.plan.slice(0, 8).map((item) => ({
      meal: item.meal.slice(0, 60),
      suggestion: item.suggestion.slice(0, 400),
      estimatedCalories: Math.round(item.estimatedCalories),
    })),
    notes: typeof parsed.notes === "string" ? parsed.notes.slice(0, 600) : "",
  };
}

// Estimate calories/macros for a free-text meal description, e.g. "2 rotis, dal, salad"
router.post("/estimate-meal", async (req, res) => {
  try {
    const { description, mealType } = req.body;
    if (!description) return res.status(400).json({ error: "description is required" });

    const system = `You are a nutrition estimation assistant. Given a plain-language meal description
(often Indian home-cooked food), estimate calories and macros. Respond with ONLY valid JSON,
no preamble, no markdown fences, in this exact shape:
{"calories": number, "protein": number, "carbs": number, "fat": number, "note": string}
All numeric values are for the whole meal as described. "note" is one short sentence of context
(e.g. an assumption you made about portion size).`;

    const userPrompt = `Meal type: ${mealType || "unspecified"}\nDescription: ${description}`;

    const raw = await callGroq(system, userPrompt);
    const clean = validateMealEstimate(extractJson(raw));

    const entry = await DietEntry.create({
      user: req.userId,
      date: new Date(),
      mealType: mealType || "snack",
      description,
      calories: clean.calories,
      protein: clean.protein,
      carbs: clean.carbs,
      fat: clean.fat,
      source: "ai_estimated",
    });

    res.json({ entry, note: clean.note });
  } catch (err) {
    if (err instanceof AiValidationError) {
      return res.status(502).json({ error: `AI returned an implausible estimate: ${err.message}` });
    }
    res.status(500).json({ error: err.message });
  }
});

// Generate a personalized diet plan based on profile + recent activity
router.post("/generate-diet-plan", async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const tdee = calculateTDEE(user);
    const target = targetCaloriesForGoal(tdee, user.goalType);

    const recentWorkouts = await Workout.find({ user: req.userId })
      .sort({ date: -1 })
      .limit(7);

    const avgCaloriesBurned =
      recentWorkouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0) /
      (recentWorkouts.length || 1);

    const system = `You are a certified nutrition coach creating a one-day diet plan template.
Respond with ONLY valid JSON, no markdown fences, in this exact shape:
{
  "dailyCalorieTarget": number,
  "macros": {"proteinG": number, "carbsG": number, "fatG": number},
  "plan": [{"meal": string, "suggestion": string, "estimatedCalories": number}],
  "notes": string
}
Favor commonly available Indian home-cooked food options unless the user's context suggests otherwise.
Keep "suggestion" concrete (specific foods/portions), and make the "plan" array cover
breakfast, lunch, dinner, and 1-2 snacks. "notes" should be 1-3 short sentences of practical advice.`;

    const userPrompt = `Profile: age ${user.age || "unknown"}, sex ${user.sex || "unknown"},
height ${user.heightCm || "unknown"}cm, weight ${user.weightKg || "unknown"}kg,
activity level ${user.activityLevel}, goal ${user.goalType}.
Estimated daily calorie target: ${target || "unknown"}.
Average calories burned per workout over last 7 sessions: ${Math.round(avgCaloriesBurned)}.
Create a practical one-day diet plan aligned with this target and goal.`;

    const raw = await callGroq(system, userPrompt);
    const clean = validateDietPlan(extractJson(raw));

    const dietPlan = await DietPlan.create({
      user: req.userId,
      goalType: user.goalType,
      dailyCalorieTarget: clean.dailyCalorieTarget,
      macros: clean.macros,
      plan: clean.plan,
      notes: clean.notes,
      rawModelResponse: raw,
    });

    res.json(dietPlan);
  } catch (err) {
    if (err instanceof AiValidationError) {
      return res.status(502).json({ error: `AI returned an implausible plan: ${err.message}` });
    }
    res.status(500).json({ error: err.message });
  }
});

// Fetch most recent saved diet plan
router.get("/diet-plan/latest", async (req, res) => {
  const plan = await DietPlan.findOne({ user: req.userId }).sort({ createdAt: -1 });
  res.json(plan || null);
});

export default router;