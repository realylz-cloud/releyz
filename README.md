# ⚡ Releyz — AI Sports Betting Intelligence

Full AI match context for every game across all major sports. Powered by Claude AI with real-time web search.

---

## 📁 File Structure

```
releyz/
├── index.html              ← App entry point
├── package.json            ← Dependencies
├── vite.config.js          ← Build config
├── vercel.json             ← Vercel routing config
├── .env.example            ← Environment variables template
├── src/
│   ├── main.jsx            ← React entry point
│   └── App.jsx             ← Main app (all pages + paywall)
└── api/
    ├── analyze.js          ← AI analysis (Anthropic API)
    ├── fixtures.js         ← Match data (API-Sports)
    └── subscribe.js        ← Payments (Stripe)
```

---

## 🚀 Deployment Steps

### 1. Add files to GitHub
Upload all files maintaining the folder structure above.

### 2. Connect to Vercel
- Go to vercel.com
- Click "Add New Project"
- Import your GitHub repository
- Framework preset: **Vite**
- Build command: `npm run build`
- Output directory: `dist`

### 3. Add Environment Variables in Vercel
Go to Project Settings → Environment Variables and add:

| Variable | Value |
|----------|-------|
| `ANTHROPIC_API_KEY` | Your key from console.anthropic.com |
| `API_SPORTS_KEY` | Your key from api-sports.io |
| `STRIPE_SECRET_KEY` | Your key from dashboard.stripe.com |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL (e.g. https://releyz.vercel.app) |

### 4. Deploy
Click Deploy. Your app will be live in ~2 minutes.

---

## 💰 Monetisation
- $9/month via Stripe subscription
- Users pay before accessing the app
- Unlimited analyses for paying members

---

## 🛠 Adding Features Later
- New sports/leagues: edit the `SPORTS` array in `App.jsx`
- New analysis types: edit `ANALYSIS_TYPES` in `App.jsx`
- Price change: update `unit_amount` in `api/subscribe.js` (in cents)
- New pages: add to the bottom nav and page router in `App.jsx`

---

## ⚠️ Disclaimer
Releyz is for entertainment and analytical purposes only.
Not financial advice. Always gamble responsibly.
