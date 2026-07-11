const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const updateVeda = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/student-study-group';
    console.log(`Connecting to database: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully.');

    const email = 'vedabhilash955@gmail.com';
    const user = await User.findOne({ email });

    if (!user) {
      console.error(`User with email "${email}" not found in database.`);
      process.exit(1);
    }

    user.academicMajor = 'Computer Science';
    user.yearOfStudy = '2';
    user.courses = [
      'CS 101: Introduction to Programming',
      'CS 102: Data Structures',
      'MATH 201: Calculus'
    ];
    user.weeklyAvailability = {
      monday: ['Afternoon'],
      wednesday: ['Morning'],
      friday: ['Afternoon']
    };
    user.preferredStudyStyle = 'discussion';
    user.learningGoals = ['Master React Hooks', 'A grade in Calculus', 'Build full-stack side projects'];

    await user.save();
    console.log(`Successfully updated profile for user: ${user.name} (${user.email})`);
    console.log('Updated details:');
    console.log('- Major: Computer Science');
    console.log('- Courses: CS 101, CS 102, MATH 201');
    console.log('- Preferred Study Style: Discussion');
    console.log('- Weekly Availability: Monday Afternoon, Wednesday Morning, Friday Afternoon');

    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to update user profile:', error);
    process.exit(1);
  }
};

updateVeda();
