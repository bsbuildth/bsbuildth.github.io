> เอกสารประวัติ: เนื้อหาด้านล่างอ้างสถานะ/แผนเดิม ไม่ใช่รายการงานปัจจุบัน โปรดใช้ [แผนงานหลัก](docs/project-plan.md) และ [ผลตรวจล่าสุด](docs/validation-current.md) ก่อนดำเนินการ

# Free Trial Deployment - ทดลองฟรีก่อนซื้อ Domain

⚡ **เร็ว 4 ขั้นตอน | ไม่ต้องเสียเงิน | รองรับ upgrade domain ภายหลัง**

---

## 💚 ค่าใช้จ่ายสำหรับทดลอง

```
┌─────────────────────┬──────────┐
│ Component           │ Cost     │
├─────────────────────┼──────────┤
│ Frontend (GitHub)   │ FREE ✅  │
│ Backend (Railway)   │ FREE*    │
│ Email (Gmail)       │ FREE ✅  │
│ LINE Official       │ (ใช้เดิม)│
│ Custom Domain       │ ยังไม่ต้อง│
└─────────────────────┴──────────┘

* Railway ให้ $5/month free ใช้ได้ประมาณ
```

---

## 🚀 ขั้นตอนที่ 1: Setup GitHub Pages (5 นาที)

### 1.1 Enable GitHub Pages
```
GitHub → Settings → Pages
- Source: Deploy from branch
- Branch: gh-pages
- Folder: / (root)
- Click Save
```

### 1.2 Push code to trigger first deploy
```bash
git add .
git commit -m "Enable GitHub Pages deployment"
git push origin main
```

### 1.3 Check your frontend URL
```
✅ Frontend live at:
https://username.github.io/repo-name

Example: https://bestudio.github.io/website
```

---

## 🚀 ขั้นตอนที่ 2: Setup Railway Backend (5 นาที)

### 2.1 Create Railway Account
```
1. Go to https://railway.app
2. Click "Start Free"
3. Sign up with GitHub account
4. Authorize Railway to access repos
```

### 2.2 Create Backend Service
```
1. Railway Dashboard → New Project
2. Select "Deploy from GitHub repo"
3. Choose your repository
4. Select "api" folder for deployment
5. Click Deploy
```

### 2.3 Wait for deployment
```
Railway shows build progress
⏳ Takes 2-3 minutes
🟢 You'll see "Running" when done
```

---

## 🚀 ขั้นตอนที่ 3: Configure Environment Variables (3 นาที)

### 3.1 In Railway Dashboard
```
Your Service → Variables tab
Add these environment variables:
```

```
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
FRONTEND_PRODUCTION_URL=https://username.github.io/repo-name
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
LINE_CHANNEL_ACCESS_TOKEN=your-token-here
LINE_CHANNEL_SECRET=your-secret-here
SESSION_SECRET=generate-long-random-secret
```

### 3.2 Get your Railway Backend URL
```
Railway → Your Service → Settings
Find "Public URL" section
Copy the URL:
https://api-xyz123.up.railway.app
```

---

## 🚀 ขั้นตอนที่ 4: Connect Frontend to Backend (2 นาที)

### 4.1 Add GitHub Secret
```
GitHub → Settings → Secrets and variables → Actions
Click "New repository secret"

Name: REACT_APP_API_URL
Value: https://api-xyz123.up.railway.app
(Use YOUR Railway URL from Step 3)

Click "Add secret"
```

### 4.2 Trigger frontend rebuild
```bash
# Make a small change to trigger deploy
echo "// Updated API endpoint" >> app/src/App.jsx

git add app/src/App.jsx
git commit -m "Connect to Railway backend"
git push origin main
```

### 4.3 Watch deployment
```
GitHub → Actions tab
Click the "Deploy Frontend to GitHub Pages" workflow
Wait for green checkmark ✅
(Takes 2-3 minutes)
```

---

## ✅ ทดสอบว่าทำงาน

### Test 1: Frontend Accessible
```bash
Visit: https://username.github.io/repo-name
✅ Page loads
✅ No 404 errors
✅ CSS loads correctly
```

### Test 2: Backend Accessible
```bash
curl https://api-xyz123.up.railway.app

✅ Returns response (even if error, means API is running)
```

### Test 3: Frontend ↔ Backend Communication
```bash
1. Open website
2. Open browser DevTools (F12)
3. Go to Console tab
4. Submit calculator form OR contact form
5. Watch the console
✅ See API response in console
✅ No CORS errors
✅ Data processed correctly
```

