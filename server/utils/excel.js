const fs = require('fs');
const XLSX = require('xlsx');

const OUTPUT_DIR = require('path').join(__dirname, '../output');
const EXCEL_PATH = require('path').join(OUTPUT_DIR, 'members.xlsx');

function saveToExcel(data) {
  let workbook, worksheetData;

  if (fs.existsSync(EXCEL_PATH)) {
    workbook = XLSX.readFile(EXCEL_PATH);
    worksheetData = XLSX.utils.sheet_to_json(workbook.Sheets['Members']);
    worksheetData.push(data);
  } else {
    workbook = XLSX.utils.book_new();
    worksheetData = [data];
  }

  const newSheet = XLSX.utils.json_to_sheet(worksheetData);
  if (workbook.SheetNames.includes('Members')) {
    delete workbook.Sheets['Members'];
    const idx = workbook.SheetNames.indexOf('Members');
    workbook.SheetNames.splice(idx, 1);
  }

  XLSX.utils.book_append_sheet(workbook, newSheet, 'Members');
  XLSX.writeFile(workbook, EXCEL_PATH);
}

function getMembersByDesignation(designation, excelPath) {
  const workbook = XLSX.readFile(excelPath);
  const allMembers = XLSX.utils.sheet_to_json(workbook.Sheets['Members']);
  return allMembers.filter(member => member.designation === designation);
}

module.exports = {
  saveToExcel,
  getMembersByDesignation,
};
