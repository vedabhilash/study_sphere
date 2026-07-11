const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const seedMockMatches = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/student-study-group';
    console.log(`Connecting to database: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully.');

    // Clear existing seed mock users
    await User.deleteMany({ email: { $in: ['alice@collabstudy.edu', 'bob@collabstudy.edu', 'clara@collabstudy.edu'] } });
    console.log('Cleared existing seed users.');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const seedUsers = [
      {
        name: 'Alice Vance',
        email: 'alice@collabstudy.edu',
        password: hashedPassword,
        avatar: '',
        academicMajor: 'Computer Science',
        yearOfStudy: '2',
        university: 'CollabStudy University',
        bio: 'Coding enthusiast. Love building React web apps and playing tennis.',
        courses: ['CS 101: Introduction to Programming', 'CS 102: Data Structures', 'MATH 201: Calculus'],
        weeklyAvailability: {
          monday: ['Afternoon'],
          wednesday: ['Morning'],
          friday: ['Afternoon']
        },
        preferredStudyStyle: 'discussion',
        learningGoals: ['Master React Hooks', 'A grade in Calculus', 'Build full-stack side projects']
      },
      {
        name: 'Bob Smith',
        email: 'bob@collabstudy.edu',
        password: hashedPassword,
        avatar: '',
        academicMajor: 'Computer Science',
        yearOfStudy: '3',
        university: 'CollabStudy University',
        bio: 'Focusing on algorithmic problem solving. Prefer visual notes.',
        courses: ['CS 102: Data Structures'],
        weeklyAvailability: {
          monday: ['Morning', 'Afternoon'],
          tuesday: ['Afternoon'],
          thursday: ['Morning']
        },
        preferredStudyStyle: 'visual',
        learningGoals: ['Understand Graph algorithms', 'Contribute to open source']
      },
      {
        name: 'Clara Jones',
        email: 'clara@collabstudy.edu',
        password: hashedPassword,
        avatar: '',
        academicMajor: 'Mathematics',
        yearOfStudy: '1',
        university: 'CollabStudy University',
        bio: 'First year math student. Looking for intensive study sessions.',
        courses: ['MATH 201: Calculus'],
        weeklyAvailability: {
          friday: ['Afternoon', 'Evening'],
          saturday: ['Morning']
        },
        preferredStudyStyle: 'intensive',
        learningGoals: ['Score high in Calculus limits', 'Learn basic Python']
      }
    ];

    const created = await User.insertMany(seedUsers);
    console.log(`Successfully seeded ${created.length} mock users:`);
    created.forEach(u => console.log(`- ${u.name} (${u.email})`));

    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed matches:', error);
    process.exit(1);
  }
};

seedMockMatches();
