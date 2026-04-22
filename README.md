# What is FloodAlert?

FloodAlert is an AI-assisted flood monitoring web app that helps users check flood risk for their location, check flood risk for other locations, and read latest flood-related updates.

## Problem

Flood information is often spread across multiple official sources, making it difficult for normal users to quickly understand whether their area is safe, at risk, or requires action.

## Solution

FloodAlert combines live flood-related sources with Gemini AI powered (Google AI Studio) summarisation to present clear flood status, recommended action, and latest updates in a user-friendly interface.

## Key Features

**Landing page**
- User can click either Login or SignUp

**User sign up and login**
- Sign up:
  - Username
  - Email
  - Password
  - Set default location (state, district, city)
- Login:
  - Username/Email
  - Password
- Forgot password feature below the login page (email verification code needed)

**Home page:**
- User will be welcomed with the saved default location and together with date and time
- Logout button at top right corner
- Live status with explanation and recommended action
- AI summary 
- Latest update showcase the most recent update 
  - User can click "view updates" button to view all the available latest updates in Updates page
  - Show the last time it is updated

**Locations page:**
- Default location will be showcase first with other nearby area in the same district (eg. User set Negeri Sembilan, Seremban, Seremban City. At Locations page will show Nilai, Senanwang, Rasah, Ampangan Labu, Sendayan which is the area inside the district of Seremban)
- User can view status from other location too
- User can click into other location and will bring user to the home page but with the status of that location (Does not affect saved default location)
- Bottom of the page will show the last time the status is updated

**Update page:**
- User can view all the available latest updates
- Will show the last time it is updated

**Setting page:**
- User can:
    - Edit profile:
        - Change username
        - Change email (email verification code needed)
        - Change password (email verification code needed)
        - Change profile picture
        - Change default location
    - Log out (Confirmation needed: Yes/No)
    - Delete account (Confirmation needed: Yes/No)
    - Read status guide (Status, Status meaning, What to do)
    - Check how the app works (demo video is ready)
    - Report problem (Select type of problem/other, Explanation, Image attachment as a proof)

**There are total of 4 section will ask for verification code to verify user:**
- Sign up page -> Email verification for signup
- Forgot password page -> Email verification for forgot password
- Change password page -> Forgot password verification code verification
- Email reset page -> Email verification for email reset

## Tech Stack

**1. Mandatory Google Tech Stack**
- **Google AI Studio:** Used to design and test the flood-risk AI prompt and generate structured flood summaries in real-time.
- **Antigravity:** Used as the required development environment for final project review, debugging, and submission preparation.
- **Google Cloud Run:** Used for deploying the app, with 2 service (one for frontend, one for backend).

**2. Supporting Tech Stack**
- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express.js, Nodemailer
- **Database:** MongoDB, Mongoose

## Architecture Overview

The frontend React app communicates with the Express backend API. The backend retrieves live data, normalizes the data, sends relevant context to Gemini AI, and returns user-friendly flood status information to the frontend.

**Data Used**
- water-level data
   - from JPS, Public Infobanjir water-level page
   - used as the main flood signal
   - decide direct station status first

- rainfall and weather data
   - from METMalaysia and Public Infobanjir weather-related pages
   - used as supporting data when a city has no direct station

- official alert context
   - from Public Infobanjir and NADMA pages
   - used to detect official flood-related concern, alerts, or confirmation

- location / coordinate support
   - from stored city coordinates and mapped station coordinates in the backend
   - used to estimate which station is nearest to a city
   - avoid the whole district from having the same status

- summary
   - **JPS Public Infobanjir:** Live river water level status
   - **Public Infobanjir Alerts:** Official river and rainfall warnings
   - **METMalaysia:** Live weather warnings and forecast data
   - **NADMA:** National disaster management information, when active alerts are available
   - **Backend location mapping:** Stored city and station coordinates

**Data Flow**
React Frontend
   ↓
Express Backend API
   ↓
Live Data Services
   ↓
Gemini AI Summary
   ↓
Frontend Dashboard

## Local Setup & Installation

**1. Prerequisites**
- Node.js (v20+)
- MongoDB (Local instance or Atlas cluster)
- Google Gemini API Key

