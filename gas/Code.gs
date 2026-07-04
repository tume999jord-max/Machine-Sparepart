// ============================================
// Google Apps Script - Machine Spare Parts
// ============================================

function doGet(e) {
  var action = e && e.parameter && e.parameter.action;

  if (action === 'getSummary') {
    return sendJson(getDashboardSummary());
  }
  
  if (action === 'getDepts') {
    return sendJson({ ok: true, data: getDeptList() });
  }
  
  if (action === 'getMachines') {
    var dept = e.parameter.dept || '';
    return sendJson({ ok: true, data: getMachineListByDept(dept) });
  }
  
  if (action === 'getTechs') {
    return sendJson({ ok: true, data: getTechList() });
  }
  
  if (action === 'getReasons') {
    return sendJson({ ok: true, data: getReasonList() });
  }
  
  if (action === 'getDailyReport') {
    var date = e.parameter.date || '';
    return sendJson({ ok: true, data: getDailyReport(date) });
  }
  
  if (action === 'getMonthlyReport') {
    var ym = e.parameter.ym || '';
    return sendJson({ ok: true, data: getMonthlyReport(ym) });
  }

  return sendJson({ error: 'Unknown action' }, 400);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    saveData(data);
    
    return sendJson({
      ok: true,
      message: 'บันทึกข้อมูลสำเร็จ',
      saved: data
    });
  } catch (error) {
    return sendJson({ error: error.toString() }, 400);
  }
}

// ============================================
// GET DROPDOWNS DATA
// ============================================

function getDeptList() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("ทะเบียนเครื่องจักร");
  
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const data = sheet.getRange(2, 3, lastRow - 1, 1)
    .getValues()
    .flat()
    .filter(function(v) { return v !== ""; });

  return [...new Set(data)];
}

function getMachineListByDept(dept) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("ทะเบียนเครื่องจักร");
  
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const data = sheet.getRange(2, 1, lastRow - 1, 3).getValues();

  return data
    .filter(function(row) {
      return row[2] === dept && row[0] !== "";
    })
    .map(function(row) {
      return row[0];
    });
}

function getTechList() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("รายชื่อช่าง");
  
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  return sheet.getRange(2, 1, lastRow - 1, 1)
    .getValues()
    .flat()
    .filter(function(v) { return v !== ""; });
}

function getReasonList() {
  return [
    "เสียหาย",
    "บำรุงรักษา",
    "ป้องกัน",
    "อัปเกรด",
    "อื่น ฯ"
  ];
}

// ============================================
// GET DASHBOARD SUMMARY
// ============================================

function getDashboardSummary() {
  var now = new Date();
  var tz  = Session.getScriptTimeZone();
  var today = Utilities.formatDate(now, tz, "yyyy-MM-dd");
  var ym = Utilities.formatDate(now, tz, "yyyy-MM");

  var monthRows = getMonthlyReport(ym);
  var dayRows = monthRows.filter(function(row) {
    return row.date === today;
  });

  var totalQty = 0;
  var machines = {};
  var techs = {};

  monthRows.forEach(function(row) {
    totalQty += Number(row.qty) || 0;

    if (row.machine) {
      machines[row.machine] = (machines[row.machine] || 0) + 1;
    }

    if (row.tech) {
      techs[row.tech] = (techs[row.tech] || 0) + 1;
    }
  });

  var topMachine = Object.keys(machines).length
    ? Object.entries(machines).sort(function(a, b) { return b[1] - a[1]; })[0][0]
    : "-";

  var topTech = Object.keys(techs).length
    ? Object.entries(techs).sort(function(a, b) { return b[1] - a[1]; })[0][0]
    : "-";

  return {
    ok: true,
    todayItems: dayRows.length,
    monthItems: monthRows.length,
    totalQty: totalQty,
    topMachine: topMachine,
    topTech: topTech,
    recentItems: monthRows.slice(-5).reverse()
  };
}

// ============================================
// SAVE DATA
// ============================================

function saveData(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const inputSheet = ss.getSheetByName("ข้อมูลเข้า");
  const machineSheet = ss.getSheetByName("ทะเบียนเครื่องจักร");

  // หาชนิดเครื่องจากทะเบียนเครื่อง
  const machineData = machineSheet.getDataRange().getValues();
  let machineType = "";

  for (let i = 1; i < machineData.length; i++) {
    if (machineData[i][0] == data.machineNo) {
      machineType = machineData[i][1];
      break;
    }
  }

  // หาแถวใหม่
  const row = inputSheet.getLastRow() + 1;

  // บันทึกข้อมูล
  inputSheet.getRange(row, 1).setValue(data.date);
  inputSheet.getRange(row, 2).setValue(data.time);
  inputSheet.getRange(row, 3).setValue(data.machineNo);
  inputSheet.getRange(row, 4).setValue(machineType);
  inputSheet.getRange(row, 5).setValue(data.part);
  inputSheet.getRange(row, 6).setValue(data.reason);
  inputSheet.getRange(row, 7).setValue(data.qty);
  inputSheet.getRange(row, 8).setValue(data.tech);

  // จัดรูปแบบแถวใหม่
  formatNewRow(inputSheet, row);

  return true;
}

