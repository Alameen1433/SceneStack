# SceneStack

> A modern full-stack web application for tracking movies and TV shows. Built as a learning project to explore the MERN stack, TypeScript, real-time communication, and scalable application architecture.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)
![Redis](https://img.shields.io/badge/Redis-Upstash-DC382D?logo=redis)

**Learning Project** — This application was developed to gain hands-on experience with modern web development technologies and architectural patterns including RESTful APIs, real-time synchronization, client-side routing, state management, and responsive design.

---

## Features

**Core Functionality**
- Full-text search for movies and TV shows powered by TMDB API
- Episode-level tracking for TV series with season/episode granularity
- Personal watchlist with status management (watching, completed, planned)
- Custom tagging system for content organization
- Personalized recommendations based on viewing history
- Cloud-synchronized data with real-time updates across devices

**Analytics & Insights**
- Viewing statistics dashboard with time tracking
- Completion rate and binge-level metrics
- Genre analysis and taste profiling
- Visual progress indicators

**User Experience**
- Dark-themed glassmorphic UI with smooth animations
- Fully responsive design (mobile-first approach)
- Client-side routing with browser history integration
- Optimistic UI updates with conflict resolution

**Security & Performance**
- JWT-based authentication with HTTP-only cookies
- Server-side TMDB API proxy (prevents exposed API keys)
- Redis-based response caching with configurable TTL
- Rate limiting and request throttling
- Deferred rendering for heavy computations

**Work in Progress**
- Episode release notifications (currently exploring TMDB's content update API patterns)

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (React SPA)                   │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │  React Router│  │   Zustand   │  │  Socket.IO Client│   │
│  │  (SPA Routes)│  │(State Mgmt) │  │  (Real-time Sync)│   │
│  └──────────────┘  └─────────────┘  └──────────────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS/WSS
┌─────────────────────────┴───────────────────────────────────┐
│                    Express.js Server (Node.js)               │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │ Auth         │  │  Watchlist  │  │   TMDB Proxy     │   │
│  │ Middleware   │  │  Routes     │  │   (Server-side)  │   │
│  └──────────────┘  └─────────────┘  └──────────────────┘   │
│  ┌──────────────┐  ┌─────────────┐                         │
│  │ Socket.IO    │  │  Redis      │                         │
│  │ Server       │  │  Cache      │                         │
│  └──────────────┘  └─────────────┘                         │
└─────────────────────────┬───────────────────┬───────────────┘
                          │                   │
                 ┌────────┴────────┐   ┌──────┴──────┐
                 │  MongoDB Atlas  │   │ TMDB API    │
                 │  (Database)     │   │ (External)  │
                 └─────────────────┘   └─────────────┘
```

### Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19 + TypeScript |
| **Routing** | React Router v7 |
| **State Management** | Zustand |
| **Styling** | Tailwind CSS 4 |
| **Build Tool** | Vite 7 |
| **Backend** | Express.js 4 |
| **Real-time** | Socket.IO |
| **Database** | MongoDB Atlas |
| **Caching** | Redis (Upstash) |
| **Authentication** | JWT + bcrypt |
| **External API** | TMDB API v3 |

### Key Architectural Decisions

**Monorepo Structure**
- Client and server share a workspace for atomic commits and coordinated deployment
- Single build process compiles React app and serves it via Express in production

**State Management Evolution**
- Migrated from React Context to Zustand for better render optimization
- Implemented selector hooks to prevent unnecessary re-renders
- Deferred heavy computations with React 18's `useDeferredValue`

**API Design**
- Server-side TMDB proxy eliminates client-side API key exposure
- Redis caching reduces external API calls by ~85% (configurable TTL per endpoint)
- LRU eviction for high-volume endpoints (search, details, recommendations)

**Real-time Synchronization**
- Socket.IO broadcasts watchlist changes to all user sessions
- Optimistic UI updates with server confirmation
- Conflict resolution on concurrent modifications

**Performance Optimizations**
- Route-based code splitting with React lazy loading
- Manual chunk splitting (React vendor, Socket.IO, libraries)
- Debounced search with abort controller for in-flight requests
- Image lazy loading with intersection observer

---

## Project Structure

```
SceneStack/
├── cinetrack-app/              # Monorepo root
│   ├── client/                 # React frontend
│   │   ├── src/
│   │   │   ├── components/     # Reusable UI components
│   │   │   ├── contexts/       # React contexts (Auth, UI, Discover)
│   │   │   ├── layouts/        # Layout components (RootLayout)
│   │   │   ├── pages/          # Route-level page components
│   │   │   ├── services/       # API client layer
│   │   │   ├── store/          # Zustand stores
│   │   │   ├── types/          # TypeScript type definitions
│   │   │   ├── router.tsx      # Route configuration
│   │   │   └── App.tsx         # Root component
│   │   ├── package.json
│   │   └── vite.config.ts
│   ├── server/                 # Express backend
│   │   ├── src/
│   │   │   ├── config.js       # Environment config & Redis init
│   │   │   ├── middleware/     # Error handling, validation
│   │   │   ├── routes/         # API route handlers
│   │   │   │   ├── authRoutes.js
│   │   │   │   ├── watchlistRoutes.js
│   │   │   │   └── tmdbRoutes.js
│   │   │   ├── schemas/        # Zod validation schemas
│   │   │   └── server.js       # Express app entry point
│   │   └── package.json
│   ├── package.json            # Workspace root (npm workspaces)
│   └── Dockerfile              # Multi-stage production build
└── README.md                   # This file
```

**Note on Naming**: The `cinetrack-app` directory exists as a historical artifact from the project's original name. While the project is now branded as SceneStack, the internal folder structure remains unchanged. This is a deliberate decision—renaming would require updating import paths, deployment configurations, and version control history. Sometimes technical debt is best left untouched.

---

## Getting Started

### Prerequisites

- **Node.js** 18 or higher
- **MongoDB Atlas** account (or local MongoDB instance)
- **TMDB API** Read Access Token ([get one here](https://www.themoviedb.org/settings/api))
- **Redis** instance (optional but recommended — Upstash free tier works well)

### Important Note

TMDB API endpoints are blocked by some Indian ISPs (particularly Jio). If you encounter connection errors, configure a custom DNS provider:

- **Cloudflare DNS**: `1.1.1.1` / `1.0.0.1`
- **Google DNS**: `8.8.8.8` / `8.8.4.4`
- **Quad9 DNS**: `9.9.9.9`

Configure DNS at the router level, operating system network settings, or browser level (Firefox, Edge support DNS over HTTPS).

### Local Development Setup

```bash
# Clone the repository
git clone https://github.com/Alameen1433/SceneStack.git
cd SceneStack/cinetrack-app

# Install all dependencies (uses npm workspaces)
npm install

# Configure server environment
cp server/.env.example server/.env
# Edit server/.env with your credentials (MongoDB URI, JWT secret, etc.)

# Configure client environment (optional - only needed if using client-side fallback)
cp client/.env.example client/.env
# Edit client/.env with your TMDB token
```

### Running in Development Mode

The application requires two processes: the Express backend and the Vite dev server. Run in separate terminals:

```bash
# Terminal 1: Start the backend server (http://localhost:3001)
npm run dev:server

# Terminal 2: Start the frontend dev server (http://localhost:5173)
npm run dev:client
```

The Vite dev server proxies API requests to the backend automatically (configured in `client/vite.config.ts`).

### Development with Docker (Optional)

For local development, you can use Docker Compose to run MongoDB and Redis locally instead of using cloud services.

**Start local services:**
```bash
cd cinetrack-app/infra
docker-compose up -d
```

This starts:
- **MongoDB** on `localhost:27017` (data persisted in `infra/data/mongo`)
- **Redis** on `localhost:6379` (data persisted in `infra/data/redis`)

**Update your `.env` file:**
```bash
# Use local MongoDB instead of Atlas
MONGO_URI=mongodb://localhost:27017/scenestackDB

# Use local Redis instead of Upstash
REDIS_URL=redis://localhost:6379
```

**Stop services:**
```bash
docker-compose down
```

**Note**: The `Dockerfile` in the project root is for production deployment, not local development. It uses a multi-stage build to compile the React app and create a minimal production image.

### Production Deployment

The application is designed to run as a monolithic deployment where Express serves both the API and the compiled React frontend.

**Build Process:**
1. `npm run build` compiles the React app to `client/dist/`
2. `npm start` runs the Express server which serves `client/dist/` as static files

**General Deployment Configuration:**
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Root Directory**: `cinetrack-app`
- **Node Version**: 18 or higher

**Platform-Specific Examples:**

<details>
<summary><strong>Render</strong></summary>

1. Create a new **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Root Directory**: `cinetrack-app`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Add environment variables (see below)
5. Deploy
</details>

<details>
<summary><strong>AWS Elastic Beanstalk</strong></summary>

1. Package the `cinetrack-app` directory
2. Create a Node.js environment
3. Configure `npm start` as the start command
4. Ensure `npm run build` runs before application start (use `.ebextensions` if needed)
5. Set environment variables via EB configuration
</details>

<details>
<summary><strong>Railway / Heroku</strong></summary>

1. Connect repository
2. Set root directory to `cinetrack-app`
3. Railway auto-detects the build process
4. Add environment variables via dashboard
</details>

---

## Environment Variables

### Server (`cinetrack-app/server/.env`)

```bash
# MongoDB connection string (required)
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/scenestackDB

# JWT secret for token signing (required)
# Generate a secure secret: https://jwtsecrets.com/#generator
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Comma-separated invite codes (required)
INVITE_CODES=SCENESTACK2024,FRIEND2024

# TMDB API Read Access Token (required)
TMDB_API_READ_ACCESS_TOKEN=your_tmdb_read_access_token

# Redis connection string (optional - caching disabled if not set)
REDIS_URL=rediss://default:password@instance.upstash.io:6379

# Server port (optional, default: 3001)
PORT=3001

# Demo mode settings (optional)
DEMO_CODE=DEMONOW
DEMO_TTL_SECONDS=14400
```

### Client (`cinetrack-app/client/.env`)

```bash
# TMDB Read Access Token (optional - used as fallback if backend proxy fails)
VITE_TMDB_API_READ_ACCESS_TOKEN=your_tmdb_read_access_token

# API base URL (leave empty in production)
VITE_API_BASE_URL=
```

**Note**: In production, the client should rely exclusively on the server-side TMDB proxy. The client-side token is only used as a fallback during development or if the proxy endpoint is unreachable.

---

## API Documentation

### Authentication Endpoints

**POST** `/api/auth/register`
- Registers a new user with invite code
- **Body**: `{ username, password, inviteCode }`
- **Response**: `{ user, token }`

**POST** `/api/auth/login`
- Authenticates user and returns JWT
- **Body**: `{ username, password }`
- **Response**: `{ user, token }`

### Watchlist Endpoints

**GET** `/api/watchlist`
- Retrieves user's complete watchlist
- **Auth**: Required
- **Response**: `{ watchlist: WatchlistItem[] }`

**PUT** `/api/watchlist/:id`
- Updates or creates a watchlist item
- **Auth**: Required
- **Response**: `{ item: WatchlistItem }`

**DELETE** `/api/watchlist/:id`
- Removes an item from the watchlist
- **Auth**: Required
- **Response**: `{ success: boolean }`

### TMDB Proxy Endpoints

**GET** `/api/tmdb/discover`
- Fetches trending, popular movies, and popular TV shows
- **Cache**: 6 hours

**GET** `/api/tmdb/search?q=<query>`
- Searches for movies and TV shows
- **Cache**: 1 hour (LRU, max 1000 entries)

**GET** `/api/tmdb/details/:type/:id`
- Fetches detailed information for a movie or TV show
- **Cache**: 1 hour (LRU, max 500 entries)

---

## Learning Outcomes

This project served as a comprehensive learning experience covering:

**Frontend Development**
- Advanced React patterns (lazy loading, code splitting, render optimization)
- TypeScript integration in a large-scale application
- State management evolution (Context → Zustand)
- Client-side routing with React Router v7
- CSS-in-JS to utility-first CSS migration
- Animation with Framer Motion

**Backend Development**
- RESTful API design and authentication
- MongoDB schema design for flexible document structures
- Redis caching strategies (LRU eviction, TTL management)
- Socket.IO for real-time bidirectional communication
- Input validation with Zod schemas
- Error handling middleware patterns

**DevOps & Deployment**
- Monorepo management with npm workspaces
- Docker multi-stage builds
- Environment-based configuration
- Production optimization (minification, compression, caching headers)

**Software Engineering**
- Refactoring legacy code (migration from Context to Zustand)
- Performance profiling and optimization
- Security best practices (secret management, input sanitization)
- API rate limiting and quota management

---

## Known Issues & Future Improvements

**Current Limitations**
- Episode release notifications are not yet functional (TMDB doesn't provide a webhooks API; polling is being considered)
- Tag filtering UI needs refinement for large tag collections
- No offline support (service worker implementation planned)

---

## Contributing

This is a personal learning project, but contributions are welcome. If you'd like to contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit changes with descriptive messages
4. Push to your fork (`git push origin feature/your-feature`)
5. Open a Pull Request with a clear description

---

## License

MIT License - See [LICENSE](LICENSE) for details

---

## Acknowledgments

- **TMDB** for providing a comprehensive and well-documented API
- **MongoDB Atlas** for generous free-tier hosting
- **Upstash** for serverless Redis
- **Claude** for serving as a tireless pair programmer and debugging companion

---

<p align="center">
  <sub>Built with 💜 and an unhealthy amount of TypeScript</sub>
</p>
