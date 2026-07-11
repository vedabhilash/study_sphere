const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const { getSortedMatches } = require('../utils/matchingAlgorithm');

const debugMatches = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/student-study-group';
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected.');

    const email = 'vedabhilash955@gmail.com';
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`Could not find user with email: ${email}`);
      process.exit(0);
    }

    console.log('\n--- Active User ---');
    console.log(`Name: ${user.name}`);
    console.log(`Courses: ${JSON.stringify(user.courses)}`);
    console.log(`Availability: ${JSON.stringify(user.weeklyAvailability)}`);
    console.log(`PreferredStudyStyle: ${user.preferredStudyStyle}`);
    console.log(`LearningGoals: ${JSON.stringify(user.learningGoals)}`);

    const allUsers = await User.find({ _id: { $ne: user._id } });
    console.log(`\nFound ${allUsers.length} other users in database.`);
    
    allUsers.forEach(u => {
      console.log(`- ${u.name} (Courses: ${u.courses?.length || 0}, Style: ${u.preferredStudyStyle || u.studyStyle})`);
    });

    const matches = getSortedMatches(user, allUsers);
    console.log(`\n--- Matches Result (Count: ${matches.length}) ---`);
    matches.forEach(m => {
      console.log(`- ${m.name}: Score = ${m.matchScore}%`);
      console.log(`  Reasons: ${JSON.stringify(m.matchReasons)}`);
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

debugMatches();
