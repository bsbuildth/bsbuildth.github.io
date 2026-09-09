> เอกสารประวัติ: เนื้อหาด้านล่างอ้างสถานะ/แผนเดิม ไม่ใช่รายการงานปัจจุบัน โปรดใช้ [แผนงานหลัก](docs/project-plan.md) และ [ผลตรวจล่าสุด](docs/validation-current.md) ก่อนดำเนินการ

# วิธีตั้งค่า Render Deploy Hook สำหรับอัปเดตอัตโนมัติ

## ปัญหาปัจจุบัน
Backend API บน Render ยังไม่ได้อัปเดตข้อมูลจากการลบ SQLite3 ครั้งล่าสุด เนื่องจาก GitHub Actions workflow ไม่ได้ส่งการอัปเดตไป Render

## วิธีแก้ไข

### ขั้นที่ 1: เข้าไป Render Dashboard
1. เปิด https://dashboard.render.com
2. ลงชื่อเข้าใช้ (ใช้อีเมล songyos2528@gmail.com)

### ขั้นที่ 2: เลือก Backend Service
1. หาและคลิก Service ชื่อ **website-api**
2. คุณจะเห็นข้อมูลเกี่ยวกับ service นี้

### ขั้นที่ 3: สร้าง Deploy Hook
1. ไปที่ **Settings** (ที่ด้านข้าง)
2. หาส่วน **Deploy Hooks**
3. คลิก **Create Deploy Hook**
4. ตั้งชื่อ (เช่น "GitHub Auto Deploy")
5. คลิป **Create Hook**
6. **คัดลอก URL** ที่แสดง (จะขึ้นต้นด้วย `https://api.render.com/deploy/...`)

### ขั้นที่ 4: เพิ่ม Secret ใน GitHub
1. ไปที่ GitHub Repository: https://github.com/songyos2528/website
2. ไปที่ **Settings** → **Secrets and variables** → **Actions**
3. คลิก **New repository secret**
4. ตั้งชื่อ: `RENDER_DEPLOY_HOOK`
5. วาง URL ที่คัดลอกจาก Render
6. คลิก **Add secret**

### ขั้นที่ 5: ทดสอบ
หลังจากเพิ่ม Secret:
1. ไปที่ GitHub: https://github.com/songyos2528/website
2. ไปที่ **Actions** → **Deploy Backend** 
3. คลิก **Run workflow** → **Run workflow** (เลือก main branch)
4. รอ 2-3 นาทีให้ workflow เสร็จและ Render ทำการ deploy

### ขั้นที่ 6: ตรวจสอบว่าสำเร็จ
```bash
curl https://website-api-lmf9.onrender.com/api/projects
```
ควรแสดง JSON data ของโปรเจค

## เมื่อเสร็จสิ้น
- Frontend (GitHub Pages) จะเชื่อมต่อกับ Backend (Render) ได้
- รูปภาพและข้อมูลโปรเจคจะแสดงบนเว็บไซต์

## หมายเหตุ
- หากไม่ต้องการติดตั้งอัตโนมัติ สามารถ trigger deploy ด้วยตนเองจาก Render Dashboard ได้
- หรือสามารถเปลี่ยนไปใช้ GitHub App Render ได้

---

**สถานะปัจจุบัน:**
✅ Frontend (GitHub Pages) - Deploy สำเร็จ  
⏳ Backend (Render) - รอการตั้งค่า Deploy Hook
