# วิเคราะห์และเตรียมอัปเดต BSBuildTh

วันที่ตรวจ: 9 กันยายน 2026
ฐานโค้ด: main / 05a0d31b4cb89818d268f90413249fa86980bbdd

## สถานะอัปเดต

รายงานนี้คงหลักฐานก่อนแก้ไว้เพื่ออธิบายที่มาของงาน ใช้ [แผนงานหลัก](project-plan.md) สำหรับสถานะปัจจุบันและ [ผลตรวจล่าสุด](validation-current.md) สำหรับผลหลังทำชุดอัปเดต ปัญหาฟอร์ม สิทธิ์ สื่อ CI ใบเสนอราคา และ SEO ด้านล่างแก้ในเครื่องแล้ว ส่วนการเปิดใช้ production ยังรอสิทธิ์ Firebase/GitHub

## สถานะที่ยืนยันได้

- ดาวน์โหลดโค้ดไว้ที่ D:\bsbuildth แล้ว
- หน้าเว็บใช้ React 19, Vite 8 และ React Router 7; ข้อมูลและการล็อกอินใช้ Firebase Firestore/Auth
- ฟอร์มติดต่อบันทึก Firestore และเรียก Google Apps Script เพื่อแจ้งเตือน
- api/ เป็น Express API อีกชุดหนึ่ง ซึ่งใช้ข้อมูลในหน่วยความจำ; ไม่ใช่แหล่งข้อมูลหลักที่ app/src/firebase/api.js เรียกใช้
- GitHub Actions รายงาน frontend build และ Pages deployment ล่าสุดสำเร็จวันที่ 15 มิถุนายน 2026
- มี package-lock.json ทั้ง app/ และ api/ แต่ workflow ใช้ npm install
- GitHub connector ที่ใช้ตรวจครั้งนี้รายงาน pull=true, push=false
- ยังไม่ยืนยันกฎ Firebase ที่เผยแพร่จริง การส่งอีเมลจริง หรือหน้าตาเว็บไซต์ผ่านเบราว์เซอร์ เครื่องมือเว็บเปิด URL เว็บไซต์ไม่สำเร็จ จึงไม่สรุปว่าเว็บไซต์ล่ม

## ลำดับแก้ไข

### P1: ฟอร์มติดต่ออาจรายงานความสำเร็จทั้งที่ข้อมูลไม่ถูกบันทึก

หลักฐาน: app/src/components/Footer.jsx, handleSubmit

เมื่อ submitContact ล้มเหลว โค้ดเพียงบันทึก error แล้วทำต่อจนแสดงข้อความสำเร็จและล้างฟอร์ม ขณะที่การแจ้งเตือนเป็น no-cors แบบไม่รอผล จึงยืนยันการรับข้อมูลไม่ได้

เตรียมแก้: ให้การบันทึก Firestore เป็นเงื่อนไขสำเร็จ เก็บข้อมูลในฟอร์มเมื่อผิดพลาด เพิ่มสถานะกำลังส่งป้องกันกดซ้ำ และแยกสถานะการแจ้งเตือนออกจากการรับคำขอ

เกณฑ์ผ่าน: จำลองบันทึกล้มเหลวแล้วต้องไม่แสดงสำเร็จ/ไม่ล้างฟอร์ม; สำเร็จแล้วจึงล้าง; กดซ้ำระหว่างรอไม่สร้างคำขอซ้ำ

### P1: สิทธิ์ผู้ดูแลยังตรวจเพียงว่าล็อกอินหรือไม่

หลักฐาน: app/firestore.rules และ app/src/App.jsx

request.auth != null อนุญาตทุกบัญชีที่ authenticated ให้แก้ไขเนื้อหาและอ่าน contacts ได้ ไม่ได้ตรวจบทบาท admin โดยเฉพาะ ผลกระทบจริงขึ้นกับกฎและบัญชีใน Firebase ที่ใช้งานอยู่

เตรียมแก้: ตรวจ admin claim หรือรายชื่อ UID ที่ควบคุมได้ทั้ง Rules และหน้า Admin; เตรียมบัญชีผู้ดูแลก่อนเปลี่ยนกฎเพื่อไม่ให้ผู้ดูแลถูกล็อกออก

