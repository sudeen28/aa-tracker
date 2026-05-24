# ✈ American Airlines Booking Tracker

A full-featured flight booking management portal built with React + Vite.

## Features
- PNR lookup with booking details
- Live departure countdown + check-in status
- Flight status alerts
- Real-time weather at LOS, LHR & JFK (Open-Meteo API)
- Live analog clocks for all airport timezones
- Interactive route map
- Seat map (Boeing 777 cabin layout)
- Baggage tracker timeline
- Layover info card with LHR tips
- Meal preference selector
- Special assistance requests
- Visa & entry requirements
- Scannable QR code on boarding pass
- Download boarding pass PDF
- Download full itinerary PDF
- Email itinerary
- Print view
- Dark mode

## Demo PNR
```
AA7X4K2
```

---

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Visit `http://localhost:5173`

---

## Deploy to Vercel

### Option 1 — Vercel CLI (fastest)
```bash
npm install -g vercel
vercel
```
Follow the prompts. Done — you get a live URL instantly.

### Option 2 — GitHub + Vercel Dashboard
1. Push this project to a GitHub repo
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/aa-tracker.git
git push -u origin main
```
2. Go to [vercel.com](https://vercel.com)
3. Click **Add New Project**
4. Import your GitHub repo
5. Leave all settings as default — Vite is auto-detected
6. Click **Deploy**

Your site will be live at `https://aa-tracker.vercel.app` (or similar).

---

## Deploy to Netlify (alternative)

```bash
npm run build
```
Then drag the `dist/` folder to [netlify.com/drop](https://app.netlify.com/drop)

---

## Project Structure

```
aa-tracker/
├── public/
│   └── favicon.svg
├── src/
│   ├── main.jsx        # React entry point
│   └── App.jsx         # Full application
├── index.html
├── vite.config.js
├── vercel.json
├── package.json
└── .gitignore
```

---

## Tech Stack
- React 18
- Vite 5
- jsPDF (boarding pass + itinerary PDF)
- QRCode.js (scannable QR)
- Open-Meteo API (live weather, free, no key needed)
- Canvas API (route map, analog clocks)
