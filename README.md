# Career Tracker

Personal job pipeline tracker with AI-powered fit analysis.

## Local setup

```bash
npm install
```

Create a `.env` file:
```
DATABASE_URL=postgresql://localhost:5432/career_tracker
APP_PASSWORD=your-password-here
TOKEN_SALT=any-random-string
NODE_ENV=development
```

Then run:
```bash
npm start
```

Visit `http://localhost:3000`

---

## Deploy to Railway

### 1. Push to GitHub
Make sure this repo is pushed to GitHub (private recommended).

### 2. Create Railway project
- Go to [railway.app](https://railway.app)
- New Project → Deploy from GitHub repo → select this repo
- Railway auto-detects Node and runs `npm start`

### 3. Add Postgres
- In your Railway project dashboard, click **+ New** → **Database** → **PostgreSQL**
- Railway automatically sets `DATABASE_URL` in your service's environment

### 4. Set environment variables
In Railway → your service → **Variables**, add:
```
APP_PASSWORD    = your-chosen-password
TOKEN_SALT      = any-random-string-you-pick
NODE_ENV        = production
```
You do NOT need to set `DATABASE_URL` manually — Railway injects it automatically from the Postgres service.

### 5. Deploy
Railway deploys automatically on every push to `main`. Your app will be live at:
`https://your-app-name.up.railway.app`

---

## Folder structure

```
career-tracker/
├── public/
│   └── index.html        ← the frontend app
├── server.js             ← Express server + API + auth
├── package.json
├── .gitignore
└── README.md
```

## Notes

- Data is stored in Postgres — persists across devices and sessions
- Auth is a single shared password set via `APP_PASSWORD` env var
- The Anthropic API key is handled by Claude.ai — no key needed in this app
