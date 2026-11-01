# TaskFlow AI — React Productivity Dashboard

Professional React + Vite task manager featuring dashboard statistics, CRUD tasks, categories, priorities, due dates, search/sort, completion tracking, browser persistence, and an AI schedule planner interface.

## Requirements
- Node.js 18+ recommended
- npm

## Run locally
1. Extract the ZIP.
2. Open the extracted `taskflow-react-ai` folder in VS Code.
3. Open Terminal → New Terminal.
4. Run:
   ```bash
   npm install
   npm run dev
   ```
5. Open the localhost URL printed by Vite (usually `http://localhost:5173`).

## Features
- Overview dashboard: total, pending, completed, completion rate
- Create, edit, complete, and delete tasks
- Category, priority, notes, due date, overdue indicators
- Views: Overview, Tasks, Today, Upcoming, Completed
- Search and sorting
- Data saved to localStorage
- Export tasks as JSON
- AI schedule planner
- Responsive layout

## AI planner modes
The app includes a demo planner that generates a transparent heuristic schedule in the browser, without calling an AI model. To use real AI:
1. Implement a backend `POST /api/plan` endpoint (or configure a different endpoint in AI settings).
2. Keep the provider API key on the server as an environment variable.
3. The endpoint receives `{ date, tasks }` and should return JSON like:
   ```json
   {
     "headline": "Your plan",
     "summary": "A short explanation",
     "schedule": [
       { "id": "task-id", "title": "Task title", "start": "09:00 AM", "end": "10:00 AM", "reason": "High priority" }
     ],
     "tips": ["Take a short break between focus blocks"]
   }
   ```
4. Choose “Real AI backend” in planner settings.

This frontend does not ship with an AI provider key or backend. Selecting real AI mode will fail until you configure and run your own backend. Never put provider API keys in React/frontend environment variables exposed to the browser.

## Data note
Tasks are stored in this browser's localStorage; they are not synced across browsers or devices.
