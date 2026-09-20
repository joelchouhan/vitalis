// Mifflin-St Jeor BMR + activity multiplier -> TDEE, then goal adjustment.
export function calculateTDEE({ sex, age, heightCm, weightKg, activityLevel }) {
  if (!age || !heightCm || !weightKg) return null;

  const bmr =
    sex === "female"
      ? 10 * weightKg + 6.25 * heightCm - 5 * age - 161
      : 10 * weightKg + 6.25 * heightCm - 5 * age + 5;

  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  const tdee = bmr * (multipliers[activityLevel] || 1.55);
  return Math.round(tdee);
}

export function targetCaloriesForGoal(tdee, goalType) {
  if (!tdee) return null;
  if (goalType === "lose_weight") return Math.round(tdee - 500);
  if (goalType === "gain_muscle") return Math.round(tdee + 300);
  return tdee; // maintain
}
