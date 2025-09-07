# Railway Deployment Guide

## Setup

### 1. Railway Project Setup
1. Create an account at [Railway](https://railway.app)
2. Create a new project
3. Connect your GitHub repository

### 2. Environment Variables
Configure these variables in Railway dashboard:
- `REACT_APP_API_URL`: Your backend API URL
- `REACT_APP_ENV`: Set to `production`
- Other variables from `.env.example` as needed

### 3. Get Railway Token for CI/CD
1. Go to Railway Dashboard → Account Settings → Tokens
2. Create a new token
3. Add it to GitHub Secrets as `RAILWAY_TOKEN`

## Deployment

### Automatic Deployment
- Push to `main` branch triggers automatic deployment
- GitHub Actions runs tests and deploys if successful

### Manual Deployment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy
railway up
```

## Configuration Files

### railway.json
- Build configuration for Railway
- Uses Nixpacks builder
- Runs `npm install --legacy-peer-deps && npm run build`

### nixpacks.toml
- Configures Nginx for serving static files
- Sets up proper build commands

### nginx.conf
- Serves the React app
- Handles SPA routing
- Adds security headers
- Configures caching

## Monitoring

Check deployment status:
```bash
railway status
railway logs
```

## Rollback

To rollback to a previous deployment:
1. Go to Railway dashboard
2. Navigate to deployments
3. Click "Rollback" on desired version

## Dependabot Configuration

### Automatic Dependency Updates
- Dependabot checks for updates weekly (Mondays at 9:00 AM)
- Groups dependencies by type (production, development, MUI)
- Auto-merges minor and patch updates after tests pass
- Major version updates require manual review

### Ignored Major Updates
- React and React DOM
- React Scripts
- TypeScript

### PR Management
- Maximum 10 open PRs at once
- PRs are labeled automatically
- Assigned to @devsalas for review