### Test 4: Email & LINE Notifications
```bash
1. Submit quotation form
2. Check Gmail inbox
   ✅ Email from admin received
3. Check LINE Official Account
   ✅ Message received
4. Check customer email (check spam folder)
   ✅ Reply email received
```

---

## 🎯 Next: Upgrade to Custom Domain (ภายหลัง)

เมื่อพร้อมซื้อ domain (ประมาณ $10-15/ปี):

### Step 1: Register Domain
```
Namecheap / GoDaddy / Route53
ราคา: ~$10-15/ปี
```

### Step 2: Configure GitHub Pages
```
GitHub → Settings → Pages
Custom domain: yourdomain.com
```

### Step 3: Configure Railway
```
Railway → Service → Settings
Custom domain: api.yourdomain.com
```

### Step 4: Update GitHub Secret
```
REACT_APP_API_URL = https://api.yourdomain.com
```

### Step 5: Push & Deploy
```bash
git commit -m "Update to custom domain"
git push origin main
# Auto-deploy to new domain
```

---

## 📋 Free Trial Checklist

```
GitHub Pages Setup:
- [ ] Repository settings → Pages enabled
- [ ] Frontend URL working
- [ ] No 404 errors

Railway Setup:
- [ ] Account created
- [ ] Service deployed
- [ ] Environment variables added
- [ ] Public URL copied

Connect Frontend:
- [ ] REACT_APP_API_URL secret added
- [ ] Frontend rebuilt
- [ ] Deployment successful

Testing:
- [ ] Frontend loads
- [ ] Backend accessible
- [ ] API calls work
- [ ] No CORS errors
- [ ] Email sends
- [ ] LINE sends

Ready for Production:
- [ ] All tests pass
- [ ] No errors in logs
- [ ] Ready to buy domain (when needed)
```

---

## 💡 Cost Breakdown (Expected)

### Free Tier Usage
```
Railway Free Tier: $5/month credit
Typical usage: 0.5-2 GB/month
= Stays within free tier ✅
```

### When You Exceed Free Tier
```
Railway charges: ~$0.000463/GB
Example: 10GB/month = ~$4.63
Still very cheap! 💰
```

### To Keep it Free
```
✅ Don't host large files
✅ Don't have thousands of requests/day
✅ Keep database small (no customer data = smaller DB)
✅ Monitor Railway usage dashboard
```

---

## 🚨 Important Notes

### Security
```
⚠️ NEVER commit .env files
✅ Use GitHub Secrets instead
✅ Use app-specific email passwords
✅ Keep LINE tokens secure
```

### Future Changes
```
This setup can be upgraded to custom domain
anytime without code changes:
✅ Just update DNS
✅ Update GitHub Secret
✅ Deploy
```

### Limitations
```
GitHub Pages: Static only (frontend) ✅
Railway Free: Limited requests per month
  If you get too much traffic:
  → Upgrade Railway plan (~$7/month)
  → OR move to another provider
```

---

## 🔧 Troubleshooting

### Q: Frontend shows 404
**A:** 
- Check GitHub Pages is enabled
- Wait 5 minutes for deployment
- Check Actions tab for errors

### Q: API connection fails (CORS error)
**A:**
- Verify REACT_APP_API_URL secret is correct
- Check Railway deployed successfully
- Restart Railway service

### Q: Email/LINE not sending
**A:**
- Check environment variables in Railway
- Verify Gmail app password is correct
- Check LINE channel token is correct
- Look at Railway logs for errors

### Q: Railway won't deploy
**A:**
- Check build logs in Railway
- Verify .env.example has all variables
- Check syntax errors in server.js
- Try re-deploying from Railway dashboard

---

## 📞 Support Resources

```
GitHub Issues:
https://github.com/username/repo/issues

Railway Support:
https://docs.railway.app

GitHub Actions Help:
https://docs.github.com/en/actions
```

---

## 🎉 Summary

```
You have:
✅ Frontend deployed on GitHub (FREE)
✅ Backend deployed on Railway (FREE)
✅ Email notifications working
✅ LINE notifications working
✅ Full-stack app running

Next: Buy domain when you want
       (Can upgrade anytime, no code changes)
```

**That's it! You're deployed.** 🚀

---

**Last Updated:** 2026-05-28  
**Status:** Ready for free trial  
**Next Phase:** Phase 3 - Remove quotation storage