function formatNewRow(sheet, row) {
  const range = sheet.getRange(row, 1, 1, 8);

  range.setBorder(true, true, true, true, true, true);
  range.setHorizontalAlignment("center").setVerticalAlignment("middle");
  range.setFontSize(10);

  if (row % 2 == 0) {
    range.setBackground("#F3F6FA");
  } else {
    range.setBackground("white");
  }
}

// ============================================
// GET REPORTS
// ============================================

function getDailyReport(date) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("ข้อมูลเข้า");
  
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const data = sheet.getRange(2, 1, lastRow - 1, 8).getValues();

  return data.filter(function(row) {
    if (!row[0]) return false;
    return parseCellDate(row[0]) === date;
  }).map(function(row) {
    return {
      date    : parseCellDate(row[0]),
      time    : parseCellTime(row[1]),
      machine : row[2],
      type    : row[3],
      part    : row[4],
      reason  : row[5],
      qty     : row[6],
      tech    : row[7]
    };
  });
}

function getMonthlyReport(yearMonth) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("ข้อมูลเข้า");
  
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const data = sheet.getRange(2, 1, lastRow - 1, 8).getValues();

  return data.filter(function(row) {
    if (!row[0]) return false;
    return parseCellDate(row[0]).slice(0, 7) === yearMonth;
  }).map(function(row) {
    return {
      date    : parseCellDate(row[0]),
      time    : parseCellTime(row[1]),
      machine : row[2],
      type    : row[3],
      part    : row[4],
      reason  : row[5],
      qty     : row[6],
      tech    : row[7]
    };
  });
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function parseCellDate(cell) {
  if (!cell) return "";

  if (cell instanceof Date) {
    return Utilities.formatDate(cell, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }

  const s = String(cell).trim();

  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(s)) {
    const parts = s.split(/[\/\-]/);
    const day   = parts[0].padStart(2, "0");
    const month = parts[1].padStart(2, "0");
    const year  = parts[2];
    return year + "-" + month + "-" + day;
  }

  return s.slice(0, 10);
}

function parseCellTime(cell) {
  if (!cell) return "";

  if (cell instanceof Date) {
    return Utilities.formatDate(cell, Session.getScriptTimeZone(), "HH:mm");
  }

  return String(cell).slice(0, 5);
}

function sendJson(data, status = 200) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// FORMAT ALL SHEETS
// ============================================

function formatAllSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const sheets = [
    "ข้อมูลเข้า",
    "สโตร์ผ้า",
    "ห้องตัด",
    "ห้องปัก",
    "โรงพิมพ์",
    "ห้องรีด"
  ];

  sheets.forEach(function(name) {
    const sheet = ss.getSheetByName(name);
    if (!sheet) return;

    const lastRow = sheet.getLastRow();
    const lastCol = 8;

    const header = sheet.getRange(1, 1, 1, lastCol);
    header
      .setBackground("#1F4E78")
      .setFontColor("white")
      .setFontWeight("bold")
      .setFontSize(11)
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");

    if (lastRow >= 2) {
      const dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
      dataRange
        .setBorder(true, true, true, true, true, true)
        .setFontSize(10)
        .setHorizontalAlignment("center")
        .setVerticalAlignment("middle");

      for (let i = 2; i <= lastRow; i++) {
        const rowRange = sheet.getRange(i, 1, 1, lastCol);
        if (i % 2 == 0) {
          rowRange.setBackground("#F3F6FA");
        } else {
          rowRange.setBackground("white");
        }
      }
    }

    sheet.setColumnWidth(1, 110);
    sheet.setColumnWidth(2, 90);
    sheet.setColumnWidth(3, 140);
    sheet.setColumnWidth(4, 220);
    sheet.setColumnWidth(5, 220);
    sheet.setColumnWidth(6, 250);
    sheet.setColumnWidth(7, 80);
    sheet.setColumnWidth(8, 140);

    sheet.setFrozenRows(1);

    if (sheet.getFilter()) {
      sheet.getFilter().remove();
    }

    if (lastRow >= 1) {
      sheet.getRange(1, 1, lastRow, lastCol).createFilter();
    }
  });

  SpreadsheetApp.flush();
}
