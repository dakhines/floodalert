# What is FloodAlert?

FloodAlert is an AI-assisted flood monitoring web app that helps users check flood risk for their location, check flood risk for other locations, and read latest flood-related updates.

## Problem

Flood information is often spread across multiple official sources, making it difficult for normal users to quickly understand whether their area is safe, at risk, or requires action.

## Solution

FloodAlert combines live flood-related sources with Gemini AI powered (Google AI Studio) summarisation to present clear flood status, recommended action, and latest updates in a user-friendly interface

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

Choose **one** frontend option below depending on how you want to run the app.

### Option A: Full Local Development
Use this when running both the backend and frontend on your own machine.

(For **backend/.env**, copy-paste this into a `.env` file. If you do not have one in the backend folder, create it.)
**`backend/.env`**
```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/floodalert
APP_NAME=FloodAlert

EMAIL_USER=your_email@example.com
EMAIL_APP_PASSWORD=your_email_app_password
EMAIL_FROM=your_email@example.com
```

(For **frontend/.env**, copy-paste this into a .env file. If you do not have one in the frontend folder, create it.)
**`frontend/.env`**
```env
VITE_API_BASE_URL=http://localhost:5000
```

### Option B: Local Frontend + Deployed Backend
Use this when you want to run only the frontend locally and connect it to the hosted backend.

(For **frontend/.env**, copy-paste this into a .env file. If you do not have one in the frontend folder, create it.)
**`frontend/.env`**
```env
VITE_API_BASE_URL=https://floodalert-backend-246006107681.asia-southeast1.run.app
```
**Note**: In this option, you do not need to run the backend locally, so backend/.env is not required.

**However, for judges, Option B is recommended** because it runs the app with the hosted backend and does not require local backend credentials.


### 3. MongoDB Setup

This step is only required for **Option A: Full Local Development**.

You can either install MongoDB locally or use a free cluster on MongoDB Atlas.

- If running locally, make sure the MongoDB service is running before starting the backend.
- If using Atlas, replace the `MONGODB_URI` value in `backend/.env` with your cluster connection string.
- The database will be created automatically when the backend connects to MongoDB.

**How to install MongoDB locally**
1. Go to the MongoDB [Community Server download page](https://www.mongodb.com/try/download/community).
2. Download and install MongoDB Community Server.
3. Complete the installation steps.
4. Make sure the MongoDB service is running before starting the backend.

**How to set up MongoDB Atlas**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free account or sign in.
3. Create a new cluster.
4. Choose the free tier if available.
5. After the cluster is ready, click **Connect**.
6. Choose **Connect your application**.
7. Copy the connection string.
8. Replace the `MONGODB_URI` value in `backend/.env` with that connection string.


### 4. Running the Backend
```bash
cd path/to/floodalert/backend
npm install
npm run dev
```
*The backend will start on `http://localhost:5000`.*

### 5. Running the Frontend
```bash
cd path/to/floodalert/frontend
npm install
npm run dev
```
The frontend will start on a local Vite port, usually `http://localhost:5173`.

### 6. Quick Local Checklist

**For Option A: Full Local Development**
- MongoDB is running
- `backend/.env` exists with your own values
- `frontend/.env` or `frontend/.env.local` points to `http://localhost:5000`
- the backend is running before the frontend tries to fetch live data

**For Option B: Local Frontend + Deployed Backend**
- `frontend/.env` or `frontend/.env.local` points to your deployed backend URL
- you do not need to run MongoDB locally
- you do not need to run the backend locally

## Google Cloud Run Deployment

Both the backend and frontend were deployed using **Google Cloud Run** through the Google Cloud Console.

**Backend Deployment**
1. Open the Google Cloud Console and go to **Cloud Run**.
2. Create or select the backend service.
3. Choose the backend source for deployment.
4. Set the required environment variables:
   - `PORT`
   - `MONGODB_URI`
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL`
   - `EMAIL_USER`
   - `EMAIL_APP_PASSWORD`
   - `EMAIL_FROM`
   - `APP_NAME`
5. Allow unauthenticated access so the frontend can call the backend publicly.
6. After deployment, copy the generated backend service URL.

**Frontend Deployment**
1. Set `VITE_API_BASE_URL` to the deployed backend URL before deploying the frontend.
2. Open the Google Cloud Console and go to **Cloud Run**.
3. Create or select the frontend service.
4. Choose the frontend source for deployment.
5. Deploy the service and allow unauthenticated access.
6. After deployment, copy the generated frontend service URL and use it as the public app link.


## AI Integration Explanation

FloodAlert uses the `gemini-2.5-flash` model to act as a public safety communicator. The Express backend aggregates complex, raw telemetry data from multiple meteorological endpoints and passes it to the Gemini API with a strict system instruction. The AI processes the hydrological thresholds and returns a structured JSON payload containing a clear `status`, `reason`, and actionable `userSummary`, ensuring residents don't need to interpret raw data graphs during an emergency.

## AI / Code Tool Disclosure

In accordance with hackathon rules, we disclose the use of the following tools:
- **Google AI Studio:** Used to test, refine, and perfect the Gemini prompt for flood risk analysis.
- **Antigravity:** Used as the primary agentic coding assistant to accelerate development, implement the AI layer integrations, establish the Express/React boilerplate, format components, and prepare the project for a production Cloud Run environment.
- **Google Cloud Run:** Used to deploy both the backend and frontend applications, making them accessible publicly without requiring manual server management.