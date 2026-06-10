---
description: Start local development server for Cap Craft Hub
---
1. Ensure you have Node.js (v18 or later) and npm installed.
2. Open a terminal in the project root directory.
3. Install project dependencies:
   ```
   npm install
   ```
4. Copy the example environment file and fill in required variables (Firebase config, etc.):
   ```
   cp .env.example .env
   ```
   Edit `.env` with your Firebase credentials.
5. Run the development server:
   // turbo
   ```
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.
6. Open the URL in your browser to verify the app loads.
