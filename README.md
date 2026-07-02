# ⚔️ ARENA CLASH — Multiplayer Browser Arena

A real-time multiplayer top-down arena brawler playable on PC, Android, iPhone, and tablets.

## 🎮 Features

- **Real-time Multiplayer** — Fight other players in real-time via WebSocket
- **3 Characters** — Gopnik (melee), Armor (ranged), Godzilla (AoE)
- **Authoritative Server** — All game logic runs on the server (anti-cheat)
- **Client Prediction** — Instant input response with server reconciliation
- **Cross-Platform** — PC (WASD + mouse) and Mobile (virtual joystick + button)
- **Beautiful UI** — Glassmorphism design, animated backgrounds, particle effects
- **Procedural Assets** — All sprites and sounds generated dynamically (no external files)

## 🏗️ Architecture

```
Frontend (Vercel)          Backend (Render.com)
┌───────────────┐          ┌────────────────────┐
│  Phaser 3     │◄────────►│  Node.js + Express │
│  + Socket.IO  │ WebSocket│  + Socket.IO       │
│  Client       │          │  + Game Loop (20Hz)│
└───────────────┘          └────────────────────┘
```

- **Frontend**: HTML5 + CSS3 + JavaScript ES6+ with Phaser 3 game engine
- **Backend**: Node.js + Express + Socket.IO authoritative game server
- **Protocol**: WebSocket (real-time bidirectional)

## 📁 Project Structure

```
game/
├── frontend/                 # Static files → Deploy to Vercel
│   ├── index.html            # Entry point
│   ├── css/styles.css        # Glassmorphism UI
│   ├── js/
│   │   ├── main.js           # Phaser boot + DOM UI controller
│   │   ├── config/           # Game & character configuration
│   │   ├── scenes/           # Phaser scenes (Boot, Menu, CharSelect, Game, HUD)
│   │   ├── entities/         # Player, RemotePlayer, Projectile
│   │   ├── systems/          # Input, MobileControls, Particles
│   │   ├── network/          # NetworkManager, Interpolation, Prediction
│   │   ├── audio/            # Web Audio API synthesized sounds
│   │   └── utils/            # ObjectPool, SpatialHash, helpers
│   └── vercel.json           # Vercel deployment config
│
├── backend/                  # Node.js server → Deploy to Render
│   ├── src/
│   │   ├── server.js         # Express + Socket.IO entry point
│   │   ├── game/             # GameLoop, GameState, PlayerState, CombatSystem
│   │   ├── physics/          # CollisionEngine, SpatialGrid
│   │   ├── network/          # SocketHandler, AntiCheat, MessageProtocol
│   │   ├── config/           # Server config + character stats
│   │   └── utils/            # Server utilities
│   └── package.json
│
└── README.md
```

---

## 🚀 Local Development

### Prerequisites
- **Node.js** v18+ (recommended: v20 LTS)
- Any static file server for frontend (or use `npx serve`)

### Step 1: Start the Backend

```bash
cd backend
npm install
npm run dev
```

The server will start at `http://localhost:3000`.
You should see:

```
═══════════════════════════════════════════
  ARENA CLASH — Game Server
  Port: 3000
  Tick Rate: 20 Hz
  Map: 3200×2400
═══════════════════════════════════════════
[GameLoop] Starting at 20 Hz
```

### Step 2: Start the Frontend

```bash
cd frontend
npx -y serve -l 8080
```

Or use VS Code Live Server, Python `http.server`, or any static file server.

### Step 3: Play!

Open `http://localhost:8080` in your browser.

To test multiplayer, open multiple browser tabs.

---

## 🌐 Deployment Guide

### Backend → Render.com (Free)

#### 1. Prepare your code

Push the `backend/` folder to a GitHub repository (or the entire project).

#### 2. Create Render account

Go to [render.com](https://render.com) and sign up (free).

#### 3. Create a new Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `arena-clash-server`
   - **Root Directory**: `backend` (if monorepo)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

#### 4. Set Environment Variables

In the Render dashboard → Environment:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | `https://your-app.vercel.app` |

> Replace `your-app.vercel.app` with your actual Vercel domain.

#### 5. Deploy

Click **"Create Web Service"**. Render will build and deploy.

Your server URL will be: `https://arena-clash-server.onrender.com`

> ⚠️ **Note**: Free tier spins down after 15 minutes of inactivity. First connection after sleep takes 30-60 seconds.

---

### Frontend → Vercel (Free)

#### 1. Update server URL

In `frontend/js/config/gameConfig.js`, update the production server URL:

```javascript
SERVER_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://arena-clash-server.onrender.com', // ← Your Render URL
```

#### 2. Create Vercel account

Go to [vercel.com](https://vercel.com) and sign up (free).

#### 3. Import project

1. Click **"Add New..."** → **"Project"**
2. Import from GitHub
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Other`
   - **Build Command**: (leave empty — static files)
   - **Output Directory**: `.` (current directory)

#### 4. Deploy

Click **"Deploy"**. Vercel will serve your static files.

Your game URL will be: `https://your-app.vercel.app`

#### 5. Update Render CORS

Go back to Render dashboard → Environment Variables:
Set `CORS_ORIGIN` to `https://your-app.vercel.app`

---

## 🎯 Game Controls

### PC
| Key | Action |
|-----|--------|
| W/A/S/D | Movement |
| Left Mouse Button | Attack |
| ESC | Menu |

### Mobile
| Control | Action |
|---------|--------|
| Left Joystick | Movement |
| Right Button | Attack |

---

## ⚔️ Characters

### 🔪 Гопник (Gopnik) — Melee
- **HP**: 100 | **Speed**: Fast | **Damage**: 35
- Close-range knife strikes with fast cooldown (0.4s)
- High speed for gap-closing

### 🔫 Армор (Armor) — Ranged
- **HP**: 120 | **Speed**: Slow | **Damage**: 50
- Long-range cannon shot with high damage
- 5-second reload between shots

### 🔥 Годзилла (Godzilla) — AoE
- **HP**: 150 | **Speed**: Slowest | **Damage**: 30
- Fire breath hits all enemies in a 60° cone
- 2-second reload, highest HP

---

## 🔧 Technical Details

### Server Architecture
- **Tick Rate**: 20 Hz (50ms per tick)
- **Authoritative**: Server controls all gameplay (movement, damage, cooldowns)
- **Anti-Cheat**: Input validation, speed checks, cooldown enforcement
- **Collision**: AABB + Circle collision with spatial partitioning

### Client Architecture
- **Renderer**: Phaser 3 (v3.90.0) with Canvas/WebGL
- **Prediction**: Client-side prediction with server reconciliation
- **Interpolation**: 100ms buffer for smooth remote player movement
- **Particles**: Custom particle system with object pooling
- **Audio**: Web Audio API synthesized sounds (no file downloads)

### Network Protocol
- **Transport**: WebSocket via Socket.IO
- **Input**: Client sends direction + attack (20 Hz)
- **State**: Server broadcasts full snapshot (20 Hz)
- **Ping**: Measured every 2 seconds
- **Reconnection**: Auto-reconnect with exponential backoff

---

## 📋 Future Roadmap

The architecture supports easy addition of:
- [ ] New characters
- [ ] New maps
- [ ] Special abilities
- [ ] Chat system
- [ ] Friends & rooms
- [ ] Rating/leaderboard
- [ ] Shop & inventory
- [ ] Battle pass
- [ ] Clans
- [ ] User authentication
- [ ] Progress saving

---

## 📜 License

MIT License
#   g a m e  
 