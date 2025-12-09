# 🎬 SceneStack

> *Tracking the shows you’ll definitely finish… eventually… probably not.*

A personal movie & TV show tracker with a gorgeous glassmorphic UI. Yes, it's *another* media tracking app — the "TODO list" of MERN stack projects.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)

> 🎓 **Learning Project** — This is my playground for learning the MERN stack (MongoDB, Express, React, Node.js), TypeScript, and modern web development.

---

## ✨ Features

- 🔍 **Search** movies & TV shows via TMDB
- 📺 **Track episodes** - mark individual episodes as watched
- 📊 **Statistics** - see exactly how much of your life you've spent watching 
- 🏷️ **Tags** - organize your chaos with custom tags (Still WIP)
- 🎯 **Recommendations** - discover what to watch next
- ☁️ **Real-time sync** - your watchlist lives in the cloud, access from anywhere
- 🔔 **Notifications** - get alerted when new episodes drop (WIP — TMDB doesn't have a notifications API, so I'm currently negotiating with their servers to not rate-limit me into oblivion)
- 🌙 **Dark mode only** - because we're civilized

---

## 🗂️ Project Structure

```
SceneStack/
├── cinetrack-app/          ← The actual app lives here
│   ├── client/             ← React frontend (Vite + TypeScript)
│   ├── server/             ← Express backend (Node.js)
│   └── package.json        ← Monorepo root
└── README.md               ← You are here
```

### "Why is there a `cinetrack-app` folder inside `SceneStack`?"

Ah yes, the elephant in the repo. 🐘

**The honest answer:** This project started as CineTrack before being renamed. The folder structure is a happy accident that became permanent. By the time I realized the mistake, I had already pushed commits and... well... here we are.

**The professional answer:** It's a deliberate architectural decision to support future multi-app monorepo expansion. *\*adjusts imaginary glasses\**

**TL;DR:** It's technical debt I've learned to love. Like that one weird bug that somehow makes everything work.

---

## 🏗️ Why a Monorepo?

The frontend and backend are in the same repository because:

1. **Shared deployment** - One push, both deploy. Render loves it. I love it. Everyone's happy.
2. **Atomic commits** - Change the API and the frontend together. No more "which version is this compatible with?"
3. **Simplicity** - It's just me here.

---

## 🚀 Getting Started

### 🇮🇳 Important Note

> **Plot twist:** The app will NOT work in India unless you set a custom DNS. TMDB is blocked on Jio (Not tested other ISP's), for reasons known only to Jio, who apparently thinks a harmless movie database is more dangerous than the thousands of scam sites that load instantly when you misspell “gmail.”

**The fix:** Use a custom DNS provider. 
- [Cloudflare DNS](https://1.1.1.1/) — `1.1.1.1`
- [Google DNS](https://developers.google.com/speed/public-dns) — `8.8.8.8`
- [NextDNS](https://nextdns.io/) — for the privacy-conscious
- [AdGuard DNS](https://adguard-dns.io/) — blocks ads too

Set it on your router, device, or browser, and you're good to go. Welcome to the internet, the way it was meant to be.

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- TMDB API key ([get one here](https://www.themoviedb.org/settings/api))

### Setup

```bash
# Clone the repo
git clone https://github.com/Alameen1433/SceneStack.git
cd SceneStack/cinetrack-app

# Install dependencies
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..

# Set up environment variables
cp server/.env.example server/.env
# Edit server/.env with your MongoDB URI, JWT secret, and TMDB API key

cp client/.env.example client/.env
# Edit client/.env with your TMDB read access token

# Run both frontend and backend
npm run dev
```

### Environment Variables

**Server** (`cinetrack-app/server/.env`):
```env
# MongoDB connection string (required)
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/scenestackDB

# JWT secret for token signing (required)
JWT_SECRET=your-super-secret-jwt-key

# Comma-separated invite codes for registration 
INVITE_CODES=SCENESTACK2024,YOURCODE

# Server port (optional, default: 3001)
PORT=3001
```

**Client** (`cinetrack-app/client/.env`):
```env
# TMDB API Read Access Token (required)
VITE_TMDB_API_READ_ACCESS_TOKEN=your_tmdb_read_access_token
```

---

## 📡 Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| Frontend | React 19 + TypeScript | Because I like my errors at compile time |
| Styling | Tailwind CSS | `className` that goes on for three lines |
| Build | Vite | Fast. Really fast. Like, make-webpack-look-like-a-sloth fast. |
| Backend | Express.js | Simple, battle-tested, no surprises |
| Real-time | Socket.IO | So your watchlist syncs faster than you can say "just one more episode" |
| Database | MongoDB Atlas | JSON in, JSON out. No ORM drama. |
| Auth | JWT + bcrypt | Stateless sessions, hashed passwords |
| API | TMDB | The real MVP of this project |

---

## 🎨 Screenshots

*Coming soon*

---

## 🤝 Contributing

This is a personal project, but if you want to:

1. Fork it
2. Create a branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

MIT - Do whatever you want, just don't blame me if it breaks.

---

## 🙏 Acknowledgments

- [TMDB](https://www.themoviedb.org/) - For the incredible API
- [Claude](https://www.anthropic.com/claude/opus) - guiding me through bugs that felt personally offended by my existence.
- My watchlist - For being eternally long and inspiring this project

---

<p align="center">
  <sub>Built with 💜 and an unhealthy amount of TypeScript<a href="https://github.com/Alameen1433">  - My Github</a></sub>
</p>
