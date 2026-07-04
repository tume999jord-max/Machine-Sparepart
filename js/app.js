let allItems = [];

// ⚙️ ตั้งค่า Apps Script URL
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwBSLceXacaX3xb-mrvbj_Yfv3ERZk9tgRMxD900mSiXtDjpp0AF3NItpEu6c6StWGfng/exec';

window.addEventListener('DOMContentLoaded', () => {
  const scriptUrlInput = document.getElementById('scriptUrl');
  const statusEl = document.getElementById('status');
  const reloadBtn = document.getElementById('reloadBtn');
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const addForm = document.getElementById('addForm');
  const searchInput = document.getElementById('searchInput');
  
  // Quantity control
  const qtyInput = document.getElementById('qty');
  const qtyMinus = document.getElementById('qtyMinus');
  const qtyPlus = document.getElementById('qtyPlus');
  
  // QR Scan button
  const btnScan = document.querySelector('.btn-scan');

  // ตั้งค่า URL อัตโนมัติ
  scriptUrlInput.value = APPS_SCRIPT_URL;
  scriptUrlInput.disabled = true;
  scriptUrlInput.style.opacity = '0.7';
  scriptUrlInput.title = 'ตั้งค่า: APPS_SCRIPT_URL';

  function setStatus(message, isError = false) {
    statusEl.textContent = message;
    statusEl.className = `status-bar${isError ? ' error' : ''}`;
  }

  function getScriptUrl() {
    return APPS_SCRIPT_URL;
  }

  // Quantity control handlers
  qtyMinus.addEventListener('click', (e) => {
    e.preventDefault();
    let val = parseInt(qtyInput.value) || 1;
    if (val > 1) {
      qtyInput.value = val - 1;
    }
  });

  qtyPlus.addEventListener('click', (e) => {
    e.preventDefault();
    let val = parseInt(qtyInput.value) || 1;
    qtyInput.value = val + 1;
  });

  // QR Code scan handler (placeholder)
  btnScan.addEventListener('click', (e) => {
    e.preventDefault();
    setStatus('⏳ กำลังสแกน QR Code... (ฟีเจอร์กำลังพัฒนา)');
    // TODO: Implement QR code scanning
  });

  async function loadData() {
    const url = getScriptUrl();
    if (!url) {
      setStatus('⚠️ กรุณาตั้งค่า URL Google Apps Script', true);
      return;
    }

    setStatus('⏳ กำลังโหลดข้อมูล...');

    try {
      const response = await fetch(`${url}?action=getSummary`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      allItems = data.recentItems || [];
      
      updateDashboard(data);
      updateItemsTable(allItems);
      setStatus('✅ โหลดข้อมูลเสร็จสิ้น');
    } catch (error) {
      setStatus(`⚠️ ${error.message}`, true);
    }
  }

  function updateDashboard(data) {
    document.getElementById('todayItems').textContent = data.todayItems || 0;
    document.getElementById('monthItems').textContent = data.monthItems || 0;
    document.getElementById('totalQty').textContent = data.totalQty || 0;
    document.getElementById('topMachine').textContent = data.topMachine || '-';
    
    const recentList = document.getElementById('recentList');
    recentList.innerHTML = (data.recentItems || []).slice(0, 5).map(item => `
      <div class="item-row">
        <h4>${item.machine} - ${item.part}</h4>
        <p><strong>📅 วันที่:</strong> ${item.date} <strong>⏰ เวลา:</strong> ${item.time}</p>
        <p><strong>🎫 ประเภท:</strong> ${item.type} | <strong>📄 เหตุผล:</strong> ${item.reason}</p>
        <p><strong>📋 จำนวน:</strong> ${item.qty}</p>
      </div>
    `).join('');
  }

  function updateItemsTable(items) {
    const tbody = document.getElementById('itemsBody');
    tbody.innerHTML = items.map(item => `
      <tr>
        <td>${item.date}</td>
        <td>${item.time}</td>
        <td>${item.machine}</td>
        <td>${item.type}</td>
        <td>${item.part}</td>
        <td>${item.reason}</td>
        <td>${item.qty}</td>
      </tr>
    `).join('');
  }

  function filterSearch() {
    const query = searchInput.value.toLowerCase();
    const filtered = allItems.filter(item => 
      item.machine.toLowerCase().includes(query) ||
      item.part.toLowerCase().includes(query) ||
      item.reason.toLowerCase().includes(query) ||
      item.type.toLowerCase().includes(query)
    );

    const tbody = document.getElementById('searchBody');
    tbody.innerHTML = filtered.map(item => `
      <tr>
        <td>${item.date}</td>
        <td>${item.time}</td>
        <td>${item.machine}</td>
        <td>${item.type}</td>
        <td>${item.part}</td>
        <td>${item.reason}</td>
        <td>${item.qty}</td>
      </tr>
    `).join('');
  }

  // แท็บสลับ
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });

  // โหลดข้อมูลใหม่
  reloadBtn.addEventListener('click', loadData);

  // เพิ่มรายการใหม่
  addForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      date: document.getElementById('date').value,
      time: document.getElementById('time').value,
      department: document.getElementById('department').value,
      machine: document.getElementById('machineCode').value,
      part: document.getElementById('part').value,
      reason: document.getElementById('reason').value,
      reasonDetail: document.getElementById('reasonDetail').value,
      qty: parseInt(document.getElementById('qty').value),
      technician: document.getElementById('technician').value
    };

    try {
      const url = getScriptUrl();
      if (!url) throw new Error('กรุณาตั้งค่า URL Google Apps Script');

      setStatus('💾 กำลังบันทึกข้อมูล...');

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      setStatus('✅ บันทึกรายการสำเร็จ');
      addForm.reset();
      document.getElementById('date').valueAsDate = new Date();
      document.getElementById('qty').value = 1;
      
      // โหลดข้อมูลใหม่หลังจาก 1 วินาที
      setTimeout(loadData, 1000);
    } catch (error) {
      setStatus(`⚠️ ${error.message}`, true);
    }
  });

  // ค้นหา
  searchInput.addEventListener('input', filterSearch);

  // ตั้งวันที่ปัจจุบัน
  document.getElementById('date').valueAsDate = new Date();

  // โหลดข้อมูลเมื่อเริ่มต้น
  loadData();
});
