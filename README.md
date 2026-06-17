# TARS — Living City Command Center

Your personal AI agent world. 5 agents living in a detailed city, each with their own personality and your context. Deploys as a PWA on Netlify — add to your iPhone home screen and run it like a native app.

---

## What's inside

- **Living city map** — agents walk around a detailed cyberpunk city (buildings, park, roads, traffic, streetlights). Drag to explore.
- **Tap any agent** to open their channel and chat (real Claude responses once deployed).
- **Rename agents** anytime — tap RENAME in their chat panel.
- **Hamburger menu** (top left) → Connections, Manage Agents, Autonomous Tasks, Settings.
- **Connections screen** — link Gmail, Google Calendar, Drive, Etsy, Printify, Twilio, Slack, Odds API.
- **Mission Control** (bottom) — live view of what every agent is doing + activity log.
- Agents cycle through autonomous tasks on their own.

Your 5 agents: VANCE (career), CIPHER (security/SC-300), FORGE (dev), ATLAS (finance/home buying), MAVEN (Etsy business).

---

## Setup (5 minutes)

### 1. Get your Anthropic API key
console.anthropic.com → API Keys → Create Key. Copy it.

### 2. Add your key
Open `.env.local`, replace `your_api_key_here`:
```
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Install & test
```bash
npm install
npm run dev
```
Open http://localhost:3000

---

## Deploy to Netlify

### GitHub method (recommended — easy phone edits later)
1. Push this folder to a GitHub repo
2. app.netlify.com → Add new site → Import from GitHub → pick the repo
3. Site settings → Environment variables → add `ANTHROPIC_API_KEY`
4. Deploy

### CLI method
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify env:set ANTHROPIC_API_KEY sk-ant-your-key
netlify deploy --prod
```

---

## Add to iPhone Home Screen
1. Open your Netlify URL in **Safari**
2. Share button → **Add to Home Screen**
3. Name it TARS → Add
4. Opens full screen like a native app

---

## How chat works
- Until deployed, agents reply with demo responses.
- Once `ANTHROPIC_API_KEY` is set on Netlify, the chat panel calls `/api/chat` and you get real Claude responses with each agent's full personality and your context baked in.

## Connections (Gmail, Etsy, etc.)
The Connections screen UI is built. To make connections live, each service needs developer credentials registered (Google Cloud Console for Gmail/Calendar/Drive, Etsy developer portal for Etsy, API keys for Printify). The buttons currently simulate the flow so you can see how it works. Wiring real OAuth is the next build step.

## Customizing agents
Edit `src/components/City.tsx` → `INIT_AGENTS` array. Each agent has:
- name, role, color, emoji
- tasks (the autonomous task list shown in Mission Control)
- systemPrompt (personality + your context for real Claude responses)
- connections (which services it uses)
