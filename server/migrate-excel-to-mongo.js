const path = require('path');
const db = require('./db');
const { getAllUsers } = require('./utils/excel');

(async () => {
  await db.connect();
  const EXCEL_PATH = path.join(__dirname, 'output', 'members.xlsx');
  const users = getAllUsers(EXCEL_PATH);
  if (!users || !users.length) {
    console.log('No users found in Excel.');
    process.exit(0);
  }
  for (const u of users) {
    const doc = {
      id: String(u.id || Date.now()),
      name: u['Full Name'] || u.name || '',
      email: u.Email || u.email || '',
      phone: u.Phone || u.phone || '',
      designation: u.Designation || u.designation || '',
      photoUrl: u.Photo || u.photo || u.photoUrl || ''
    };
    try {
      await db.createUser(doc);
      console.log('Imported', doc.id);
    } catch (e) {
      console.warn('Skipped', doc.id, e.message);
    }
  }
  console.log('Done');
  process.exit(0);
})();