เกณฑ์ผ่าน: emulator tests ครอบคลุมผู้ไม่ล็อกอิน ผู้ใช้ทั่วไป และ admin; ผู้ใช้ทั่วไปต้องอ่าน contacts/แก้เนื้อหาไม่ได้

### P1: เนื้อหาที่ซ่อนไว้ยังเปิดอ่านในฐานข้อมูลได้

หลักฐาน: app/firestore.rules เปิด read ของ articles/projects และ app/src/firebase/api.js กรอง is_visible หลังดาวน์โหลด

การซ่อนเป็นเพียงการไม่แสดงใน UI ไม่ใช่การจำกัดสิทธิ์เข้าถึงร่างบทความ เตรียมกำหนดความหมายของสถานะซ่อน แล้วปรับ query และ Rules พร้อมกัน รวมถึงย้ายเอกสารเก่าที่ไม่มี is_visible

เกณฑ์ผ่าน: ถ้าสถานะซ่อนหมายถึงร่าง ผู้ไม่ล็อกอินต้องอ่านร่างโดยตรงไม่ได้ แต่หน้าเว็บสาธารณะยังโหลดเนื้อหาที่เผยแพร่ได้

### P2: การอัปโหลดสื่อไม่มีการตรวจขนาดเอกสารหลังแปลง

หลักฐาน: app/src/firebase/api.js, fileToResizedDataURL และ app/src/pages/Admin.jsx

รูปถูกแปลงเป็น data URL ส่วนวิดีโอถูกอ่านเต็มไฟล์ แล้วนำไปบันทึกในเอกสาร Firestore ซึ่งจำกัดเอกสารไว้ 1 MiB การเตือนวิดีโอที่ 10 MB ในหน้า Admin ไม่เพียงพอ

เตรียมแก้: จำกัดชนิด/ขนาดและตรวจขนาด payload ก่อนบันทึก; วางแผนเก็บไฟล์ใน object storage และเก็บ URL ใน Firestore พร้อมย้ายข้อมูลเดิมโดยคงการแสดงผล

เกณฑ์ผ่าน: ไฟล์เกินขนาดถูกปฏิเสธก่อนเขียนข้อมูล พร้อมข้อความไทย; รูปและ URL เก่ายังแสดงได้

### P2: ขั้นตอนตรวจสอบก่อนเผยแพร่ยังไม่ครบ

หลักฐาน: .github/workflows/deploy-frontend.yml, deploy-backend.yml, api/package.json

Frontend ไม่มี lint/test gate และไม่มี pull_request trigger; backend test เป็น placeholder ที่ล้มเหลวเสมอแต่ workflow ยอมให้ผ่านด้วย continue-on-error อีกทั้งระบุ Node 18 ต่างจาก api engines ที่ระบุ 22.0.0

เตรียมแก้: ใช้ npm ci ตาม lockfile; เพิ่ม PR checks ที่ไม่ deploy; รักษา lint ให้ผ่าน; เพิ่มเฉพาะ regression tests ที่ตรวจพฤติกรรมสำคัญ; ตัดสินใจว่า backend เก่ายังต้องดูแลหรือควรเก็บเป็น legacy ก่อนแก้ workflow ของมัน

### P2: คู่มือและโครงสร้างยังปะปนกับระบบเก่า

README ยังชี้ repository songyos2528/website และสอน deploy backend เป็นขั้นตอนหลัก ทั้งที่ frontend ใช้ Firestore แล้ว มีหลาย deployment workflows และเอกสารสถานะซ้ำกัน

เตรียมแก้: เขียน README ตามสถาปัตยกรรมปัจจุบัน ระบุ env ที่ใช้ วิธีรัน วิธีสำรองข้อมูล และวิธี deploy; เก็บคู่มือเก่าเป็น archive หลังตรวจผู้ใช้งาน; ตรวจ api/api.log, server.js.backup และไฟล์หลงใน app/ ก่อนนำออก

### P3: ประสิทธิภาพและ SEO

