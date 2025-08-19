// Load environment variables explicitly from the .env file in this directory
require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');

// MongoDB connection setup
const envMongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
const mongoURI = envMongoURI ? envMongoURI.trim() : null;

if (!mongoURI) {
  console.error('MongoDB connection error: No connection string provided in environment variables.');
  process.exit(1);
}

if (!/^mongodb(?:\+srv)?:\/\//.test(mongoURI)) {
  console.error('MongoDB connection error: Invalid connection string format. Please check your .env file.');
  process.exit(1);
}

try {
  const { ConnectionString } = require('mongodb-connection-string-url');
  new ConnectionString(mongoURI);
} catch (e) {
  console.error('MongoDB connection error: Invalid connection string structure.', e);
  process.exit(1);
}

mongoose.set('strictQuery', false);
// Disable buffering of model operations until connected - fail fast instead of timing out
mongoose.set('bufferCommands', false);

const connect = async () => {
  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 20000
    });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err && err.message ? err.message : err);
    throw err;
  }
};

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  email: String,
  phone: String,
  designation: String,
  photoUrl: String,
  photo: String
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = {
  connect,
  User,
  // helper wrappers
  allUsers: async () => await User.find({}).sort({ createdAt: 1 }).lean(),
  getUser: async (id) => await User.findOne({ id }).lean(),
  createUser: async (user) => {
    if (mongoose.connection.readyState !== 1) throw new Error('Not connected to MongoDB');
    const u = new User(user);
    return await u.save();
  },
  findMembersByDesignation: async (designation) => {
    if (!designation) return [];
    const desig = designation.toLowerCase();
    // match exact or comma-separated lists (case-insensitive)
    const users = await User.find({
      designation: { $exists: true, $ne: null },
      $expr: {
        $in: [desig, { $map: { input: { $split: [{ $toLower: '$designation' }, ','] }, as: 'd', in: { $trim: { input: '$$d' } } } } ]
      }
    }).lean();

    // Ensure each user has a valid photo field
    return users.map(user => ({
      ...user,
      // If photo exists, use it; otherwise try photoUrl
      photo: user.photo || (user.photoUrl ? user.photoUrl.split('/').pop() : null)
    }));
  },
  updateUser: async (id, changes) => {
    if (mongoose.connection.readyState !== 1) throw new Error('Not connected to MongoDB');
    return await User.findOneAndUpdate({ id }, changes, { new: true });
  },
  deleteUser: async (id) => {
    if (mongoose.connection.readyState !== 1) throw new Error('Not connected to MongoDB');
    return await User.findOneAndDelete({ id });
  }
};
