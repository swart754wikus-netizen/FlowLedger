# FlowLedger

Premium finance SaaS for small businesses — cashflow, invoicing, expenses, VAT, and AI insights.

## Stack
Next.js 15 · React 19 · TypeScript · Tailwind · Firebase (Auth + Firestore) · Framer Motion · Recharts · Anthropic Claude

## Setup

1. **Create a Firebase project** at console.firebase.google.com
   - Enable Authentication > Email/Password and Google sign-in
   - Create a Firestore database (production mode)
   - Get your web app config from Project Settings > General

2. **Generate a service account key** for the Admin SDK
   - Project Settings > Service Accounts > Generate new private key

3. **Copy environment file**
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in all Firebase + Anthropic values.

4. **Deploy Firestore security rules**
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init firestore   # select your project, use existing firestore.rules
   firebase deploy --only firestore:rules
   ```

5. **Install and run**
   ```bash
   npm install
   npm run dev
   ```

6. Visit `http://localhost:3000` — landing page. Click "Start free trial" to register.

## Deploy
Push to GitHub, connect to Vercel, add all env vars from `.env.local`, deploy.

## Architecture notes
- All business data lives under flat Firestore collections (`invoices`, `expenses`, etc.) filtered by `businessId` field, enforced via `firestore.rules`.
- VAT calculations live in `lib/utils/vat.ts` — supports inclusive/exclusive/zero-rated/exempt per line item.
- AI features call `/api/ai/chat` and `/api/ai/insights`, both server-side routes using the Anthropic SDK — API key never reaches the client.