- App.jsx import Admin และหน้าบทความแบบ eager: เตรียมแยกโหลดตาม route
- getArticleBySlug โหลดทั้ง collection: เตรียม query ตาม slug และสถานะเผยแพร่
- app/public มีวิดีโอใหญ่สุด 23,259,502 bytes: ตรวจการโหลดจริงก่อนกำหนดงบขนาดไฟล์และบีบอัด
- sitemap มีเพียงหน้าแรกและ /blog: เตรียมสร้างรายการบทความที่เผยแพร่และตรวจ HTTP status เมื่อเปิด URL โดยตรงบน Pages
- แก้แล้ว: แยก RootApp และเพิ่ม cleanup ให้ timers/load listener/reveal observers พร้อม regression test

## ชุดอัปเดตที่แนะนำ

ลำดับและสถานะล่าสุดอยู่ใน [แผนงานหลัก](project-plan.md); รายการต่อไปนี้คือประวัติแผนที่นำไปทำครบในเครื่องแล้ว

อัปเดตตามคำขอล่าสุด: ให้เครื่องมือสร้างใบเสนอราคาเป็นงานหลักถัดไป ดูข้อกำหนดใน [แผนเครื่องมือใบเสนอราคา](quotation-tool-plan.md)

1. เตรียมสิทธิ์ admin และ CI สำหรับงานใหม่ พร้อมแก้ฟอร์มติดต่อที่รายงานสำเร็จผิดพลาด
2. สร้างเครื่องมือใบเสนอราคา: หมวดงาน อุปกรณ์เสริม รายการแถม สูตรคำนวณ งวดชำระ และตัวอย่าง A4 โดยใช้ข้อมูลสมมติ
3. เชื่อมการบันทึกแบบส่วนตัว เลขเอกสารไม่ซ้ำ และประวัติ revision ก่อนเปิดใช้ข้อมูลลูกค้าจริง
4. ตรวจการพิมพ์/บันทึก PDF ภาษาไทย ทั้งเอกสารสั้นและหลายหน้า พร้อมทดสอบคำนวณและสิทธิ์
5. ดำเนินงานสื่อ ประสิทธิภาพ และคู่มือ legacy จากแผนเดิมต่อไป

ก่อนเผยแพร่: สำรอง Firestore และค่าตั้งบริการ ยืนยัน admin ที่เข้าถึงได้ ทดสอบหน้าแรก/บทความ/ล็อกอิน/ฟอร์ม/เครื่องคำนวณ และเตรียมย้อน frontend ไป commit เดิม การย้อน frontend ไม่ย้อนข้อมูลหรือ Rules โดยอัตโนมัติ

## แหล่งตรวจสอบ

- https://github.com/bsbuildth/bsbuildth.github.io/actions/runs/27536222382
- https://github.com/bsbuildth/bsbuildth.github.io/actions/runs/27536239407
- https://firebase.google.com/docs/firestore/security/rules-conditions
- https://firebase.google.com/docs/firestore/quotas

มีการแก้ source code, ฟังก์ชัน, Rules, CI, SEO และเครื่องมือใบเสนอราคาแล้ว รายงานผลเดิมด้านล่างเก็บเป็น baseline; ไม่มี push หรือ deploy

## ผลตรวจในเครื่องก่อนแก้ (ประวัติ)
- Node v24.18.0 และ npm 11.16.0
- npm ci --ignore-scripts สำเร็จ: 275 packages; ไม่ได้รัน dependency vulnerability audit
- npm run build ผ่าน และสร้าง dist/404.html สำเร็จ
- JavaScript หลัก 1,090.86 kB (gzip 244.66 kB); มีคำเตือน chunk ใหญ่กว่า 500 kB
- npm run lint ไม่ผ่าน: 60 errors และ 1 warning (รวม unused variables, no-undef และ React Hooks); รายละเอียดใน lint-baseline-2026-09-09.json ทั้งหมดเป็น baseline ก่อนแก้ไข ไม่ได้หมายความว่าเป็น runtime bugs ทุกข้อ
- ณ รอบ baseline ยังไม่มีการแก้ source code; รอบปัจจุบันเพิ่ม dependencies สำหรับ Rules tests จึงเปลี่ยน lockfile แต่ยังไม่มี push/deploy ดู validation-current.md
