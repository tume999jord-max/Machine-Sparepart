# Machine-Sparepart

Starter project สำหรับใช้หน้าเว็บกับ Google Apps Script และ deploy บน GitHub Pages

## โครงสร้าง
- index.html
- css/style.css
- js/app.js
- gas/Code.gs
- CNAME
- .github/workflows/deploy.yml

## การติดตั้งและ Deploy
1. Push โค้ดขึ้น GitHub
2. เปิด Repository Settings > Pages
3. เลือก Source เป็น GitHub Actions
4. ตรวจสอบให้แน่ใจว่าไฟล์ CNAME มีค่าเป็น:
   - machine.sparepart.com
5. ใน DNS ของโดเมน ให้เพิ่ม A Record หรือ CNAME ไปยัง GitHub Pages ตามที่ GitHub กำหนด

## การตั้งค่า Google Apps Script
1. เปิด Google Apps Script แล้วสร้าง Web App
2. Deploy เป็น Web App
3. Copy URL ที่ได้จาก Apps Script
4. ใส่ URL ในหน้าเว็บที่ช่อง URL
5. กดปุ่ม "ทดสอบการเชื่อมต่อ"

## ตัวอย่าง backend
ไฟล์ตัวอย่างอยู่ที่:
- gas/Code.gs

ตัวอย่างโค้ดรองรับทั้ง GET และ POST โดยคืนค่าเป็น JSON
