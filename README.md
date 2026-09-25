# AUREVÉ — Your Wardrobe. Intelligently Styled.

**AUREVÉ** is a private AI-powered digital wardrobe and personal styling platform engineered specifically for modern Indian men's lifestyle and climates.

> **Styling Philosophy:** *Simple + Classy + Modern + Indian + Practical*  
> **Desired Reaction:** *“He dresses really well.”* — not *“He is trying too hard to look fashionable.”*

---

## 🌟 Core Features

1. **Private Digital Wardrobe:**
   - Strict user isolation with Row Level Security (RLS).
   - Organized into Myntra-style luxury garment boxes with clean aspect ratios, tags, wear counters, and status badges.
   - Categorized into Tops (Shirts, T-Shirts, Polos, Kurtas, Overshirts), Bottoms (Jeans, Trousers, Chinos, Shorts), Layers (Jackets, Sweaters), Footwear (Sneakers, Loafers, Kolhapuris, Boots), and Accessories (Watches, Belts, Sunglasses).

2. **AI Clothing Recognition:**
   - Computer vision analyzes photos to auto-detect category, subcategory, primary & secondary colors, fabric material, fit, style persona, and formality.
   - Full manual editability before saving.

3. **AI Outfit Reasoning Engine (Indian Context):**
   - Synthesizes user profile + complete active wardrobe + occasion + date/time + live weather forecast.
   - Reasons strictly using items the user **actually owns**.
   - Respects Indian weather (heat, humidity, monsoon) and cultural social expectations.
   - Provides concise "Why This Works" editorial reasoning and 2–3 curated alternative looks.

4. **Weather Intelligence:**
   - Integrated with Open-Meteo for real-time weather in Indian cities (Mumbai, Delhi NCR, Bengaluru, Hyderabad, Chennai, Kolkata, Pune, Jaipur, etc.).

5. **Smart Wardrobe Rotation & Feedback:**
   - Tracks garment wear counts and subtly surfaces underused pieces.
   - Feedback loop ("Loved it", "Too formal", "Very comfortable") refines future recommendations.

6. **Special Modes:**
   - **5-Min Quick Dress:** Instant high-confidence outfit assembly.
   - **Travel Mode:** Capsule packing planner with daily outfit itineraries and interactive packing checklist.
   - **Comfort Mode / Surprise Me:** Relaxes formal constraints for tailored comfort.

7. **Mobile-First & Laptop Optimized:**
   - High-end mobile navigation with floating action triggers and touch gestures.
   - Responsive multi-column layout for desktop and laptop screens.

---

## 🛠️ Technology Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Custom luxury editorial tokens, Cormorant Garamond & Plus Jakarta Sans typography)
- **Icons & Animations:** Lucide React & Framer Motion
- **Database & Auth:** PostgreSQL / Supabase with Row Level Security (with seamless standalone dev fallback)
- **Security:** 6-Digit PIN hashing via `bcryptjs`, JWT signed session cookies (`HS256` via `jose`), rate-limiting protection
- **AI Vision & Styling Engine:** Google Gemini Flash API with intelligent heuristic fallback
- **Weather API:** Open-Meteo free API (No API key required)

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure your environment variables:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=your_super_secret_jwt_encryption_key_here

# (Optional: If using Google Gemini AI for Vision & Reasoning)
GEMINI_API_KEY=your_gemini_api_key_here

# (Optional: If using Supabase for PostgreSQL & Storage)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> **Note:** AUREVÉ is equipped with an intelligent standalone in-memory repository and rule-based stylist fallback so that you can run and test the complete application immediately even without external database or AI keys configured!

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Supabase PostgreSQL Database Setup

If connecting to Supabase:
1. Create a new project in [Supabase](https://supabase.com/).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Paste and run the contents of [`src/lib/db/schema.sql`](file:///c:/Users/akshi/OneDrive/Desktop/Projects/Aureve-Styling%20Assistant/src/lib/db/schema.sql).
4. Copy your project URL and Service Role Key to `.env.local`.

---

## 🚢 Vercel Deployment Guide

1. Push your repository to **GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of AUREVÉ Web Application"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```
2. Go to [Vercel](https://vercel.com) and click **Add New Project**.
3. Import your GitHub repository.
4. Add the environment variables from your `.env.example`:
   - `JWT_SECRET`
   - `NEXT_PUBLIC_SUPABASE_URL` (if using Supabase)
   - `SUPABASE_SERVICE_ROLE_KEY` (if using Supabase)
   - `GEMINI_API_KEY` (if using Gemini AI)
5. Click **Deploy**.

---

## 🔒 Privacy & Security

- **Strict User Isolation:** All database queries require authenticated `userId` derived from server-side JWT session cookies.
- **PIN Hashing:** 6-digit PINs are hashed using `bcrypt` with salt rounds on the server. Raw PINs are never stored.
- **Rate-Limiting:** Brute force login attempts trigger a 15-minute cooldown.
