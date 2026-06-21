import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Group from '../models/Group.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/studysphere';

const testEmails = [
  'alex@university.edu',
  'priya@university.edu',
  'marcus@university.edu',
  'chloe@university.edu',
  'sarah@university.edu',
  'ethan@university.edu'
];

async function cleanup() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for cleanup...');

    // Delete test users
    const userResult = await User.deleteMany({ email: { $in: testEmails } });
    console.log(`Deleted ${userResult.deletedCount} test user profiles.`);

    // Delete seeded groups
    const groupResult = await Group.deleteMany({ 
      name: { $in: ['Calculus II Grinders', 'CS 101 Projects & Chat'] } 
    });
    console.log(`Deleted ${groupResult.deletedCount} seeded study groups.`);

    console.log('Cleanup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
}

cleanup();
