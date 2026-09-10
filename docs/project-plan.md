# แผนงานหลัก BSBuildTh

อัปเดตล่าสุด: 9 กันยายน 2026

ฐานโค้ดก่อนแก้: `05a0d31b4cb89818d268f90413249fa86980bbdd`

เอกสารนี้เป็นสถานะหลักของโปรเจกต์แทนคู่มือ deployment รุ่นเก่าที่ root งานรอบนี้แก้ baseline 60 errors/1 warning และทำงานค้างที่เกี่ยวข้องให้พร้อมเผยแพร่ โดยยังไม่ push หรือเปลี่ยนข้อมูล production

## สถานะงานทั้งหมด

| งาน | สถานะ | ผลลัพธ์ / ขั้นตอนที่เหลือ |
| --- | --- | --- |
| แก้ lint 60 errors/1 warning | เสร็จในเครื่อง | 0 errors/0 warnings โดยไม่ปิดกฎ |
| ฟอร์มติดต่อ | เสร็จในเครื่อง | Firestore เป็นเงื่อนไขสำเร็จ, ไม่ล้างฟอร์มเมื่อผิดพลาด, ป้องกันกดซ้ำ, แจ้งเตือนเป็นงานรอง |
| สิทธิ์ผู้ดูแล | โค้ดและ Rules เสร็จ | ใช้ Firebase custom claim `admin`; ต้องให้สิทธิ์โปรเจกต์ `bs-build` แก่บัญชี CLI แล้วตั้ง claim ให้ `bsbuildth@gmail.com` |
| ป้องกันร่างและ contacts | เสร็จในเครื่อง | public query อ่านเฉพาะ `is_visible`, Rules จำกัดร่าง/contacts และมี migration แบบ dry run |
| CI และ deploy gate | เสร็จในเครื่อง | PR รัน install, lint, tests, Firestore Emulator และ build; Pages deploy ทำต่อเมื่อ checks ผ่าน |
| เครื่องมือใบเสนอราคา | เสร็จรุ่น MVP ในเครื่อง | editor, หมวด/รายการ, รายการฟรี/ลูกค้าจัดหาเอง, งวด, คัดลอก, พิมพ์, ค้นหา และประวัติ revision |
| บันทึกและออกเอกสาร | เสร็จในเครื่อง | private Firestore, version conflict, เลขเอกสารไม่ซ้ำ, snapshot revision และสถานะ draft/issued/void |
| PDF ภาษาไทย | เสร็จและตรวจภาพ | ตัวอย่าง A4 1 หน้าและข้อมูลยาว 3 หน้า; ยอดและหัวตารางถูกต้อง |
| สื่อ | เสร็จในเครื่อง | จำกัดชนิด/ขนาด, รูปแบบ fallback ต่ำกว่า 650 KB, รองรับ Storage และ migration แบบ dry run |
| ประสิทธิภาพและ SEO | เสร็จในเครื่อง | lazy routes, query slug, sitemap บทความ, static direct routes และแยก bundle จน build ไม่มีคำเตือน chunk ใหญ่ |
| บริการ backend เก่า | พักอย่างปลอดภัย | Render/Railway/Vercel/Fly workflows เปลี่ยนเป็น manual เพื่อไม่ deploy อัตโนมัติ; โค้ดยังคงอยู่เผื่อย้อนกลับ |
| แนวคิดเว็บ 3D | วางแผนเท่านั้น | เก็บใน [แผนเว็บไซต์ 3D](website-3d-plan.md); เริ่มเมื่อผู้ใช้อนุมัติเฟสใหม่หลังเปิดใช้ชุดปัจจุบัน |

## สิ่งที่ต้องทำใน production

1. เพิ่ม `bsbuildth@gmail.com` เป็นสมาชิกของ Firebase/Google Cloud โปรเจกต์ `bs-build` จากบัญชีเจ้าของโปรเจกต์ บัญชีนี้เข้าสู่ Firebase CLI สำเร็จแล้วแต่ยังไม่มีสิทธิ์โปรเจกต์
2. สำรอง Firestore แล้วรันคำสั่ง dry run สำหรับ visibility/media; ตรวจจำนวนก่อน `--apply`
3. ตั้ง custom claim `admin` ให้ทั้งบัญชีเดิม `songyos2528@gmail.com` และบัญชีใหม่ `bsbuildth@gmail.com` แล้วให้ผู้ใช้ล็อกอินใหม่เพื่อรับ token ใหม่
4. deploy Firestore/Storage Rules และตัวแปร GitHub Actions โดยเฉพาะ Firebase config, `VITE_USE_STORAGE` และ Apps Script URL ถ้ายังใช้การแจ้งเตือน
5. ทดสอบ smoke test ด้วยข้อมูลสมมติบน production: หน้าแรก, บทความ, ฟอร์ม, admin, บันทึกร่าง, ออก revision และ Save as PDF
6. push branch และเปิด PR เมื่อสิทธิ์ GitHub แบบเขียนพร้อมใช้งาน

## เกณฑ์ตรวจรับที่ผ่านแล้ว

- ตัวอย่างใบเสนอราคาคำนวณงานหลัก 55,010.00 บาท อุปกรณ์ 44,500.00 บาท รวม 99,510.00 บาท
- งวดจากยอดงานหลักเป็น 22,004.00 / 22,004.00 / 11,002.00 บาท และรายการฟรีไม่เพิ่มยอด
- ผู้ไม่ล็อกอินและผู้ใช้ทั่วไปเข้าถึงข้อมูล admin/ใบเสนอราคาไม่ได้ใน Emulator
- ฟอร์มที่บันทึกล้มเหลวไม่แสดงสำเร็จและลองส่งใหม่ได้
- build สร้างเส้นทางบทความโดยตรงและ sitemap จากบทความสาธารณะ
- PDF A4 ภาษาไทยไม่ตัดข้อความ ตารางต่อหน้าได้ และไม่มีข้อมูลลูกค้าจริง

ดูผลตรวจล่าสุดที่ [validation-current.md](validation-current.md) และข้อกำหนดผลิตภัณฑ์ที่ [quotation-tool-plan.md](quotation-tool-plan.md)

## ข้อจำกัดปัจจุบัน

Firebase CLI ใช้บัญชีหลัก `bsbuildth@gmail.com` แล้ว แต่ `projects:list` ของบัญชีนี้ว่าง และการเข้าถึง `bs-build` ตอบ 403 `PERMISSION_DENIED` จึงยังตั้ง admin claim, deploy Rules, สำรองหรือ migration production ไม่ได้ GitHub connector มีสิทธิ์อ่านแต่ไม่มีสิทธิ์ push จึงยังไม่เผยแพร่ชุดนี้
