> เอกสารประวัติ: เนื้อหาด้านล่างอ้างสถานะ/แผนเดิม ไม่ใช่รายการงานปัจจุบัน โปรดใช้ [แผนงานหลัก](docs/project-plan.md) และ [ผลตรวจล่าสุด](docs/validation-current.md) ก่อนดำเนินการ

# Phase 3: Quotation Form Cleanup - Implementation Guide

## Current Implementation (Before Phase 3)

### Frontend (Footer.jsx)
```javascript
POST /api/contact → Send form data to backend
```

### Backend (server.js - Line 639)
```javascript
app.post('/api/contact', async (req, res) => {
  // 1. Validate input
  // 2. INSERT INTO contacts table  ← REMOVE THIS
  // 3. Send Email notification ← KEEP
  // 4. Send LINE notification ← KEEP
  // 5. Send Facebook notification ← KEEP
  // 6. Return success
});
```

### Database
- `contacts` table stores all quotations
- Admin can view via `/api/contacts` endpoint

---

## Phase 3 Changes Required

### ✂️ What to Remove

**Backend (api/server.js):**

1. **Line 646-658:** Remove database INSERT statement
   ```javascript
   // DELETE THIS BLOCK:
   const query = 'INSERT INTO contacts (name, contact_info, email, message) VALUES (?, ?, ?, ?)';
   db.run(query, [name, contactInfo, email, message], async function(err) {
     if (err) return res.status(500).json({ error: err.message });
     // ... rest of code
   });
   ```

2. **Line 663-668:** Remove `/api/contacts` endpoint
   ```javascript
   // DELETE ENTIRE ENDPOINT:
   app.get('/api/contacts', requireAuth, (req, res) => {
     db.all('SELECT * FROM contacts ORDER BY created_at DESC', [], (err, rows) => {
       if (err) return res.status(500).json({ error: err.message });
       res.json(rows);
     });
   });
   ```

3. **Remove contacts table initialization** (somewhere in initializeDb)
   ```javascript
   // DELETE THIS TABLE:
   db.run(`CREATE TABLE IF NOT EXISTS contacts (...)`);
   ```

