> เอกสารประวัติ: เนื้อหาด้านล่างอ้างสถานะ/แผนเดิม ไม่ใช่รายการงานปัจจุบัน โปรดใช้ [แผนงานหลัก](docs/project-plan.md) และ [ผลตรวจล่าสุด](docs/validation-current.md) ก่อนดำเนินการ

# Deploy ไป Vercel อย่างอัตโนมัติ (ใช้เวลา 1 นาที)

## เหตุใดจึงใช้ Vercel:
✅ Auto-deploy จาก GitHub (ไม่ต้องตั้ง webhook)  
✅ Free tier ที่ดี  
✅ Deploy อัตโนมัติทุกครั้งที่ push code  
✅ ใช้ได้กับ Node.js + Express ได้ดี  

## วิธีการ (เพียง 1 ลิงก์):

### คลิกลิงก์นี้เพื่อติดตั้ง Vercel:
```
https://vercel.com/import/project?repo=https://github.com/songyos2528/website
```

### ขั้นตอน:
1. ลงชื่อเข้าใช้ด้วย GitHub account
2. Vercel จะถามว่า "Authorize with GitHub" → ยอมรับ
3. เลือก Repository: `website`
4. ตั้ง Root Directory: `api`
5. ตั้ง Node Version: `18.x`
6. คลิก "Deploy"

### อันี้แหละ! ✨
- Vercel จะ deploy backend โดยอัตโนมัติ
- ทุกครั้งที่ push ไป GitHub จะ auto-deploy
- จะได้ URL เช่น: `website-api.vercel.app`

---

## อัปเดต API URL ใน GitHub:

หลังจาก Vercel deploy สำเร็จ:

1. เปิด GitHub Secrets: https://github.com/songyos2528/website/settings/secrets/actions
2. แก้ไข `REACT_APP_API_URL`
3. เปลี่ยน URL จาก `https://website-api-lmf9.onrender.com` เป็น:
   ```
   https://website-api.vercel.app
   ```
   (หรือใช้ domain ของ Vercel ที่แสดงมาให้)

4. Frontend จะ rebuild อัตโนมัติ

---

## ตรวจสอบว่าสำเร็จ:
```bash
curl https://website-api.vercel.app/api/projects
```

ควรแสดง JSON data ของโปรเจค ✅
