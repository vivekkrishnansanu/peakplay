# PlayIt 🎵

**Auto-plays the most-replayed peak moment of trending songs — hands-free.**

Pick a language. The app finds the best 30 seconds (your choice) of trending songs and plays them one after another with smooth fades. Zero interaction needed.

---

## Tech Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** — mobile-first, responsive
- **YouTube IFrame API** — official, free, ToS-compliant
- **YouTube Data API v3** — language-aware trending discovery

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Create .env.local with your API key
# (replace value)
cat > .env.local <<'EOF'
YOUTUBE_API_KEY=your_youtube_data_api_v3_key
EOF

# 3. Run dev server
npm run dev

# 4. Open in browser
http://localhost:3000
```

Open on your phone by connecting to the same Wi-Fi and visiting `http://<your-ip>:3000`.

---

## Project Structure

```
peakplay/
├── app/
│   ├── components/
│   │   ├── BgScene.tsx          # Dynamic blurred album art background
│   │   ├── DurationSlider.tsx   # Clip duration control (15s–60s)
│   │   ├── LanguageStrip.tsx    # Language chip selector
│   │   ├── LikedSongs.tsx       # Liked songs list
│   │   ├── PlayerCard.tsx       # Main player UI (thumbnail, progress, EQ)
│   │   └── Toast.tsx            # Notification toast
│   ├── data/
│   │   └── songs.ts             # ⭐ Song database with peak timestamps
│   ├── hooks/
│   │   └── usePlayer.ts         # All player logic (YouTube API, fades, queue)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                 # Main page
├── public/
│   └── manifest.json            # PWA manifest
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

---

## Song Source

Songs are fetched live from YouTube Data API v3 (no user login required):

- Endpoint: `search` + `videos`
- Category: `videoCategoryId=10` (Music)
- Region: chosen by selected language (currently `US` for English, `IN` for Indian languages)
- Language targeting: `q=<language songs>` + `relevanceLanguage=<lang-code>`
- Player skips already-seen IDs per language during the session (no repeat loop)

---

## Roadmap / Next Steps

- [ ] **Backend heatmap fetcher** — auto-extract better peak moments from watch analytics instead of random start point
- [ ] **Persist liked songs** — localStorage or a simple backend
- [ ] **Share clip** — share a direct link to the peak moment of a song
- [ ] **PWA icons** — add icon-192.png and icon-512.png to /public for home screen install

---

## Notes

- The YouTube IFrame API streams video — no downloading, fully ToS-compliant
- Works best in Chrome and Safari on mobile
- YouTube ads may appear depending on video/account/browser policy
