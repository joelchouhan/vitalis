# FitTrack — Fitness Tracking App (React + Node + MongoDB)

## Features (v1)
- Auth (JWT), user profile with BMR/TDEE-based daily calorie target
- Workout logging (strength/cardio/yoga/sports) + 14-day calories-burned chart
- Diet/calorie tracking — log meals in plain English (e.g. "2 rotis, dal, salad")
  and get AI-estimated calories + macros via the Claude API
- AI-generated personalized diet plan based on your profile, goal, and recent workouts
- **Weight tracking** — log today's weight from the dashboard, see a 90-day trend chart;
  each new log recalculates your daily calorie target automatically
- Goals with streaks and progress bars
- Social feed: post updates, like, add friends by email
- **AI response validation** — the calorie estimate and diet plan endpoints validate the
  model's JSON (types, realistic ranges, required fields) before saving anything. A bad
  or implausible AI response returns a 502 with a clear reason instead of silently
  saving garbage data.

## Stack
- **Frontend:** React 18 + Vite + React Router + Tailwind + Recharts
- **Backend:** Node + Express + Mongoose
- **Database:** MongoDB
- **AI:** Anthropic Claude API (calorie estimation + diet plan generation)

## Setup

### 1. MongoDB Atlas
1. Create a free cluster at https://cloud.mongodb.com/
2. Database Access → add a database user (username + password)
3. Network Access → add your current IP (or `0.0.0.0/0` while developing)
4. Clusters → Connect → "Drivers" → copy the connection string, it looks like:
   `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
5. Add a database name to the path, e.g. `.../fitness-app?retryWrites=true&w=majority`

### 2. Backend
```bash
cd server
cp .env.example .env
# edit .env: set MONGO_URI (your Atlas string), JWT_SECRET, ANTHROPIC_API_KEY
npm install
npm run dev
```
Runs on http://localhost:5000. On startup you should see "MongoDB connected" — if you
instead see a connection error, it's almost always the Network Access IP allowlist or a
wrong password in the connection string (special characters in the password need
URL-encoding, e.g. `@` → `%40`).

### 3. Frontend
```bash
cd client
npm install
npm run dev
```
Runs on http://localhost:5173 (proxies /api to the backend)

### 4. Get a Claude API key
Create one at https://console.anthropic.com/ → put it in `server/.env` as `ANTHROPIC_API_KEY`.
This powers `/api/ai/estimate-meal` and `/api/ai/generate-diet-plan`.

## First run
1. Register an account.
2. Go to **Profile**, fill in age/height/weight/activity/goal → this computes your
   daily calorie target (Mifflin-St Jeor formula).
3. Go to **Diet** → "Generate plan" for an AI diet plan, or log meals in plain text.
4. Go to **Workouts** to log sessions; **Goals** to set streak/weight/workout targets.
5. Go to **Social** to add a friend by email and post updates.

## Project structure
```
fitness-app/
  server/
    models/       Mongoose schemas (User, Workout, Goal, DietEntry, DietPlan, Post, WeightLog)
    routes/        auth, workouts, goals, diet, ai, social, weight
    middleware/    JWT auth
    utils/         BMR/TDEE calorie math
    server.js
  client/
    src/
      pages/       Dashboard, Workouts, Diet, Goals, Social, Profile, Login, Register
      components/  NavBar
      context/     AuthContext
      api/         axios client
```

## Notes / what's next
- Friend adding is instant mutual-add for v1 (no request/accept flow) — easy to extend.
- No image uploads yet (avatars are just colored initials).
- Consider adding: exercise library/autocomplete, push reminders, request/accept friend flow.
