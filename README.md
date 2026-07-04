# Machine-Sparepart

Starter project สำหรับ GitHub Pages และโดเมนแบบกำหนดเอง

## โครงสร้าง
- index.html
- css/style.css
- js/app.js
- CNAME
- .github/workflows/deploy.yml

## การติดตั้งและ Deploy
1. Push โค้ดขึ้น GitHub
2. เปิด Repository Settings > Pages
3. เลือก Source เป็น GitHub Actions
4. ตรวจสอบให้แน่ใจว่าไฟล์ CNAME มีค่าเป็น:
   - machine.sparepart.com
5. ใน DNS ของโดเมน ให้เพิ่ม A Record หรือ CNAME ไปยัง GitHub Pages ตามที่ GitHub กำหนด

## การตั้งค่า API
แก้ไขค่า API ใน js/app.js เป็น URL Google Apps Script ของคุณ

## โดเมนแบบกำหนดเอง
ไฟล์ CNAME ถูกสร้างไว้แล้วสำหรับโดเมน:
- machine.sparepart.com
