> เอกสารประวัติ: เนื้อหาด้านล่างอ้างสถานะ/แผนเดิม ไม่ใช่รายการงานปัจจุบัน โปรดใช้ [แผนงานหลัก](docs/project-plan.md) และ [ผลตรวจล่าสุด](docs/validation-current.md) ก่อนดำเนินการ

# ขั้นตอนสุดท้าย - ตั้งค่า Deploy Hook ใน Render (2 นาที)

## 🎯 สิ่งที่ฉันได้ทำให้คุณแล้ว:

✅ **Frontend**: GitHub Pages - พร้อมใช้งาน  
✅ **Server Code**: ลบ SQLite3 แล้ว ใช้ hardcoded data  
✅ **GitHub Actions**: ตั้งค่า Workflow ให้ Deploy ไป Render  
✅ **Environment Variables**: ตั้งค่า REACT_APP_API_URL แล้ว  

## ❌ ขั้นตอนสุดท้าย (เพียงหนึ่งขั้นตอน):

ต้อง**กำหนด RENDER_DEPLOY_HOOK Secret ใน GitHub** เพื่อให้ Render รู้ว่าจะ Deploy เมื่อมี Code เปลี่ยน

---

## 📝 วิธีการ (ทำตามลำดับ):

### 1️⃣ เปิด Render Dashboard
- URL: https://dashboard.render.com
- ลงชื่อเข้าใช้ด้วย songyos2528@gmail.com

### 2️⃣ เลือก Backend Service
- หาและคลิก: **website-api**

### 3️⃣ สร้าง Deploy Hook (ซ้ายแถบเมนู)
```
Settings 
  ↓
Deploy Hooks
  ↓
Create Deploy Hook
  ↓
ตั้งชื่อ: "GitHub Auto Deploy"
  ↓
Create Hook
```

### 4️⃣ **คัดลอก URL** ที่แสดง
- จะเป็น: `https://api.render.com/deploy/srv-...`
- ⚠️ **อย่าลืม - คัดลอก URL เต็ม ๆ**

### 5️⃣ เพิ่มใน GitHub Secret
1. ไปที่: https://github.com/songyos2528/website/settings/secrets/actions
2. คลิก: **New repository secret**
3. ตั้งชื่อ: `RENDER_DEPLOY_HOOK`
4. วาง URL: (paste จากขั้นที่ 4)
5. คลิก: **Add secret**

### 6️⃣ ทดสอบ
```bash
# Frontend ควรแสดงข้อมูลถูกต้องแล้ว
https://songyos2528.github.io/website/
```

---

## ✨ หลังจากตั้งค่าเสร็จ:

- ✅ Frontend แสดงรูปและข้อมูล
- ✅ Contact Form ส่ง Email + LINE ได้
- ✅ Auto Deploy เมื่อ Push Code ไป GitHub

---

## 🆘 ถ้ามีปัญหา:

```bash
# ทดสอบว่า Backend Response ไหม
curl https://website-api-lmf9.onrender.com/api/projects
```

ควรแสดง JSON data ของโปรเจค

---

**เพียงแค่นี้แหละ! 🎉**
