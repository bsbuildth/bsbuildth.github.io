> เอกสารประวัติ: เนื้อหาด้านล่างอ้างสถานะ/แผนเดิม ไม่ใช่รายการงานปัจจุบัน โปรดใช้ [แผนงานหลัก](docs/project-plan.md) และ [ผลตรวจล่าสุด](docs/validation-current.md) ก่อนดำเนินการ

# GitHub Deployment Infrastructure Guide

This document explains how to set up and deploy your full-stack application using GitHub Actions.

## Project Structure

```
Website/
├── app/                    # Frontend (React + Vite)
├── api/                    # Backend (Express.js API)
├── .github/workflows/      # GitHub Actions workflows
└── DEPLOYMENT.md          # This file
```

## Phase 1: Initial Setup

### 1.1 Verify GitHub Repository

Make sure your repository is properly set up:
- [ ] Repository exists on GitHub
- [ ] You have write access to the repository
- [ ] Main branch is the default branch

### 1.2 Configure GitHub Secrets

Go to **Settings → Secrets and variables → Actions** and add these secrets:

#### Required Secrets:

```
REACT_APP_API_URL
  Description: Backend API URL for frontend to communicate with
  Example: https://api.yourdomain.com
  or: https://your-railway-domain.up.railway.app
```

#### Optional Secrets:

```
CUSTOM_DOMAIN
  Description: Your custom domain for GitHub Pages
  Example: yourdomain.com
  Leave empty if using GitHub Pages default domain

RAILWAY_TOKEN
  Description: Railway.app authentication token
  Get from: https://railway.app/account/tokens
  Only needed if using Railway for backend

RAILWAY_SERVICE_ID
  Description: Railway service ID for backend
  Get from: Railway dashboard after creating service
  Only needed if using Railway for backend
```

## Phase 2: Frontend Deployment (GitHub Pages)

### 2.1 Enable GitHub Pages

1. Go to **Settings → Pages**
2. Source: **Deploy from branch**
3. Branch: **gh-pages**
4. Folder: **/ (root)**
5. Click **Save**

### 2.2 Understand the Workflow

The `.github/workflows/deploy-frontend.yml` workflow:
- Triggers on push to `main` branch in `app/` directory
- Installs dependencies
- Builds React app with Vite
- Deploys to GitHub Pages

### 2.3 Test Frontend Deployment

```bash
# Make a small change to the frontend
cd app
git add .
git commit -m "Test deployment"
git push origin main

# Watch the workflow:
# Go to GitHub → Actions tab
# Click on the latest workflow run
# Wait for green checkmark (usually 1-2 minutes)
```

### 2.4 Access Your Frontend

**Option A: GitHub Default Domain**
```
https://username.github.io/repo-name
```

**Option B: Custom Domain**
```
https://yourdomain.com
```
To use custom domain:
1. Register domain (Namecheap, GoDaddy, etc.)
2. Add `CUSTOM_DOMAIN` secret to GitHub
3. Configure DNS CNAME: `yourdomain.com` → `username.github.io`

## Phase 3: Backend Deployment

### 3.1 Choose Hosting Platform

**Recommended: Railway.app** (Easiest)
- Pros: GitHub sync, auto-deploy, transparent pricing, 5GB free/month
- Cost: Pay-as-you-go (~$5-20/month typically)
- Setup time: 5 minutes

**Alternatives:**
- Render.com: Free tier (auto-sleeps), ~$7/month paid
- Heroku: $7+/month (free tier discontinued)
- AWS EC2: ~$5/month, more complex setup
- DigitalOcean: $4-6/month, simple droplets

### 3.2 Railway Setup (Step-by-step)

