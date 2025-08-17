const db = require('./db');

(async () => {
  try {
    await db.connect();
    console.log('Connected to DB, starting migration...');

    // Find users where photoUrl is missing/empty but photo exists
    const users = await db.User.find({
      $and: [
        { $or: [ { photoUrl: { $exists: false } }, { photoUrl: '' }, { photoUrl: null } ] },
        { photo: { $exists: true, $ne: '' } }
      ]
    }).lean();

    if (!users.length) {
      console.log('No records to migrate.');
      process.exit(0);
    }

    let updated = 0;
    for (const u of users) {
      const val = u.photo || '';
      if (!val) continue;
      const photoUrl = val.startsWith('/') ? val : `/${val}`;
      try {
        await db.updateUser(u.id, { ...u, photoUrl });
        updated++;
        console.log(`Updated ${u.id} -> ${photoUrl}`);
      } catch (err) {
        console.warn(`Failed to update ${u.id}:`, err.message || err);
      }
    }

    console.log(`Migration complete. Updated ${updated} records.`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
