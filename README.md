# BSBuildTh

เว็บไซต์ผลงานรับเหมาก่อสร้างและรีโนเวท พร้อมระบบจัดการเนื้อหาและฟอร์มติดต่อ
หน้าเว็บใช้ React + Vite; ข้อมูลและล็อกอินใช้ Firebase Firestore/Auth; เผยแพร่ frontend ผ่าน GitHub Pages

## สถานะและแผน

- [แผนงานหลักและสถานะเปิดใช้](docs/project-plan.md)
- [ผลตรวจล่าสุด](docs/validation-current.md)
- [เครื่องมือสร้างใบเสนอราคา — MVP พร้อมตรวจในเครื่อง](docs/quotation-tool-plan.md)
- [แนวคิดเว็บไซต์ 3D — แผนเฟสถัดไป](docs/website-3d-plan.md)
- [รายงานวิเคราะห์โครงการ](docs/update-readiness-2026-09-09.md)

## รันและตรวจในเครื่อง

ใช้ Node 22 ตาม frontend workflow หรือรุ่นที่รองรับ dependencies ใน lockfile (รอบตรวจนี้ใช้ Node 24.18.0)

```sh
cd app
npm ci
npm run dev
```

ตั้งค่า Firebase สำหรับสภาพแวดล้อมทดสอบตาม app/.env.example ใน app/.env.local ก่อนทดสอบการเชื่อมต่อจริง อย่าใส่บัญชีผู้ดูแลหรือข้อมูลลูกค้าใน Git

```sh
npm run lint -- --max-warnings 0
npm test
npm run test:rules
npm run build
```

Build สร้าง app/dist และ 404.html สำหรับ routes บน GitHub Pages การ build ผ่านไม่ได้ยืนยันว่าการล็อกอิน ฐานข้อมูล หรือการแจ้งเตือนใช้งานจริง

## โครงสร้าง

- app/src: UI หน้าเว็บ/Admin/เครื่องมือใบเสนอราคา และ Firebase data access
- app/firestore.rules และ app/storage.rules: กฎที่ตรวจด้วย Emulator แล้ว; ต้อง deploy ด้วยบัญชีที่เข้าถึงโปรเจกต์ `bs-build`
- app/tests: regression tests
- api/: Express API รุ่นเก่า แยกจากข้อมูล Firestore ที่ frontend ใช้; ยังไม่ยืนยันว่ามีผู้ใช้บริการนี้อยู่
- .github/workflows/: frontend checks/deployment และ workflows ของ backend รุ่นเก่าที่เรียกใช้ด้วยมือเท่านั้น
- docs/: แผนปัจจุบัน ผลตรวจ แผนใบเสนอราคา และแผนเว็บไซต์ 3D

ฟอร์มติดต่อใช้ Firestore ร่วมกับ Google Apps Script สำหรับการแจ้งเตือน ไม่ต้อง deploy API เก่าเพื่อให้ frontend อ่าน Firestore แต่ต้องตรวจ configuration ของบริการจริง

เอกสาร deployment/status อื่นที่ root เป็นประวัติโครงการ อาจอ้าง repository และโครงสร้างเดิม ให้ยึดแผนหลักข้างต้น การเผยแพร่ยังรอสิทธิ์เขียน GitHub และสิทธิ์ดูแล Firebase `bs-build`
