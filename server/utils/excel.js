const fs = require('fs');
const XLSX = require('xlsx');

const OUTPUT_DIR = require('path').join(__dirname, '../output');
const EXCEL_PATH = require('path').join(OUTPUT_DIR, 'members.xlsx');

function getAllUsers(excelPath) {
  if (!fs.existsSync(excelPath)) return [];
  const workbook = XLSX.readFile(excelPath);
  if (!workbook.SheetNames.includes('Members')) return [];
  return XLSX.utils.sheet_to_json(workbook.Sheets['Members']);
}

function deleteUser(excelPath, userId) {
  if (!fs.existsSync(excelPath)) return;
  const workbook = XLSX.readFile(excelPath);
  if (!workbook.SheetNames.includes('Members')) return;
  
  let users = XLSX.utils.sheet_to_json(workbook.Sheets['Members']);
  users = users.filter(user => user.id !== userId);
  
  const newSheet = XLSX.utils.json_to_sheet(users);
  workbook.Sheets['Members'] = newSheet;
  XLSX.writeFile(workbook, excelPath);
}

function saveToExcel(data) {
  let workbook, worksheetData;

  // Create output directory if it doesn't exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  if (fs.existsSync(EXCEL_PATH)) {
    workbook = XLSX.readFile(EXCEL_PATH);
    worksheetData = workbook.SheetNames.includes('Members') 
      ? XLSX.utils.sheet_to_json(workbook.Sheets['Members'])
      : [];
    
    // Check for duplicate email across all designations
    const existingUser = worksheetData.find(user => user.email === data.email);
    
    if (existingUser) {
      throw new Error(`This email is already registered as a ${existingUser.designation}. Each email can only be used once.`);
    }
    
    // Add new user
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

function getMembersByDesignation(designation, excelPath) {
  if (!fs.existsSync(excelPath)) return [];
  const workbook = XLSX.readFile(excelPath);
  if (!workbook.SheetNames.includes('Members')) return [];
  const allMembers = XLSX.utils.sheet_to_json(workbook.Sheets['Members']);
  return allMembers.filter(member => member.designation === designation);
}

function updateUser(excelPath, userId, updatedData) {
  if (!fs.existsSync(excelPath)) throw new Error('Database file not found');
  
  const workbook = XLSX.readFile(excelPath);
  if (!workbook.SheetNames.includes('Members')) throw new Error('No users found');
  
  let users = XLSX.utils.sheet_to_json(workbook.Sheets['Members']);
  
  // Find the user to update
  const userIndex = users.findIndex(user => user.id === userId);
  if (userIndex === -1) throw new Error('User not found');
  
  // Check if email is being changed and if it's already taken by another user
  if (updatedData.email && updatedData.email !== users[userIndex].email) {
    const existingUser = users.find((user, index) => 
      index !== userIndex && user.email === updatedData.email
    );
    if (existingUser) {
      throw new Error(`This email is already registered as a ${existingUser.designation}. Each email can only be used once.`);
    }
  }
  
  // Update the user data while preserving the id and photo
  users[userIndex] = {
    ...users[userIndex],
    ...updatedData,
    id: userId, // Ensure ID doesn't change
    photo: users[userIndex].photo // Preserve photo path
  };
  
  // Save the updated data
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
