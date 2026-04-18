# FloodAlert 🌊

FloodAlert is an AI-assisted flood monitoring web app that helps Malaysian users check flood risk for their saved location, browse other locations, and read latest flood-related updates.

## Problem

Flood information is often spread across multiple official sources, making it difficult for normal users to quickly understand whether their area is safe, at risk, or requires action.

## Solution

FloodAlert combines live flood-related sources with Gemini-powered summarisation to present clear flood status, recommended action, and latest updates in a mobile-friendly interface.

## Key Features

- User sign up and login
- Email verification for signup and password reset
- Default state, district, and city selection
- Home dashboard with flood status
- Temporary location viewing without changing saved default location
- Latest updates with source information
- Profile editing
- Report problem page
- Gemini-generated user-friendly flood summaries

## Tech Stack

### Mandatory Google Tech Stack
- **Google AI Studio / Gemini:** Used to design and test the flood-risk AI prompt and generate structured flood summaries in real-time.
- **Antigravity:** Used as the required development environment for final project review, debugging, and submission preparation.
- **Google Cloud Run:** Used for containerizing and deploying the backend API.

### Supporting Tech Stack
- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express.js, Nodemailer
- **Database:** MongoDB, Mongoose

## Architecture Overview

The frontend React app communicates with the Express backend API. The backend retrieves live flood and weather data, normalizes the data, sends relevant context to Gemini, and returns user-friendly flood status information to the frontend.

### Data Flow
```txt
React Frontend
   ↓
Express Backend API
   ↓
Live Data Services
   ↓
Gemini AI Summary
   ↓
Frontend Dashboard
```

### Live Data Sources Used
- **JPS Public Infobanjir:** Live river water level telemetry and statuses.
- **Public Infobanjir Alerts:** Official river and rainfall warnings.
- **METMalaysia:** Live weather warnings and forecast data.
- **NADMA:** National disaster management information, when active alerts are available.

---

## 🚀 Local Setup & Installation

### 1. Prerequisites
- Node.js (v20+)
- MongoDB (Local instance or Atlas cluster)
- Google Gemini API Key

### 2. Environment Variables
Do not hardcode secrets. Duplicate the provided `.env.example` files into `.env` and fill in your details.

**`backend/.env`**
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/floodalert
GEMINI_API_KEY=your_gemini_api_key_here
APP_NAME=FloodAlert

# For email verification
EMAIL_USER=your_email@gmail.com
EMAIL_APP_PASSWORD=your_gmail_app_password
EMAIL_FROM=your_email@gmail.com
```

**`frontend/.env`**
```env
VITE_API_BASE_URL=http://localhost:5000
```

### 3. MongoDB Setup
You can either install MongoDB locally or use a free cluster on MongoDB Atlas. 
- If running locally, ensure the MongoDB service is running before starting the backend.
- If using Atlas, replace the `MONGODB_URI` in your `.env` file with your cluster's connection string. The database will be created automatically upon connection.

### 4. Running the Backend
```bash
cd backend
npm install
npm run dev
```
*The backend will start on `http://localhost:5000`.*

### 5. Running the Frontend
```bash
cd frontend
npm install
npm run dev
```
*The frontend will start on a local Vite port (usually `http://localhost:5173`).*

---

## ☁️ Google Cloud Run Deployment

The backend includes a `Dockerfile` and is fully configured for Cloud Run deployment.

1. Install the Google Cloud SDK (`gcloud`).
2. Authenticate and select your Google Cloud project.
3. Deploy the backend from the `backend/` directory:
   ```bash
   cd backend
   gcloud run deploy floodalert-backend \
     --source . \
     --set-env-vars="PORT=5000,MONGODB_URI=your_prod_mongo_uri,GEMINI_API_KEY=your_gemini_key,EMAIL_USER=your_email,EMAIL_APP_PASSWORD=your_password,EMAIL_FROM=your_email,APP_NAME=FloodAlert" \
     --allow-unauthenticated
   ```
4. Update the frontend's `.env` variable `VITE_API_BASE_URL` with the newly generated Cloud Run URL, then build and deploy the frontend to your preferred static host (e.g., Firebase Hosting, Vercel).

---

## 🧠 AI Integration Explanation

FloodAlert uses the `gemini-1.5-flash-latest` model to act as a public safety communicator. The Express backend aggregates complex, raw telemetry data from multiple meteorological endpoints and passes it to the Gemini API with a strict system instruction. The AI processes the hydrological thresholds and returns a structured JSON payload containing a clear `status`, `reason`, and actionable `userSummary`, ensuring residents don't need to interpret raw data graphs during an emergency.

---

## 🤖 AI / Code Tool Disclosure

In accordance with hackathon rules, we disclose the use of the following tools:
- **Google AI Studio:** Used to test, refine, and perfect the Gemini prompt for flood risk analysis.
- **Antigravity:** Used as the primary agentic coding assistant to accelerate development, implement the AI layer integrations, establish the Express/React boilerplate, format components, and prepare the project for a production Cloud Run environment.

---

## ⚠️ Known Limitations

- **Scraping Dependency:** The backend currently relies on web scraping or unofficial endpoints for some government data. If the government site structure changes, the data fetching logic may temporarily break.
- **Rate Limiting:** Free-tier Gemini API usage may hit rate limits during a massive surge of simultaneous users. 

## 🔮 Future Improvements

- **Push Notifications:** Implement Firebase Cloud Messaging (FCM) to push SMS and mobile notifications to users when their specific district hits a "Warning" or "Evacuate" status.
- **Historical Data Trends:** Use Gemini to analyze historical flooding patterns and predict future high-risk zones based on incoming monsoon trajectories.
- **Crowdsourced Reports:** Allow verified users to upload photos of local water levels to supplement official telemetry data.
