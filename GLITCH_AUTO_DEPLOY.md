> เอกสารประวัติ: เนื้อหาด้านล่างอ้างสถานะ/แผนเดิม ไม่ใช่รายการงานปัจจุบัน โปรดใช้ [แผนงานหลัก](docs/project-plan.md) และ [ผลตรวจล่าสุด](docs/validation-current.md) ก่อนดำเนินการ

# Deploy ไป Glitch (ระบบอัตโนมัติที่สุด)

## เหตุใด Glitch:
✅ **Full Auto-Deploy** จาก GitHub (ลิงก์เดียว)  
✅ **ไม่ต้องตั้ง Webhook** - Glitch เชื่อมต่อ GitHub เองได้  
✅ **ไม่ต้องสร้างบัญชี** - ใช้ GitHub Login  
✅ **Deploy ทันที** เมื่อ Import โปรเจค  

---

## 🚀 Deploy Now (ลิงก์เดียว):

```
https://glitch.com/import/github/songyos2528/website
```

### ขั้นตอน:
1. **คลิกลิงก์** ด้านบน
2. **ลงชื่อเข้าใช้** ด้วย GitHub (ถ้าจำเป็น)
3. **Glitch จะ Import** โปรเจคโดยอัตโนมัติ
4. **รออีก 2 นาที** ให้ build เสร็จ
5. **ได้ URL** เช่น: `https://your-project-name.glitch.me`

---

## 📝 ต่อจากนั้น - Update Frontend API URL:

1. เปิด: https://github.com/songyos2528/website/settings/secrets/actions
2. แก้ไข Secret: `REACT_APP_API_URL`
3. เปลี่ยนเป็น: 
   ```
   https://your-glitch-url.glitch.me
   ```
   (แทนที่ `your-glitch-url` ด้วยชื่อโปรเจค Glitch ที่ได้)

4. Frontend rebuild อัตโนมัติ → เสร็จ! ✅

---

## ✔️ ตรวจสอบ:
```bash
curl https://your-glitch-url.glitch.me/api/projects
```

ควรแสดง JSON ของโปรเจค 🎉

---

## 💡 Tips Glitch:
- Edit code ได้โดยตรงใน browser
- Auto-reload เมื่อมี code changes
- Free tier: ปกติทำงาน 24/7 (ตราบเท่าที่ใช้งาน)
