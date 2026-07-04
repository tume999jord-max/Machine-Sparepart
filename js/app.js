// ===================================
// CONFIGURATION
// ===================================

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwBSLceXacaX3xb-mrvbj_Yfv3ERZk9tgRMxD900mSiXtDjpp0AF3NItpEu6c6StWGfng/exec';

let allItems = [];
let dailyReportCache = [];
let monthlyReportCache = [];

// ===================================
// Initialize on DOM Ready
// ===================================

window.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

async function initializeApp() {
  // Set current date/time
  const now = new Date();
  document.getElementById('date').valueAsDate = now;
  document.getElementById('time').value = now.toTimeString().slice(0, 5);

  // Load dashboard
  loadDashboard();

  // Load dropdown options
  loadDeptDropdown();
  loadTechDropdown();

  // Event listeners
  document.getElementById('dept').addEventListener('change', onDeptChange);
  document.getElementById('date').addEventListener('change', validateForm);
  document.getElementById('machineNo').addEventListener('change', validateForm);
  document.getElementById('qty').addEventListener('change', validateForm);

  // Quantity buttons
  document.getElementById('qtyMinus').addEventListener('click', (e) => {
    e.preventDefault();
    const input = document.getElementById('qty');
    let val = parseInt(input.value) || 1;
    if (val > 1) input.value = val - 1;
  });

  document.getElementById('qtyPlus').addEventListener('click', (e) => {
    e.preventDefault();
    const input = document.getElementById('qty');
    let val = parseInt(input.value) || 0;
    input.value = val + 1;
  });

  // Save form
  document.getElementById('addForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveData();
  });

  // Reports
  document.getElementById('reportDate').addEventListener('change', loadReport);
  document.getElementById('reportMonth').addEventListener('change', loadMonthlyReport);

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      switchTab(tabId);
    });
  });

  // Report buttons
  document.getElementById('openReportBtn').addEventListener('click', openReport);
  document.getElementById('closeReportBtn').addEventListener('click', closeReport);
  document.getElementById('openMonthlyReportBtn').addEventListener('click', openMonthlyReport);
  document.getElementById('closeMonthlyReportBtn').addEventListener('click', closeMonthlyReport);

  // Reload button
  document.getElementById('reloadBtn').addEventListener('click', loadDashboard);
}

// ===================================
// FETCH HELPERS
// ===================================

async function fetchFromAppScript(action, params = {}) {
  try {
    let url = `${APPS_SCRIPT_URL}?action=${action}`;
    Object.entries(params).forEach(([key, value]) => {
      if (value) url += `&${key}=${encodeURIComponent(value)}`;
    });

    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    if (!data.ok && data.error) throw new Error(data.error);

    return data.data || data;
  } catch (error) {
    console.error(`Error fetching ${action}:`, error);
    showStatus(`⚠️ ${error.message}`, true);
    return null;
  }
}

async function saveToAppScript(data) {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const result = await response.json();
    if (!result.ok && result.error) throw new Error(result.error);

    return result;
  } catch (error) {
    console.error('Error saving data:', error);
    throw error;
  }
}

// ===================================
// STATUS & NOTIFICATIONS
// ===================================

function showStatus(message, isError = false) {
  const status = document.getElementById('status');
  if (status) {
    status.textContent = message;
    status.className = isError ? 'status error' : 'status';
  }
}

function showPopup(title, message) {
  const popup = document.getElementById('popup');
  if (popup) {
    document.getElementById('popupTitle').textContent = title;
    document.getElementById('popupText').textContent = message;
    popup.classList.add('show');
    setTimeout(() => popup.classList.remove('show'), 2000);
  }
}

// ===================================
// DASHBOARD
// ===================================

