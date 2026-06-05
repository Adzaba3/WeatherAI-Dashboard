# Weather-AI Integration Assessment

Public submission for the Weather-AI technical challenge.

This project is a production-style weather dashboard that consumes the Weather-AI API through a dedicated backend proxy. The frontend focuses on the user experience, while the backend keeps the Weather-AI API key private and avoids browser-side CORS issues during deployment.

## Submission Links

- **Live demo**: `https://your-frontend.onrender.com`
- **Backend health check**: `https://your-backend.onrender.com/health`
- **Weather-AI docs**: https://weather-ai.co/docs

Replace the demo URLs above with the final Render URLs before submitting the repository.

## What It Does

- Shows current weather conditions for the selected location.
- Displays hourly and 7-day forecast data.
- Uses Weather-AI AI summaries when available.
- Auto-detects the user's location through Weather-AI geo weather.
- Shows Weather-AI usage/quota information.
- Includes tree and canopy analysis endpoints for image upload workflows.

## Architecture

```txt
weather-app/
├── backend/   # Express proxy that talks to Weather-AI
└── frontend/  # React + Vite dashboard
```

The browser never calls `https://api.weather-ai.co` directly. Instead:

```txt
React frontend → Express backend → Weather-AI API
```

This keeps `WEATHER_AI_API_KEY` server-side only and solves the CORS failure that happens when a deployed frontend calls Weather-AI directly from the browser.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, TanStack Query, Zustand, Tailwind CSS, Recharts
- **Backend**: Node.js, Express, CORS, Multer
- **Deployment target**: Render

## Weather-AI Endpoints Used

The backend exposes the routes needed by the frontend and forwards them to Weather-AI:

- `GET /v1/weather`
- `GET /v1/current`
- `GET /v1/weather-geo`
- `GET /v1/usage`
- `GET /v1/trees/quota`
- `POST /v1/trees/analyze`

It also exposes:

- `GET /health`

## Local Setup

### Prerequisites

- Node.js 18+
- npm
- A Weather-AI API key

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Backend Environment

Create `backend/.env` from `backend/.env.example`:

```env
PORT=3001
WEATHER_AI_API_KEY=wai_your_secret_key
WEATHER_AI_BASE_URL=https://api.weather-ai.co
FRONTEND_ORIGIN=http://localhost:5173
```

### 3. Configure Frontend Environment

Create `frontend/.env` from `frontend/.env.example`:

```env
VITE_API_BASE_URL=http://localhost:3001
```

### 4. Run Locally

Start the backend:

```bash
npm run dev:backend
```

Start the frontend in a second terminal:

```bash
npm run dev:frontend
```

Open:

```txt
http://localhost:5173
```

## Build

```bash
npm run build
```

The build command compiles the frontend workspace.



## Environment Variables

### Backend

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | Backend port. Render provides this automatically. |
| `WEATHER_AI_API_KEY` | Yes | Secret Weather-AI API key. |
| `WEATHER_AI_BASE_URL` | No | Weather-AI API base URL. Defaults to `https://api.weather-ai.co`. |
| `FRONTEND_ORIGIN` | Yes | Allowed frontend origin for CORS. |

### Frontend

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Yes | Public URL of the deployed backend proxy. |

