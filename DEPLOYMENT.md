# Deployment Guide: Hybrid AI-NWP Blending Platform

This guide provides step-by-step instructions to push your project to GitHub and deploy it online with a live public URL.

---

## Architecture Overview

The system is configured as a unified **Full-Stack Application**:
- **Backend**: FastAPI (Python 3.11) with endpoints at `/api/...` (multi-model blending, weights, verification, alerts).
- **Frontend**: React (Vite + TailwindCSS + Recharts + Leaflet).
- **Serving**: FastAPI serves both the REST API and the compiled React production build (`frontend/dist`), eliminating CORS problems and providing a single live URL.
- **Fail-safe**: The frontend includes automatic snapshot fallback if the server is ever waking up or experiencing cold starts.

---

## Step 1: Push Code to GitHub

### 1.1 Create a New Repository on GitHub
1. Open [GitHub](https://github.com/new).
2. Enter a repository name (e.g. `sih-hybrid-weather` or `hybrid-nwp-blending`).
3. Set the visibility to **Public** (or **Private**).
4. Leave **"Initialize with README, .gitignore, license"** **UNCHECKED** (we already have them configured).
5. Click **Create repository**.

### 1.2 Push from your Local Machine
Open your terminal (PowerShell or Git Bash) in this project root (`c:\Web Dev\SIH2`) and run:

```bash
# 1. Stage all project files (node_modules is excluded automatically)
git add .

# 2. Commit the changes
git commit -m "feat: configure full-stack production deployment for Render and Docker"

# 3. Rename branch to main (if not already main)
git branch -M main

# 4. Link your remote GitHub repository (replace USERNAME and REPO with yours)
git remote add origin https://github.com/USERNAME/REPO.git

# 5. Push code to GitHub
git push -u origin main
```

*(If you ever need to update the remote URL: `git remote set-url origin https://github.com/USERNAME/REPO.git`)*

---

## Step 2: Deploy Online for Free (Render - Recommended)

Render provides a generous free tier and automatically builds Docker containers directly from your GitHub repository.

### Option A: 1-Click via Render Dashboard (Fastest)

1. Sign up or log in at **[render.com](https://render.com/)**.
2. Click **New +** and select **Web Service**.
3. Connect your **GitHub account** and select your repository (`sih-hybrid-weather`).
4. Render will prompt you for configuration:
   - **Name**: `sih-hybrid-weather` (or any name you choose)
   - **Region**: Choose the closest region (e.g., Singapore, Frankfurt, or Oregon)
   - **Language / Runtime**: Select **Docker** (Render will automatically detect `Dockerfile`)
   - **Instance Type**: **Free**
5. Click **Deploy Web Service**!

> Render will run the multi-stage Docker build:
> 1. Compiles the Vite React frontend into optimized static files.
> 2. Sets up Python 3.11, OpenMP dependencies, and packages from `requirements.txt`.
> 3. Starts the production server on the assigned port.
> Within 2-3 minutes, you will receive a live URL: `https://sih-hybrid-weather.onrender.com`!

---

### Option B: Native Python Service on Render (Without Docker)

If you prefer to deploy without Docker on Render:
1. In Render, select **Python 3** as the runtime.
2. Set **Build Command**:
   ```bash
   chmod +x build.sh && ./build.sh
   ```
3. Set **Start Command**:
   ```bash
   cd backend && uvicorn api:app --host 0.0.0.0 --port $PORT
   ```
4. Set **Health Check Path**: `/api/status`
5. Click **Deploy Web Service**.

---

## Step 3: Alternative Deployment Options

### Railway (Instant 1-Click)
1. Go to [railway.app](https://railway.app/) and click **New Project**.
2. Select **Deploy from GitHub repo**.
3. Select this repository.
4. Railway detects the `Dockerfile` and builds both frontend and backend automatically.
5. In project settings, click **Generate Domain** to get your public URL.

---

### Hugging Face Spaces (Great for AI / Research Demos)
1. Go to [huggingface.co/spaces](https://huggingface.co/spaces) and click **Create new Space**.
2. Name your space, select **Docker** as the SDK, and choose the **Blank** template (Free CPU tier).
3. Connect your GitHub repository or push directly to the Hugging Face git remote.
4. Your weather dashboard will be live inside Hugging Face Spaces!

---

## Verifying Deployment

Once deployed, visit your live URL:
- **Web Dashboard**: `https://<your-app>.onrender.com/`
- **Health Check**: `https://<your-app>.onrender.com/api/status`
- **Interactive Swagger Docs**: `https://<your-app>.onrender.com/docs`
- **Station List**: `https://<your-app>.onrender.com/api/stations`
- **Forecast Blending**: `https://<your-app>.onrender.com/api/forecast?location=delhi&variable=precipitation&lead_time=24`

---

## Local Development vs. Production

| Command | Environment | Description |
| :--- | :--- | :--- |
| `python run_local.py` | Local Dev | Launches Vite dev server (port 5173) with hot reload and local FastAPI backend (port 8000). |
| `python backend/api.py` | Local Full-Stack | Serves both the compiled frontend and API on `http://localhost:8000`. |
| `docker build -t sih-weather . && docker run -p 8000:8000 sih-weather` | Local Container | Tests the exact Docker production image locally. |
