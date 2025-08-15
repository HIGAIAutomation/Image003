const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const OUTPUT_DIR = path.join(__dirname, '../output');
const EXCEL_PATH = path.join(OUTPUT_DIR, 'members.xlsx');

// Get all users
function getAllUsers(excelPath) {
  if (!fs.existsSync(excelPath)) return [];
  const workbook = XLSX.readFile(excelPath);
  if (!workbook.SheetNames.includes('Members')) return [];
  return XLSX.utils.sheet_to_json(workbook.Sheets['Members']);
}

// Delete user by ID
function deleteUser(excelPath, userId) {
  if (!fs.existsSync(excelPath)) return;
  const workbook = XLSX.readFile(excelPath);
  if (!workbook.SheetNames.includes('Members')) return;

  let users = XLSX.utils.sheet_to_json(workbook.Sheets['Members']);
  users = users.filter(user => String(user.id) !== String(userId)); // ✅ string-safe ID comparison

  const newSheet = XLSX.utils.json_to_sheet(users);
  workbook.Sheets['Members'] = newSheet;
  XLSX.writeFile(workbook, excelPath);
}

// Save new user to Excel
function saveToExcel(data) {
  let workbook, worksheetData;

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  if (fs.existsSync(EXCEL_PATH)) {
    workbook = XLSX.readFile(EXCEL_PATH);
    worksheetData = workbook.SheetNames.includes('Members')
      ? XLSX.utils.sheet_to_json(workbook.Sheets['Members'])
      : [];

    const existingUser = worksheetData.find(user => user.email === data.email);
    if (existingUser) {
      throw new Error(`This email is already registered as a ${existingUser.designation}. Each email can only be used once.`);
    }

    worksheetData.push(data);
  } else {
    workbook = XLSX.utils.book_new();
    worksheetData = [data];
  }

  const newSheet = XLSX.utils.json_to_sheet(worksheetData);
  if (workbook.SheetNames.includes('Members')) {
    workbook.Sheets['Members'] = newSheet;
  } else {
    XLSX.utils.book_append_sheet(workbook, newSheet, 'Members');
  }

  XLSX.writeFile(workbook, EXCEL_PATH);
}

// Get users by designation
function getMembersByDesignation(designation, excelPath) {
  if (!fs.existsSync(excelPath)) return [];
  const workbook = XLSX.readFile(excelPath);
  if (!workbook.SheetNames.includes('Members')) return [];
  const allMembers = XLSX.utils.sheet_to_json(workbook.Sheets['Members']);
  return allMembers.filter(member =>
    member.designation &&
    member.designation
      .split(',')
      .map(d => d.trim().toLowerCase())
      .includes(designation.toLowerCase())
  );
}

// Update existing user
function updateUser(excelPath, userId, updatedData) {
  if (!fs.existsSync(excelPath)) throw new Error('Database file not found');

  const workbook = XLSX.readFile(excelPath);
  if (!workbook.SheetNames.includes('Members')) throw new Error('No users found');

  let users = XLSX.utils.sheet_to_json(workbook.Sheets['Members']);

  const userIndex = users.findIndex(user => String(user.id) === String(userId)); // ✅ string-safe
  if (userIndex === -1) throw new Error('User not found');

  if (updatedData.email && updatedData.email !== users[userIndex].email) {
    const existingUser = users.find((user, index) =>
      index !== userIndex && user.email === updatedData.email
    );
    if (existingUser) {
      throw new Error(`This email is already registered as a ${existingUser.designation}. Each email can only be used once.`);
    }
  }

  users[userIndex] = {
    ...users[userIndex],
    ...updatedData,
    id: String(userId), // Ensure ID remains string
    photo: users[userIndex].photo
  };

  const newSheet = XLSX.utils.json_to_sheet(users);
  workbook.Sheets['Members'] = newSheet;
  XLSX.writeFile(workbook, excelPath);

  return users[userIndex];
}

module.exports = {
  saveToExcel,
  getMembersByDesignation,
  getAllUsers,
  deleteUser,
  updateUser
};