async function loadDashboard() {
  showStatus('⏳ กำลังโหลด Dashboard...');

  const data = await fetchFromAppScript('getSummary');
  if (!data) {
    showStatus('❌ ไม่สามารถโหลด Dashboard ได้', true);
    return;
  }

  // Update stats
  document.getElementById('dashToday').textContent = data.todayItems || 0;
  document.getElementById('dashMonth').textContent = data.monthItems || 0;
  document.getElementById('dashQty').textContent = data.totalQty || 0;
  document.getElementById('dashMachine').textContent = data.topMachine || '-';
  document.getElementById('dashTech').textContent = data.topTech || '-';

  // Update recent items
  const recentBox = document.getElementById('dashRecent');
  if (data.recentItems && data.recentItems.length > 0) {
    recentBox.innerHTML = data.recentItems.slice(0, 5).map(item => `
      <div class="recent-item">
        <div class="recent-time">${item.date} ${item.time}</div>
        <div class="recent-main">${item.machine} • ${item.part}</div>
        <div class="recent-qty">${item.qty} ชิ้น</div>
      </div>
    `).join('');
  } else {
    recentBox.innerHTML = '<div class="dashboard-empty">ยังไม่มีรายการ</div>';
  }

  // Store for table
  allItems = data.recentItems || [];

  showStatus('✅ Dashboard โหลดสำเร็จ');
}

// ===================================
// DROPDOWN LOADING
// ===================================

async function loadDeptDropdown() {
  const depts = await fetchFromAppScript('getDepts');
  const select = document.getElementById('dept');

  select.innerHTML = '<option value="">เลือกแผนก</option>';
  if (depts && Array.isArray(depts)) {
    depts.forEach(dept => {
      select.innerHTML += `<option value="${dept}">🏭 ${dept}</option>`;
    });
  }
}

async function loadTechDropdown() {
  const techs = await fetchFromAppScript('getTechs');
  const select = document.getElementById('tech');

  select.innerHTML = '<option value="">เลือกช่าง</option>';
  if (techs && Array.isArray(techs)) {
    techs.forEach(tech => {
      select.innerHTML += `<option value="${tech}">👤 ${tech}</option>`;
    });
  }
}

async function onDeptChange() {
  const dept = document.getElementById('dept').value;
  const machineSelect = document.getElementById('machineNo');
  const badge = document.getElementById('deptBadge');

  if (!dept) {
    machineSelect.innerHTML = '<option value="">— เลือกแผนกก่อน —</option>';
    machineSelect.disabled = true;
    badge.style.display = 'none';
    return;
  }

  // Show badge
  badge.textContent = dept;
  badge.style.display = 'inline-block';

  // Load machines
  machineSelect.innerHTML = '<option value="">⏳ กำลังโหลด...</option>';
  machineSelect.disabled = true;

  const machines = await fetchFromAppScript('getMachines', { dept });

  machineSelect.innerHTML = '<option value="">เลือกทะเบียนเครื่อง</option>';
  if (machines && Array.isArray(machines)) {
    machines.forEach(machine => {
      machineSelect.innerHTML += `<option value="${machine}">${machine}</option>`;
    });
    machineSelect.disabled = false;
  } else {
    machineSelect.innerHTML = '<option value="">ไม่พบเครื่องในแผนกนี้</option>';
  }
}

// ===================================
// FORM VALIDATION & SAVE
// ===================================

function validateForm() {
  const saveBtn = document.getElementById('saveBtn');
  const hasError = !document.getElementById('dept').value ||
                   !document.getElementById('machineNo').value ||
                   !document.getElementById('part').value ||
                   !document.getElementById('reason').value ||
                   !document.getElementById('qty').value ||
                   !document.getElementById('tech').value;

  saveBtn.disabled = hasError;
}

async function saveData() {
  const dept = document.getElementById('dept').value;
  if (!dept) {
    showStatus('⚠️ กรุณาเลือกแผนกก่อน', true);
    return;
  }

  const data = {
    date: document.getElementById('date').value,
    time: document.getElementById('time').value,
    machineNo: document.getElementById('machineNo').value,
    part: document.getElementById('part').value,
    reason: document.getElementById('reason').value,
    qty: parseInt(document.getElementById('qty').value) || 0,
    tech: document.getElementById('tech').value
  };

  if (!data.machineNo || !data.part || !data.reason || data.qty <= 0 || !data.tech) {
    showStatus('⚠️ กรุณากรอกข้อมูลให้ครบทุกช่อง', true);
    return;
  }

  showStatus('💾 กำลังบันทึก...');

  try {
    const result = await saveToAppScript(data);
    showStatus('✅ บันทึกสำเร็จ');
    showPopup('บันทึกสำเร็จ', 'ข้อมูลถูกบันทึกลงในระบบแล้ว');

    // Clear form
    document.getElementById('addForm').reset();
    document.getElementById('date').valueAsDate = new Date();
    document.getElementById('qty').value = '1';

    // Reload dashboard
    setTimeout(loadDashboard, 1000);
  } catch (error) {
    showStatus(`⚠️ ${error.message}`, true);
  }
}

