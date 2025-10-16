## Updated Task Breakdown for RunOwn GitHub Repo



### 1. Backend (Rails)
Focus: API for users, territories, challenges, and reward logic. Use Docker for local dev.
- [ ] Set up Rails app: `rails new runown-backend --database=postgresql` (add gems: devise for auth, actioncable for real-time, web3-eth for blockchain).
- [ ] Configure Docker: Create `Dockerfile` and `docker-compose.yml` for Rails + Postgres (e.g., `services: db, web`).
- [ ] Models/Controllers: User, Territory (with GPS fields), Run, Challenge.
- [ ] API Endpoints: `/api/claim-territory`, `/api/challenge/:id`, `/api/verify-run` (GPS validation).
- [ ] Real-time: Integrate ActionCable for live notifications (e.g., "Challenge accepted!").
- [ ] Blockchain Hooks: Add service to call Polygon contract for minting RunCoins on win.
- [ ] Seed Data: Fake territories/routes for testing.

### 2. Frontend (React)
Focus: UI for maps, runs, and wallet integration. React Native for app, Next.js for web.
- [ ] Set up React Native: `npx create-expo-app runown-app` (add deps: @react-navigation, expo-location for GPS).
- [ ] Docker for Frontend: Optional `Dockerfile` for Next.js web build (or use native for mobile).
- [ ] Core Screens: Login, Map View (territories with ownership badges), Run Tracker, Challenge Modal.
- [ ] GPS Integration: Use Expo Location for tracking; display routes on Leaflet map.
- [ ] Social Features: Leaderboards (fetch from Rails API), notifications.
- [ ] Wallet Connect: Integrate Ethers.js/MetaMask for RunCoin display/claims.
- [ ] Responsive Web: Set up Next.js project, mirror app screens.

### 3. Blockchain Integration
Focus: ERC-20 RunCoin on Polygon; integrate with Rails.
- [ ] Design Contract: Use OpenZeppelin wizard for ERC-20 (add mint/transfer for rewards).
- [ ] Deploy Testnet: Remix IDE to Mumbai testnet; save address in Rails env vars.
- [ ] Rails Integration: Gem/service to call contract (e.g., `RunCoin.mint(winner_address, amount)`).
- [ ] Oracle for Verification: Off-chain GPS data to on-chain events (use Chainlink if needed, or simple HTTP).
- [ ] NFT Extension: Basic territory ownership as ERC-721 (post-MVP).

### 4. Crypto Rewards & Mining
Focus: Opt-in mining during runs; pool to treasury, distribute via ERC-20.
- [ ] Mining Lib: Add JS CryptoNight to React Native (background task on run start).
- [ ] Throttling Logic: Limit to 20% CPU; estimate earnings preview.
- [ ] Treasury Wallet: Multi-sig setup; Rails cron job to pool mined BTC/ETH.
- [ ] Reward Flow: On win, swap pool to RunCoins, transfer via contract.
- [ ] User Dashboard: Show earnings, opt-in toggle.

### 5. DevOps & Infrastructure (Docker-Centric)
Focus: Containerize everything for easy deploys.
- [ ] Dockerize Full Stack: `docker-compose up` for local (Rails, React dev server, Postgres).
- [ ] CI/CD: GitHub Actions workflow for build/test/deploy (lint Rails code, test React components).
- [ ] Deploy: Render/Heroku for Rails (Docker support); Expo for mobile builds; Vercel for Next.js.
- [ ] Env/Sec: Docker secrets for API keys (Polygon RPC, wallet private keys).
- [ ] Monitoring: Basic logs with Sentry free tier.

### 6. Testing & QA
Focus: Ensure GPS accuracy, blockchain txns, and mining safety.
- [ ] Unit Tests: RSpec for Rails models/endpoints; Jest for React components.
- [ ] Integration: Test full flow (claim → run → win → mint) with Docker mocks.
- [ ] E2E: Cypress for web; Detox for React Native (simulate GPS).
- [ ] Security: Audit for spoofing (e.g., mock GPS detection); contract audit with Slither.
- [ ] Beta Testing: 50 testers; track bugs via GitHub Issues.

### 7. Marketing & Community
Focus: Build hype pre-launch.
- [ ] Landing Page: Simple Next.js site with waitlist signup.
- [ ] Social: Post teasers on Reddit r/running, X #Web3Fitness.
- [ ] Docs: Update README with setup instructions (e.g., "docker-compose up").
- [ ] Airdrop: Early testers get test RunCoins.
- [ ] Analytics: Google Analytics for signups; track retention.

### Roadmap Milestones
- **Week 1**: Backend setup + Docker local env running.
- **Weeks 2-3**: Frontend basics + API integration.
- **Weeks 4-5**: Blockchain + mining prototype.
- **Week 6**: Testing + beta deploy.
- **Ongoing**: Marketing push for 1K users.

Track progress by closing Issues—aim for daily commits. If a task blocks you, label it and ping in Discussions. This list is flexible; fork it into your repo and tweak. Ready to tackle Backend first? Let's knock out that Rails setup!
