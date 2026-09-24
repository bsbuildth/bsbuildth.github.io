# Google Apps Script: รูปสำรวจหน้างานแบบฟรี

ระบบนี้เก็บรูปต้นฉบับใน Google Drive ของเจ้าของบัญชีโดยตรง ไม่ใช้ Firebase Storage และไม่ให้มือถือขอสิทธิ์ Drive ทุกครั้ง

## ตั้งค่าหนึ่งครั้ง

1. เปิด [script.google.com](https://script.google.com) ด้วยบัญชี `bsbuildth@gmail.com` แล้วสร้างโปรเจกต์ใหม่ชื่อ `BS Build Survey Drive`.
2. วางเนื้อหาจาก `BSBuildSurveyDrive.gs` ลงไฟล์ `Code.gs`.
3. ใน **Project Settings → Script properties** เพิ่มค่าดังนี้

| ชื่อ | ค่า |
| --- | --- |
| `DRIVE_ROOT_FOLDER_ID` | เว้นว่างได้ ระบบจะสร้างโฟลเดอร์ `BS BUILD - รูปสำรวจหน้างาน` ให้อัตโนมัติ |
| `ALLOWED_EMAILS` | เว้นว่างได้ ระบบอนุญาต `bsbuildth@gmail.com,songyos2528@gmail.com` อัตโนมัติ |

4. กด **Deploy → New deployment → Web app** แล้วตั้ง `Execute as: Me` และ `Who has access: Anyone` จากนั้นอนุมัติสิทธิ์เพียงครั้งเดียวในบัญชีเจ้าของ Drive.
5. คัดลอก URL ที่ลงท้าย `/exec` และใส่ในไฟล์ `app/.env.production` และ `app/.env.development.local`:

```env
VITE_SITE_SURVEY_APPS_SCRIPT_URL=https://script.google.com/macros/s/.../exec
```

6. สร้างเว็บใหม่และทดสอบด้วยรูปหนึ่งรูปก่อนใช้งานจริง.

## ข้อจำกัดโหมดฟรี

- ครั้งละไม่เกิน 5 รูป, รูปละไม่เกิน 8 MB
- ระบบส่งทีละรูปเพื่อให้มือถือไม่ค้าง และติดตามผลจาก Firebase
- รูปต้นฉบับอยู่ใน Drive เท่านั้น
- ห้ามเปิดเผยค่า Script properties หรือแก้ `ALLOWED_EMAILS` เป็นบัญชีที่ไม่เกี่ยวข้อง
