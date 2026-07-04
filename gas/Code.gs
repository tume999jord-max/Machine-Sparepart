// Sample data - Replace with Google Sheets data source
const SAMPLE_DATA = [
  {date:"2026-07-04",time:"08:14",machine:"EMB-0001",type:"Barudan embroidery machine",part:"นิด",reason:"ตัดไหม",qty:1},
  {date:"2026-07-03",time:"09:29",machine:"CTM-0014",type:"เครื่องบิดริบบิ้น / Buradan",part:"แมกนัท",reason:"ชำรุด error",qty:2},
  {date:"2026-07-02",time:"12:33",machine:"EMB-0004",type:"Buradan embroidery machine",part:"แมกนัท",reason:"ชำรุด",qty:1},
  {date:"2026-07-02",time:"13:03",machine:"EMB-0001",type:"เครื่องบิดริบบิ้น / Hand Knife",part:"แมกนัท",reason:"ชำรุด",qty:2}
];

function doGet(e) {
  const action = e.parameter.action || 'getSummary';

  if (action === 'getSummary') {
    return getSummary();
  }

  return sendJson({ error: 'Unknown action' });
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // TODO: Save to Google Sheets
    // For now, just return success
    
    return sendJson({
      ok: true,
      message: 'บันทึกข้อมูลสำเร็จ',
      saved: data
    });
  } catch (error) {
    return sendJson({ error: error.toString() }, 400);
  }
}

function getSummary() {
  const items = SAMPLE_DATA; // TODO: Load from Google Sheets
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = new Date().toISOString().slice(0, 7);
  
  const todayItems = items.filter(i => i.date === today).length;
  const monthItems = items.filter(i => i.date.startsWith(thisMonth)).length;
  const totalQty = items.reduce((sum, i) => sum + (i.qty || 0), 0);
  
  // Get most common machine
  const machineCount = {};
  items.forEach(i => {
    machineCount[i.machine] = (machineCount[i.machine] || 0) + 1;
  });
  const topMachine = Object.keys(machineCount).reduce((a, b) => 
    machineCount[a] > machineCount[b] ? a : b, '-');

  return sendJson({
    ok: true,
    todayItems: todayItems,
    monthItems: monthItems,
    totalQty: totalQty,
    topMachine: topMachine,
    topTech: 'วีเทพ และมนุษย์',
    recentItems: items.slice(0, 10)
  });
}

function sendJson(data, status = 200) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