// ===================================
// REPORTS
// ===================================

function openReport() {
  const overlay = document.getElementById('modalOverlay');
  const modal = document.getElementById('reportModal');
  overlay.classList.add('show');
  modal.classList.add('show');

  const today = new Date().toISOString().split('T')[0];
  document.getElementById('reportDate').value = today;
  loadReport();
}

function closeReport() {
  document.getElementById('modalOverlay').classList.remove('show');
  document.getElementById('reportModal').classList.remove('show');
}

async function loadReport() {
  const date = document.getElementById('reportDate').value;
  if (!date) return;

  const content = document.getElementById('reportContent');
  content.innerHTML = '<div class="loading-state">⏳ กำลังโหลด...</div>';

  const data = await fetchFromAppScript('getDailyReport', { date });
  dailyReportCache = Array.isArray(data) ? data : [];

  document.getElementById('reportCount').textContent = `${dailyReportCache.length} รายการ`;

  if (dailyReportCache.length === 0) {
    content.innerHTML = '<div class="empty-state">📭 ไม่พบข้อมูล</div>';
    return;
  }

  content.innerHTML = dailyReportCache.map(r => `
    <div class="report-card">
      <div class="report-card-header">
        <span class="machine-tag">${r.machine}</span>
        <span class="time-tag">${r.time}</span>
      </div>
      <div class="report-row">
        <span>${r.type}</span>
        <span>👤 ${r.tech}</span>
      </div>
      <div class="report-row">
        <span>🔧 อะไหล่: ${r.part}</span>
        <span>📦 จำนวน: ${r.qty}</span>
      </div>
      <div class="report-reason">📝 สาเหตุ: ${r.reason}</div>
    </div>
  `).join('');
}

function openMonthlyReport() {
  const overlay = document.getElementById('monthlyOverlay');
  const modal = document.getElementById('monthlyModal');
  overlay.classList.add('show');
  modal.classList.add('show');

  const now = new Date();
  const ym = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  document.getElementById('reportMonth').value = ym;
  loadMonthlyReport();
}

function closeMonthlyReport() {
  document.getElementById('monthlyOverlay').classList.remove('show');
  document.getElementById('monthlyModal').classList.remove('show');
}

async function loadMonthlyReport() {
  const ym = document.getElementById('reportMonth').value;
  if (!ym) return;

  const content = document.getElementById('monthlyContent');
  content.innerHTML = '<div class="loading-state">⏳ กำลังโหลด...</div>';

  const data = await fetchFromAppScript('getMonthlyReport', { ym });
  monthlyReportCache = Array.isArray(data) ? data : [];

  document.getElementById('monthlyCount').textContent = `${monthlyReportCache.length} รายการ`;

  if (monthlyReportCache.length === 0) {
    content.innerHTML = '<div class="empty-state">📭 ไม่พบข้อมูล</div>';
    return;
  }

  content.innerHTML = monthlyReportCache.map(r => `
    <div class="report-card">
      <div class="report-card-header">
        <span class="machine-tag">${r.machine}</span>
        <span class="time-tag">${r.date} ${r.time}</span>
      </div>
      <div class="report-row">
        <span>${r.type}</span>
        <span>👤 ${r.tech}</span>
      </div>
      <div class="report-row">
        <span>🔧 อะไหล่: ${r.part}</span>
        <span>📦 จำนวน: ${r.qty}</span>
      </div>
      <div class="report-reason">📝 สาเหตุ: ${r.reason}</div>
    </div>
  `).join('');
}

// ===================================
// TAB SWITCHING
// ===================================

function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));

  document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
  document.getElementById(tabId).classList.add('active');
}