**Frontend (app/src/components):**
- No changes needed (form still works, just doesn't save data)

**Admin Dashboard:**
- Delete quotations/contacts management page
- Remove from admin menu

---

## ✅ What to Keep

**Backend:**
- `sendEmailNotification(contactData)` - Email to admin ✅
- `sendLineNotification(contactData)` - LINE message ✅
- `sendFacebookNotification(contactData)` - Facebook message ✅
- Form validation ✅
- Response structure ✅

---

## Step-by-Step Implementation

### Step 1: Modify `/api/contact` Endpoint

**File:** `api/server.js` Line ~639

**Find this:**
```javascript
app.post('/api/contact', async (req, res) => {
  const { name, contactInfo, email, message } = req.body;

  if (!name || !contactInfo || !email || !message) {
    return res.status(400).json({ error: 'All fields required' });
  }

  const query = 'INSERT INTO contacts (name, contact_info, email, message) VALUES (?, ?, ?, ?)';
  db.run(query, [name, contactInfo, email, message], async function(err) {
    if (err) return res.status(500).json({ error: err.message });

    // Send notifications (parallel)
    const contactData = { name, contact_info: contactInfo, email, message };
    await Promise.allSettled([
      sendEmailNotification(contactData),
      sendLineNotification(contactData),
      sendFacebookNotification(contactData)
    ]);

    res.status(201).json({ success: true, id: this.lastID });
  });
});
```

**Replace with:**
```javascript
app.post('/api/contact', async (req, res) => {
  const { name, contactInfo, email, message } = req.body;

  if (!name || !contactInfo || !email || !message) {
    return res.status(400).json({ error: 'All fields required' });
  }

  try {
    // Send notifications only (no database save)
    const contactData = { name, contact_info: contactInfo, email, message };
    await Promise.allSettled([
      sendEmailNotification(contactData),
      sendLineNotification(contactData),
      sendFacebookNotification(contactData)
    ]);

    res.status(200).json({ success: true, message: 'ส่งคำขอเรียบร้อย' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

### Step 2: Remove `/api/contacts` Admin Endpoint

**File:** `api/server.js` Line ~663

**Delete entire endpoint:**
```javascript
// ❌ DELETE THIS WHOLE SECTION:
app.get('/api/contacts', requireAuth, (req, res) => {
  db.all('SELECT * FROM contacts ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
```

### Step 3: Remove Contacts Table Initialization

**File:** `api/server.js` in `initializeDb()` function (around line 104)

**Delete this table:**
```javascript
// ❌ DELETE THIS BLOCK:
db.run(`CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  contact_info TEXT NOT NULL,
  email TEXT,
  message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);
```

### Step 4: Remove Admin Quotations Dashboard (Optional)

**If you have quotations page in admin:**
- Delete: `app/src/components/Admin/Quotations.jsx`
- Delete: `app/src/components/Admin/QuotationDetail.jsx`
- Remove from admin menu/routing

---

## Testing Phase 3

### Test 1: Form Still Works
```bash
✅ Submit quotation form
✅ No errors in console
✅ Success message displays
✅ Form clears after submission
```

### Test 2: Notifications Still Send
```bash
✅ Email received by admin
✅ LINE message received
✅ Facebook message received (if enabled)
✅ No database errors
```

### Test 3: Database Cleaned
```bash
✅ contacts table no longer exists
✅ No data saved when form submitted
✅ No database records created
```

### Test 4: Backend Deployment
```bash
git add api/
git commit -m "Phase 3: Remove quotation data storage"
git push origin main

✅ GitHub Actions triggers
✅ Railway re-deploys
✅ No deployment errors
✅ API still responds
```

---

## Deployment Steps

### 1. Local Testing
```bash
# Test locally first
npm start  # in api directory

# Test form submission
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","contactInfo":"123","email":"test@test.com","message":"test"}'

# Should return:
# {"success": true, "message": "ส่งคำขอเรียบร้อย"}
```

### 2. Commit Changes
```bash
git add api/server.js
git commit -m "Phase 3: Remove customer data storage, keep notifications"
git push origin main
```

### 3. Monitor Deployment
```
GitHub Actions → deploy-backend workflow
Railway → Service logs
```

### 4. Production Test
```bash
curl -X POST https://api-xyz.up.railway.app/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","contactInfo":"0812345678","email":"test@example.com","message":"Test message"}'
```

---

## Benefits of Phase 3

✅ **Privacy:** No customer data stored
✅ **Simpler:** No data management needed
✅ **Smaller Database:** Less data to back up
✅ **Faster:** No INSERT queries
✅ **GDPR Friendly:** No customer records kept
✅ **Notifications Still Work:** Email, LINE, Facebook all working

---

## Files Modified Summary

```
Files to Modify:
├── api/server.js
│   ├── Remove /api/contact database INSERT (line 646)
│   ├── Remove /api/contacts endpoint (line 663)
│   └── Remove contacts table init (line 104)
│
└── Optional: Admin Dashboard cleanup
    └── Remove Quotations management page
```

---

## Rollback (If Needed)

If you want to undo Phase 3:
```bash
git revert <commit-hash>
git push origin main
```

---

## Summary

**What Changes:**
- Form data is NOT saved to database
- Notifications still send (Email, LINE, Facebook)
- /api/contacts endpoint removed
- contacts table no longer created

**What Stays Same:**
- Form validation
- User experience
- Notification system
- Frontend code

**Result:**
- Zero customer data stored
- Full notification functionality
- Cleaner, faster backend

---

**Status:** Ready to implement  
**Estimated Time:** 15 minutes  
**Complexity:** Low  
**Risk Level:** Very Low (notifications unchanged)
