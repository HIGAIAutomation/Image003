const fs = require('fs');
const path = require('path');
const db = require('./db');

(async () => {
  await db.connect();
  const USERS_FILE = path.join(__dirname, 'users.json');
  if (!fs.existsSync(USERS_FILE)) {
    console.log('No users.json found, nothing to migrate.');
    process.exit(0);
  }
  const raw = fs.readFileSync(USERS_FILE, 'utf8') || '[]';
  let users = [];
  try { users = JSON.parse(raw); } catch (e) { console.error('Invalid JSON', e); process.exit(1); }

  for (const u of users) {
    const doc = {
      id: u.id || Date.now().toString() + Math.random().toString(36).slice(2,8),
      name: u.name || '',
      email: u.email || '',
      phone: u.phone || '',
      designation: u.designation || '',
      photoUrl: u.photoUrl || ''
    };
    try {
      await db.createUser(doc);
      console.log('Imported', doc.id);
    } catch (err) {
      console.warn('Skipped', doc.id, err.message);
    }
  }
  console.log('Migration complete');
  process.exit(0);
})();