**2. Environment Variables**
(For **backend/.env**, copy-paste this into .env file, if don't have one in backend folder, create one)
**`backend/.env`**
```env
GEMINI_API_KEY=AQ.Ab8RN6K_5qRECqrjlD5y34T59BgsfMv4DyDt6LVUd83MHgIHHg
GEMINI_MODEL=gemini-2.5-flash
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/floodalert
APP_NAME=FloodAlert

EMAIL_USER=floodalertofficial@gmail.com
EMAIL_APP_PASSWORD=eyif zdre qwmm pyzr
EMAIL_FROM=floodalertofficial@gmail.com
```

(For **frontend/.env**, copy-paste this into .env file, if don't have one in frontend folder, create one)
**`frontend/.env`** 
```env
VITE_API_BASE_URL=https://floodalert-backend-246006107681.asia-southeast1.run.app
```

### 3. MongoDB Setup
You can either install MongoDB locally or use a free cluster on MongoDB Atlas. 
- If running locally, ensure the MongoDB service is running before starting the backend.
- If using Atlas, replace the `MONGODB_URI` in your `.env` file with your cluster's connection string. The database will be created automatically upon connection.

### 4. Running the Backend
```bash
cd (other folder)/floodalert/backend
npm install
npm run dev
```
*The backend will start on `http://localhost:5000`.*

### 5. Running the Frontend
```bash
cd (other folder)/floodalert/frontend
npm install
npm run dev
```
The frontend will start on a local Vite port, usually `http://localhost:5173`.

### 6. Quick Local Checklist
Before opening the app locally, make sure:
- MongoDB is running
- `backend/.env` exists with your own values
- `frontend/.env` or `frontend/.env.local` points to `http://localhost:5000`
- the backend is running before the frontend tries to fetch live data

## Google Cloud Run Deployment

The backend includes a `Dockerfile` and is fully configured for Cloud Run deployment.

1. Install the Google Cloud SDK (`gcloud`).
2. Authenticate and select your Google Cloud project.
3. Deploy the backend from the `backend/` directory:
   ```bash
   cd (other folder)/floodalert/backend
   gcloud run deploy floodalert-backend \
     --source . \
     --set-env-vars="PORT=5000,MONGODB_URI=your_prod_mongo_uri,GEMINI_API_KEY=your_gemini_key,EMAIL_USER=your_email,EMAIL_APP_PASSWORD=your_password,EMAIL_FROM=your_email,APP_NAME=FloodAlert" \
     --allow-unauthenticated
   ```
4. Update the frontend's `.env` variable `VITE_API_BASE_URL` with the newly generated Cloud Run URL, then build and deploy the frontend to your preferred static host (e.g., Firebase Hosting, Vercel).

## AI Integration Explanation

FloodAlert uses the `gemini-1.5-flash-latest` model to act as a public safety communicator. The Express backend aggregates complex, raw telemetry data from multiple meteorological endpoints and passes it to the Gemini API with a strict system instruction. The AI processes the hydrological thresholds and returns a structured JSON payload containing a clear `status`, `reason`, and actionable `userSummary`, ensuring residents don't need to interpret raw data graphs during an emergency.

---

## AI / Code Tool Disclosure

In accordance with hackathon rules, we disclose the use of the following tools:
- **Google AI Studio:** Used to test, refine, and perfect the Gemini prompt for flood risk analysis.
- **Antigravity:** Used as the primary agentic coding assistant to accelerate development, implement the AI layer integrations, establish the Express/React boilerplate, format components, and prepare the project for a production Cloud Run environment.

---

## Known Limitations

- **Scraping Dependency:** The backend currently relies on web scraping or unofficial endpoints for some government data. If the government site structure changes, the data fetching logic may temporarily break.
- **Rate Limiting:** Free-tier Gemini API usage may hit rate limits during a massive surge of simultaneous users. 

## Future Improvements

- **Push Notifications:** Implement Firebase Cloud Messaging (FCM) to push SMS and mobile notifications to users when their specific district hits a "Warning" or "Evacuate" status.
- **Historical Data Trends:** Use Gemini to analyze historical flooding patterns and predict future high-risk zones based on incoming monsoon trajectories.
- **Crowdsourced Reports:** Allow verified users to upload photos of local water levels to supplement official telemetry data.

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

