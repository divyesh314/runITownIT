# 🏃 RunOwn — Run It. Own It.

> **Claim territory by running through it. Defend it. Earn crypto. Be the king of your city.**

[![Status](https://img.shields.io/badge/status-prototyping-orange)]()
[![Stack](https://img.shields.io/badge/stack-Rails%20%7C%20React%20Native%20%7C%20Next.js%20%7C%20Polygon-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

---

## 🧠 What Is RunOwn?

RunOwn is a **location-based fitness app** that turns your runs into territorial conquests.

Every city is divided into a grid of territories. When you run through a territory, you **claim it as yours**. Someone else wants it? They challenge you to an **open race**. The winner owns it. Owning territories earns you **RunCoins** — a real ERC-20 token on the Polygon blockchain.

Think of it as:
- 🗺️ **Ingress / Pokémon GO** — but the gameplay is your actual run
- 🏃 **Strava** — but with competition, stakes, and rewards
- 🪙 **Web3** — but with a real physical activity as proof-of-work

No sitting at a desk clicking. You have to actually go outside and run.

---

## 🌍 The Core Loop

```
You run → You claim a territory → Someone challenges you → You race → Winner owns it → Owner earns RunCoins
```

That's it. Simple to understand, hard to dominate.

---

## 🗺️ How Territory Claiming Works

The city map is divided into **hexagonal zones** (think H3 grid). Each zone has:

- An **owner** (or is unclaimed)
- A **boundary** (GPS polygon)
- A **claim timestamp**
- A **RunCoin yield rate** (popular zones earn more)

To **claim** a zone, you run through it. The app tracks your GPS in real-time and validates that you physically passed through the zone boundary. Once validated, the zone is yours.

To **challenge** an owned zone, you issue a challenge to the current owner. Both runners complete the same route within a time window. Fastest verified time wins ownership.

---

## 🪙 RunCoin — The Reward Token

**RunCoin (RUN)** is an ERC-20 token deployed on the **Polygon network** (low gas fees, fast finality).

| Action | Reward |
|---|---|
| Claiming an unclaimed zone | 10 RUN |
| Winning a challenge | 25 RUN + opponent's stake |
| Holding a zone for 7 days | 5 RUN/day passive |
| Losing a challenge | Lose staked RUN |

RunCoins are **minted by the smart contract** on validated wins — not pre-mined, not pre-distributed. You earn them by running. Period.

---

## ⛏️ Opt-In Mining (Background, Throttled)

While you're on an active run, you can opt in to **background CPU mining** (CryptoNight algorithm). This is:

- **Opt-in only** — never hidden, never forced
- **Throttled to 20% CPU max** — won't kill your battery mid-run
- **Pooled to a treasury wallet** — mined BTC/ETH is converted to RunCoins and distributed

This is a secondary earning mechanism, not the core loop. Running fast and owning territory is always more valuable than mining.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   CLIENT LAYER                       │
│                                                      │
│  React Native App          Next.js Web              │
│  (iOS + Android)           (Dashboard + Landing)    │
│  - GPS tracking            - Leaderboards           │
│  - Map view                - Territory overview     │
│  - Challenge UI            - Wallet management      │
│  - Mining toggle           - Social feed            │
└──────────────────┬──────────────────────────────────┘
                   │ REST API + WebSocket (ActionCable)
┌──────────────────▼──────────────────────────────────┐
│                  BACKEND LAYER                       │
│                                                      │
│            Rails API (Dockerized)                   │
│                                                      │
│  Auth (Devise)     GPS Validation    Challenge Logic │
│  User Profiles     Territory CRUD    Run Verification│
│  Leaderboards      ActionCable       Reward Triggers │
│                                                      │
│              PostgreSQL (with PostGIS)               │
└──────────────────┬──────────────────────────────────┘
                   │ Web3 calls (Polygon RPC)
┌──────────────────▼──────────────────────────────────┐
│               BLOCKCHAIN LAYER                       │
│                                                      │
│            Polygon Network (Mumbai Testnet)         │
│                                                      │
│  RunCoin.sol (ERC-20)      Territory.sol (ERC-721)  │
│  - mint(winner, amount)    - tokenize territory     │
│  - transfer                - assign ownership       │
│  - stake/unstake           - royalties on trades    │
│                                                      │
│  GPS Oracle (Chainlink or custom HTTP oracle)       │
└─────────────────────────────────────────────────────┘
```

---

## 🧱 Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Mobile App | React Native + Expo | Cross-platform, Expo Location for GPS |
| Web Dashboard | Next.js | SSR for SEO, mirrors app screens |
| Backend API | Ruby on Rails | Mature, fast to build, ActionCable for real-time |
| Database | PostgreSQL + PostGIS | Spatial queries for GPS territory overlap |
| Real-time | ActionCable (WebSockets) | Live challenge notifications |
| Blockchain | Polygon (EVM) | Low gas fees, fast, EVM compatible |
| Smart Contracts | Solidity + OpenZeppelin | Industry standard, auditable |
| Wallet | MetaMask + Ethers.js | Standard Web3 wallet integration |
| Mining | CryptoNight (JS) | Opt-in, CPU-based, throttled |
| Maps | Leaflet + H3 (Uber) | Hexagonal grid for territory zones |
| DevOps | Docker + GitHub Actions | Containerised, CI/CD from day one |
| Deploy | Render (Rails) + Vercel (Next.js) + Expo | Managed, affordable |
| Monitoring | Sentry (free tier) | Error tracking across all services |

---

## 📁 Folder Structure

```
runown/
├── runown-backend/          # Rails API
│   ├── app/
│   │   ├── controllers/api/ # Territory, Challenge, Run, User controllers
│   │   ├── models/          # User, Territory, Run, Challenge
│   │   ├── services/        # GPSValidator, BlockchainService, MiningPool
│   │   └── channels/        # ActionCable: ChallengeChannel, NotificationChannel
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── spec/                # RSpec tests
│
├── runown-app/              # React Native (Expo)
│   ├── screens/
│   │   ├── MapScreen.js     # Territory map with Leaflet + H3
│   │   ├── RunScreen.js     # Active run tracker + GPS
│   │   ├── ChallengeModal.js
│   │   ├── LeaderboardScreen.js
│   │   └── WalletScreen.js  # RunCoin balance + history
│   ├── services/
│   │   ├── gps.js           # Expo Location wrapper
│   │   ├── mining.js        # CryptoNight throttled miner
│   │   └── web3.js          # Ethers.js wallet connection
│   └── __tests__/           # Jest tests
│
├── runown-web/              # Next.js web dashboard
│   ├── pages/
│   │   ├── index.js         # Landing page + waitlist
│   │   ├── map.js           # Territory overview
│   │   ├── leaderboard.js
│   │   └── wallet.js
│   └── Dockerfile
│
├── contracts/               # Solidity smart contracts
│   ├── RunCoin.sol          # ERC-20 token
│   ├── Territory.sol        # ERC-721 NFT ownership
│   ├── scripts/deploy.js    # Hardhat deploy scripts
│   └── test/                # Contract tests
│
└── .github/
    └── workflows/
        ├── backend.yml      # Rails CI: lint + RSpec
        ├── frontend.yml     # React CI: Jest + build
        └── contracts.yml    # Hardhat tests
```

---

## 🔄 End-to-End Flow: Claiming a Territory

Here is exactly what happens step by step when a user claims a territory:

```
1. User opens app → map loads with H3 hex grid overlay
2. User taps "Start Run" → GPS tracking begins (Expo Location)
3. App sends GPS pings to Rails API every 5 seconds
4. Rails GPSValidator checks: did user's path intersect territory boundary?
5. If YES → Rails creates a Run record, marks territory as "pending claim"
6. Rails calls BlockchainService → triggers RunCoin.sol mint(user_wallet, 10)
7. Polygon confirms transaction → Rails updates territory.owner = user
8. ActionCable pushes notification to all users watching that zone
9. User sees territory turn their colour on the map
10. Other users can now see "Owned by @divyesh" on that hex
```

---

## ⚔️ End-to-End Flow: A Challenge

```
1. User B taps on a territory owned by User A → sees "Challenge" button
2. User B stakes 10 RUN → challenge request sent to Rails API
3. Rails notifies User A via ActionCable: "Challenge received!"
4. User A accepts → both get the same route + 24hr window to complete it
5. Both run the route → GPS data verified by Rails GPSValidator
6. Rails compares verified completion times
7. Faster runner wins → BlockchainService calls contract:
   - mint(winner, 25) → winner gets RunCoins
   - transfer(loser_stake → winner) → loser loses stake
   - territory.transferOwnership(winner)
8. ActionCable pushes result to both users in real-time
9. Map updates zone ownership live
```

---

## 🚀 Getting Started (Local Dev)

### Prerequisites
- Docker + Docker Compose
- Node.js 18+
- Ruby 3.2+
- Expo CLI (`npm install -g expo-cli`)
- MetaMask browser extension

### 1. Clone the repo
```bash
git clone https://github.com/divyesh314/runITownIT.git
cd runITownIT
```

### 2. Start the backend
```bash
cd runown-backend
cp .env.example .env          # Add your Polygon RPC URL + wallet keys
docker-compose up --build     # Starts Rails + PostgreSQL
docker-compose exec web rails db:create db:migrate db:seed
```

### 3. Start the mobile app
```bash
cd runown-app
npm install
npx expo start                # Scan QR with Expo Go app
```

### 4. Start the web dashboard
```bash
cd runown-web
npm install
npm run dev                   # http://localhost:3000
```

### 5. Deploy contracts (testnet)
```bash
cd contracts
npm install
npx hardhat run scripts/deploy.js --network mumbai
# Copy contract address → paste into backend .env as RUNCOIN_CONTRACT_ADDRESS
```

---

## 🗓️ Roadmap

| Milestone | Target | Status |
|---|---|---|
| Backend setup + Docker local env | Week 1 | 🔄 In Progress |
| Frontend basics + API integration | Weeks 2–3 | ⏳ Planned |
| Blockchain + mining prototype | Weeks 4–5 | ⏳ Planned |
| Testing + beta deploy | Week 6 | ⏳ Planned |
| 1,000 beta users | Ongoing | ⏳ Planned |

---

## 🧪 Testing

```bash
# Backend (Rails)
cd runown-backend
bundle exec rspec

# Frontend (React Native)
cd runown-app
npm test

# Smart Contracts
cd contracts
npx hardhat test
```

---

## 🔐 Security Considerations

- **GPS spoofing detection**: Server-side speed checks (if you "ran" 100m in 1 second, it's flagged)
- **Smart contract audit**: Running Slither static analysis before mainnet deploy
- **Mining transparency**: Mining is always opt-in, CPU throttled, and shown clearly in UI
- **Private keys**: Stored in Docker secrets / environment variables — never committed to git
- **Challenge fairness**: GPS routes are server-generated and identical for both challengers

---

## 🤝 Contributing

This project is in active prototyping. If you want to contribute:

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit with clear messages: `git commit -m "feat: add territory hex grid overlay"`
4. Open a PR with a description of what you built and why

Label issues clearly: `bug`, `enhancement`, `blockchain`, `gps`, `frontend`, `backend`.

---

## 📄 License

MIT — use it, fork it, run with it (literally).

---

## 👤 Author

**Divyesh Pawar** — Software Engineer  
[LinkedIn](https://linkedin.com/in/divyesh-pawar-b11524219) • [GitHub](https://github.com/divyesh314)

> *Built because running should feel like more than just burning calories.*