#### Step 1: Create Railway Account
- Go to [railway.app](https://railway.app)
- Sign up with GitHub account
- Authorize Railway to access your repositories

#### Step 2: Create Backend Service
1. Click **New Project**
2. Select **Deploy from GitHub repo**
3. Choose your repository
4. Select `api` folder for the service

#### Step 3: Configure Environment Variables
In Railway dashboard, add these to your service:

```
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
FRONTEND_PRODUCTION_URL=https://yourdomain.com
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-app-specific-password
LINE_CHANNEL_ACCESS_TOKEN=your-line-token
LINE_CHANNEL_SECRET=your-line-secret
SESSION_SECRET=generate-a-long-random-string-here
```

#### Step 4: Get Your Backend URL
- In Railway dashboard, go to your service settings
- Copy the **Public URL** (e.g., `https://your-service.up.railway.app`)
- Save this for the frontend configuration

#### Step 5: Update Frontend API URL
1. Add/update GitHub secret:
   ```
   REACT_APP_API_URL=https://your-service.up.railway.app
   ```
2. Commit and push to trigger frontend rebuild

#### Step 6: Enable Auto-Deploy (Optional)
Railway auto-deploys on push to main by default. You can disable this in service settings if you want manual control.

### 3.3 Test Backend Deployment

```bash
# Wait for Railway to deploy (check dashboard)
# Test the API endpoint:
curl https://your-service.up.railway.app/api/health

# Expected response: 404 or JSON (any response means API is running)
```

## Phase 4: Domain Configuration

### 4.1 Option A: GitHub Default Domain (No Cost)

```
Frontend: https://username.github.io/repo-name
Backend:  https://your-railway-domain.up.railway.app
```

**Frontend `.env.production`:**
```
REACT_APP_API_URL=https://your-railway-domain.up.railway.app
```

### 4.2 Option B: Custom Domain (Recommended)

#### Step 1: Register Domain
- Namecheap: ~$10-15/year
- GoDaddy: ~$12-15/year
- Route53: Variable pricing

#### Step 2: Configure DNS

**For Frontend (GitHub Pages):**
1. DNS provider → Add CNAME record:
   ```
   Name: @
   Type: CNAME
   Value: username.github.io
   ```

2. Or add multiple A records (if CNAME not available):
   ```
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```

**For Backend (Railway):**
1. In Railway dashboard, go to Service → Settings
2. Find custom domain section
3. Add your custom domain or subdomain (e.g., `api.yourdomain.com`)
4. Get the DNS target Railway provides
5. In DNS provider, add CNAME:
   ```
   Name: api
   Type: CNAME
   Value: [Railway's DNS target]
   ```

#### Step 3: Configure GitHub Pages Custom Domain
1. Go to **Settings → Pages**
2. Custom domain: `yourdomain.com`
3. GitHub will create a `CNAME` file in gh-pages branch

#### Step 4: Update Environment Configuration
1. Update `REACT_APP_API_URL` secret:
   ```
   REACT_APP_API_URL=https://api.yourdomain.com
   ```
2. Update Railway environment variable:
   ```
   FRONTEND_PRODUCTION_URL=https://yourdomain.com
   ```

## Phase 5: Complete End-to-End Testing

### 5.1 Frontend Checks
- [ ] Site loads without 404 errors
- [ ] CSS and images display correctly
- [ ] Navigation works
- [ ] No console errors in browser DevTools

### 5.2 API Communication
- [ ] Calculator component loads
- [ ] Can submit calculator form
- [ ] API responses appear in console
- [ ] No CORS errors in console

### 5.3 Database Operations
- [ ] Contact form can be submitted
- [ ] Data is saved and retrieved correctly
- [ ] File uploads work (if applicable)

### 5.4 Error Handling
- [ ] Try submitting with invalid data
- [ ] Turn off WiFi temporarily to test error handling
- [ ] Check browser console for errors

## Phase 6: CI/CD Pipeline Verification

### 6.1 Test Automated Deployment
1. Make a small code change in `app/src/App.jsx`:
   ```javascript
   // Add a comment
   // Deployed via GitHub Actions
   ```

2. Commit and push:
   ```bash
   git add app/src/App.jsx
   git commit -m "Test CI/CD pipeline"
   git push origin main
   ```

3. Watch the workflow:
   - Go to GitHub → **Actions** tab
   - Click the workflow run
   - Watch for green checkmark
   - Verify changes live within 2-3 minutes

### 6.2 Test Backend Deployment
1. Make a small change in `api/server.js` (e.g., add a comment)
2. Commit and push
3. Watch GitHub Actions (should trigger backend workflow)
4. Verify Railway deployment completes

## Troubleshooting

### Frontend Issues

**Issue: 404 error on custom domain**
- Check GitHub Pages settings
- Verify CNAME file exists in gh-pages branch
- Check DNS CNAME record

**Issue: Assets not loading (CSS/images missing)**
- Check build output includes all assets
- Verify public folder files are included
- Check base path in vite.config.js

**Issue: Frontend can't connect to backend**
- Check `REACT_APP_API_URL` is correct
- Check backend CORS origin includes frontend domain
- Look for CORS errors in browser console

### Backend Issues

**Issue: Railway deployment fails**
- Check all environment variables are set
- Verify code has no syntax errors
- Check logs in Railway dashboard
- Ensure package.json has start script

**Issue: API returns 500 errors**
- Check backend logs in Railway dashboard
- Verify database is initialized
- Check environment variables are correct

**Issue: CORS errors**
- Update `FRONTEND_PRODUCTION_URL` in Railway
- Ensure backend is using correct CORS configuration
- Check that frontend URL matches exactly

## Environment Variables Reference

### Frontend (.env.production)
```
REACT_APP_API_URL        # Backend URL for API calls
REACT_APP_DEBUG_MODE     # Enable/disable debug logging
REACT_APP_ENABLE_ANALYTICS  # Enable analytics
```

### Backend (Railway or local .env)
```
NODE_ENV                 # production or development
PORT                     # Server port (default 3000)
HOST                     # Server host (0.0.0.0 for external)
FRONTEND_PRODUCTION_URL  # Frontend domain for CORS
FRONTEND_URL             # Fallback frontend URL
EMAIL_USER              # Gmail address for notifications
EMAIL_PASSWORD          # Gmail app password
LINE_CHANNEL_ACCESS_TOKEN  # LINE Bot token
LINE_CHANNEL_SECRET     # LINE Bot secret
SESSION_SECRET          # Secret for session encryption
```

## Monitoring & Maintenance

### Check Deployment Status
1. **Frontend**: GitHub Pages → Settings → Pages → See deployment status
2. **Backend**: Railway → Service → Metrics tab

### View Logs
1. **Frontend**: GitHub Actions → Workflow run → Logs
2. **Backend**: Railway → Service → Logs tab

### Update Code
1. Make changes locally
2. Commit: `git commit -m "Description"`
3. Push: `git push origin main`
4. Workflows trigger automatically
5. Check GitHub Actions and Railway dashboards

## Next Steps

1. ✅ Set up GitHub Secrets
2. ✅ Enable GitHub Pages
3. ✅ Deploy frontend (watch Actions tab)
4. ✅ Create Railway account and backend service
5. ✅ Configure backend environment variables
6. ✅ Update frontend with backend API URL
7. ✅ Test end-to-end functionality
8. ✅ Configure custom domain (optional)
9. ✅ Monitor deployments and logs

## Support Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Railway Documentation](https://docs.railway.app)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Vite Build Documentation](https://vitejs.dev/guide/build.html)
- [Express Deployment Guide](https://expressjs.com/en/advanced/best-practice-performance.html)
