> เอกสารประวัติ: เนื้อหาด้านล่างอ้างสถานะ/แผนเดิม ไม่ใช่รายการงานปัจจุบัน โปรดใช้ [แผนงานหลัก](docs/project-plan.md) และ [ผลตรวจล่าสุด](docs/validation-current.md) ก่อนดำเนินการ

# Quick Start: GitHub Deployment in 5 Steps

⚡ **Fast-track deployment guide** | See `DEPLOYMENT.md` for full details

## Step 1: Add GitHub Secrets (2 min)

Go to **GitHub → Settings → Secrets and variables → Actions**

Add this secret:
```
REACT_APP_API_URL
Value: https://your-railway-service.up.railway.app
```

(You'll update this after Railway is set up)

## Step 2: Enable GitHub Pages (1 min)

Go to **GitHub → Settings → Pages**
- Source: **Deploy from branch**
- Branch: **gh-pages**
- Click **Save**

First deployment will happen when you push code.

## Step 3: Create Railway Service (5 min)

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. New Project → Deploy from GitHub repo
4. Select `api` folder
5. Get your public URL (copy it)

## Step 4: Configure Railway (3 min)

In Railway dashboard → Service → Variables, add:
```
NODE_ENV=production
PORT=3000
FRONTEND_PRODUCTION_URL=https://yourdomain.com
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
LINE_CHANNEL_ACCESS_TOKEN=your-token
LINE_CHANNEL_SECRET=your-secret
SESSION_SECRET=generate-random-secret-here
```

## Step 5: Update GitHub Secret (1 min)

Update the `REACT_APP_API_URL` secret with your Railway URL:
```
REACT_APP_API_URL=https://your-railway-service.up.railway.app
```

## 🚀 Deploy!

```bash
git add .
git commit -m "Deploy infrastructure setup complete"
git push origin main
```

Watch the workflows:
- **Frontend**: GitHub → Actions → deploy-frontend workflow
- **Backend**: Railway → Dashboard → Service logs

✅ Done! You're deployed!

---

## Verify It Works

**Frontend:** Visit `https://username.github.io/repo-name`
- [ ] Page loads
- [ ] No 404 errors
- [ ] CSS loads

**Backend:** Test API from frontend
- [ ] Open browser DevTools → Console
- [ ] Trigger any API call (form submit, calculator)
- [ ] See response in console
- [ ] No CORS errors

**End-to-End:** 
- [ ] Submit form → data saves
- [ ] Load calculator → works with backend API

---

## Need Custom Domain?

1. Register domain (~$10-15/year)
2. Add DNS CNAME: `yourdomain.com` → `username.github.io`
3. Add `CUSTOM_DOMAIN` secret: `yourdomain.com`
4. Update `REACT_APP_API_URL` secret to use `https://api.yourdomain.com`
5. Point `api.yourdomain.com` to Railway's DNS

See `DEPLOYMENT.md` for detailed domain setup.

---

## Troubleshooting

**Can't see GitHub Pages deploy button?**
- Go to repo → Settings → Pages
- Source should be "Deploy from branch"

**Railway won't connect?**
- Verify you're logged in with GitHub account
- Authorize Railway to access repositories

**API calls return CORS error?**
- Check `REACT_APP_API_URL` matches deployment URL
- Verify Railway environment variables are set

**Changes not appearing?**
- Commit and push: `git push origin main`
- Check GitHub Actions → Workflows for errors
- Wait 2-3 minutes for deployment

---

## Next Steps

After deployment is working:
1. ✅ Test all features work in production
2. ✅ Set up monitoring/logging
3. ✅ Configure custom domain (optional)
4. ✅ Set up automated backups
5. ✅ Document deployment process for team

See full documentation:
- `DEPLOYMENT.md` - Complete setup guide
- `.github/GITHUB_SETUP_CHECKLIST.md` - Detailed checklist
- `.github/workflows/` - Workflow configurations
