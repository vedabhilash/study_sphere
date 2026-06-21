import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Group from '../models/Group.js';

const initialStudents = [
  {
    name: 'Alex Rivera',
    email: 'alex@university.edu',
    avatar: 'AR',
    major: 'Computer Science',
    bio: 'Looking for a solid group to tackle Calculus and CS projects. I learn best by talking through code and equations!',
    courses: ['CS 101: Introduction to Programming', 'MATH 201: Calculus II'],
    availability: {
      'Monday': ['Afternoon (12PM - 5PM)', 'Evening (5PM - 9PM)'],
      'Wednesday': ['Afternoon (12PM - 5PM)', 'Evening (5PM - 9PM)'],
      'Friday': ['Afternoon (12PM - 5PM)'],
      'Saturday': ['Morning (8AM - 12PM)', 'Afternoon (12PM - 5PM)'],
      'Sunday': []
    },
    learningGoals: ['Complete Weekly Homework Assignments', 'Prepare for Midterm Exam'],
    groupSizePreference: 4,
    studyStyle: 'discussion',
    privacy: { visibility: 'public', showSchedule: true },
    rating: 4.8
  },
  {
    name: 'Priya Patel',
    email: 'priya@university.edu',
    avatar: 'PP',
    major: 'Pre-Med / Biology',
    bio: 'Chem and Bio student. I love sketching metabolic pathways and biological processes on a whiteboard. Let\'s draw it out!',
    courses: ['CHEM 101: General Chemistry', 'BIO 202: Cell Biology'],
    availability: {
      'Tuesday': ['Evening (5PM - 9PM)'],
      'Thursday': ['Evening (5PM - 9PM)'],
      'Saturday': ['Afternoon (12PM - 5PM)', 'Evening (5PM - 9PM)'],
      'Sunday': ['Afternoon (12PM - 5PM)']
    },
    learningGoals: ['Review Lecture Notes & Clarify Doubts', 'Prepare for Midterm Exam'],
    groupSizePreference: 3,
    studyStyle: 'visual',
    privacy: { visibility: 'public', showSchedule: true },
    rating: 4.9
  },
  {
    name: 'Marcus Vance',
    email: 'marcus@university.edu',
    avatar: 'MV',
    major: 'Physics',
    bio: 'Quiet and focused. I need intensive problem-solving sessions for Calculus II and General Physics. Let\'s grind practice exams.',
    courses: ['MATH 201: Calculus II', 'PHYS 102: General Physics'],
    availability: {
      'Monday': ['Morning (8AM - 12PM)'],
      'Tuesday': ['Morning (8AM - 12PM)'],
      'Wednesday': ['Morning (8AM - 12PM)'],
      'Thursday': ['Morning (8AM - 12PM)'],
      'Friday': ['Morning (8AM - 12PM)'],
      'Saturday': [],
      'Sunday': []
    },
    learningGoals: ['Solve Past Practice Exams', 'Complete Weekly Homework Assignments'],
    groupSizePreference: 2,
    studyStyle: 'intensive',
    privacy: { visibility: 'public', showSchedule: true },
    rating: 4.7
  },
  {
    name: 'Chloe Zheng',
    email: 'chloe@university.edu',
    avatar: 'CZ',
    major: 'English Literature',
    bio: 'Avid reader and discussion enthusiast. Love analyzing modern texts and writing structures. Happy to share reading notes!',
    courses: ['LIT 105: Modern World Literature', 'HIST 201: American History'],
    availability: {
      'Monday': ['Evening (5PM - 9PM)'],
      'Wednesday': ['Evening (5PM - 9PM)'],
      'Thursday': ['Afternoon (12PM - 5PM)', 'Evening (5PM - 9PM)'],
      'Saturday': ['Evening (5PM - 9PM)'],
      'Sunday': ['Morning (8AM - 12PM)', 'Afternoon (12PM - 5PM)']
    },
    learningGoals: ['Review Lecture Notes & Clarify Doubts', 'Collaborative Project Development'],
    groupSizePreference: 5,
    studyStyle: 'discussion',
    privacy: { visibility: 'public', showSchedule: true },
    rating: 4.6
  },
  {
    name: 'Sarah Jenkins',
    email: 'sarah@university.edu',
    avatar: 'SJ',
    major: 'Computer Science',
    bio: 'Looking for quick review sessions to double-check Calculus homework and CS syntax before submission.',
    courses: ['CS 101: Introduction to Programming', 'MATH 201: Calculus II'],
    availability: {
      'Monday': ['Afternoon (12PM - 5PM)', 'Evening (5PM - 9PM)'],
      'Wednesday': ['Evening (5PM - 9PM)'],
      'Thursday': ['Evening (5PM - 9PM)'],
      'Saturday': ['Afternoon (12PM - 5PM)'],
      'Sunday': []
    },
    learningGoals: ['Complete Weekly Homework Assignments', 'Review Lecture Notes & Clarify Doubts'],
    groupSizePreference: 4,
    studyStyle: 'review',
    privacy: { visibility: 'public', showSchedule: true },
    rating: 4.5
  },
  {
    name: 'Ethan Hunt',
    email: 'ethan@university.edu',
    avatar: 'EH',
    major: 'Mechanical Engineering',
    bio: 'Visual learner. I struggle with physics diagrams alone but learn extremely fast working together on a board or screen share.',
    courses: ['PHYS 102: General Physics', 'MATH 201: Calculus II'],
    availability: {
      'Tuesday': ['Morning (8AM - 12PM)', 'Afternoon (12PM - 5PM)'],
      'Thursday': ['Morning (8AM - 12PM)', 'Afternoon (12PM - 5PM)'],
      'Saturday': ['Morning (8AM - 12PM)', 'Afternoon (12PM - 5PM)'],
      'Sunday': []
    },
    learningGoals: ['Complete Weekly Homework Assignments', 'Solve Past Practice Exams'],
    groupSizePreference: 3,
    studyStyle: 'visual',
    privacy: { visibility: 'public', showSchedule: true },
    rating: 4.8
  }
];

export async function seedDatabase() {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('Database already contains user records. Skipping initial seeding.');
      return;
    }

    console.log('Database is empty. Seeding initial study records...');

    // Hash default password for everyone
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('password123', salt);

    const studentsToInsert = initialStudents.map(student => ({
      ...student,
      password
    }));

    const insertedUsers = await User.insertMany(studentsToInsert);
    console.log(`Successfully seeded ${insertedUsers.length} user profiles.`);

    // Map old keys to new mongoose user _ids
    const usersMap = {};
    insertedUsers.forEach(u => {
      if (u.name === 'Alex Rivera') usersMap['s1'] = u._id;
      if (u.name === 'Priya Patel') usersMap['s2'] = u._id;
      if (u.name === 'Marcus Vance') usersMap['s3'] = u._id;
      if (u.name === 'Chloe Zheng') usersMap['s4'] = u._id;
      if (u.name === 'Sarah Jenkins') usersMap['s5'] = u._id;
      if (u.name === 'Ethan Hunt') usersMap['s6'] = u._id;
    });

    // Populate Initial Study Groups
    const groupsToInsert = [
      {
        name: 'Calculus II Grinders',
        course: 'MATH 201: Calculus II',
        description: 'A study group focused on getting through the challenging integration and series topics of Calc II. We solve practice sheets and review past midterms.',
        members: [usersMap['s1'], usersMap['s3'], usersMap['s5']],
        maxSize: 5,
        studyStyle: 'intensive',
        goals: [
          {
            title: 'Review Chapter 7: Techniques of Integration',
            completed: true,
            subtasks: [
              { title: 'Integration by Parts problems 1-10', completed: true },
              { title: 'Trigonometric Substitutions rules sheet', completed: true }
            ]
          },
          {
            title: 'Solve Practice Midterm 1',
            completed: false,
            subtasks: [
              { title: 'Time ourselves for 60 mins', completed: false },
              { title: 'Peer-grade and discuss hard questions', completed: false }
            ]
          }
        ],
        meetings: [
          {
            title: 'Integration Techniques Review',
            date: '2026-06-23',
            time: 'Evening (5PM - 9PM)',
            duration: 90,
            location: 'Virtual Room',
            attendees: [usersMap['s1'], usersMap['s3']]
          }
        ],
        resources: [
          {
            title: 'Ultimate Calculus II Cheat Sheet',
            type: 'link',
            content: 'https://tutorial.math.lamar.edu/pdf/CalcII_Cheat_Sheet.pdf',
            postedBy: 'Alex Rivera',
            upvotes: 4,
            category: 'Cheat Sheets'
          },
          {
            title: 'Practice Problems for Integration by Parts',
            type: 'problem',
            content: 'Solve: \u222b x\u00b2 e^x dx and \u222b ln(x) dx. Try these before our Tuesday evening study session.',
            postedBy: 'Marcus Vance',
            upvotes: 2,
            category: 'Practice Problems'
          }
        ],
        messages: [
          {
            senderId: usersMap['s3'].toString(),
            senderName: 'Marcus Vance',
            content: 'Hey guys, did anyone manage to solve practice question 4 on polar coordinates?',
            timestamp: '10:05 AM'
          },
          {
            senderId: usersMap['s1'].toString(),
            senderName: 'Alex Rivera',
            content: 'I worked on it! I think we need to use the symmetry of the cardioid. We can draw it out in our virtual room session on Tuesday.',
            timestamp: '10:12 AM'
          },
          {
            senderId: usersMap['s5'].toString(),
            senderName: 'Sarah Jenkins',
            content: 'That sounds perfect. I was getting stuck on the bounds of integration as well. Tuesday evening works for me!',
            timestamp: '10:15 AM'
          }
        ]
      },
      {
        name: 'CS 101 Projects & Chat',
        course: 'CS 101: Introduction to Programming',
        description: 'We discuss programming logic, help debug syntax errors, and collaborate on understanding standard coding concepts. Beginners welcome!',
        members: [usersMap['s1'], usersMap['s5']],
        maxSize: 4,
        studyStyle: 'discussion',
        goals: [
          {
            title: 'Understand Python Dictionary Comprehensions',
            completed: false,
            subtasks: [
              { title: 'Write 3 sample scripts using dictionaries', completed: false },
              { title: 'Review complexity (Big O) of lookups', completed: false }
            ]
          }
        ],
        meetings: [],
        resources: [
          {
            title: 'Interactive Python Visualizer',
            type: 'link',
            content: 'https://pythontutor.com/',
            postedBy: 'Sarah Jenkins',
            upvotes: 5,
            category: 'Tools'
          }
        ],
        messages: [
          {
            senderId: usersMap['s1'].toString(),
            senderName: 'Alex Rivera',
            content: 'Welcome to the CS group! Let\'s use this workspace to share logic ideas.',
            timestamp: 'Yesterday'
          }
        ]
      }
    ];

    const insertedGroups = await Group.insertMany(groupsToInsert);
    console.log(`Successfully seeded ${insertedGroups.length} study workspaces.`);

  } catch (error) {
    console.error('Failed to seed database:', error);
  }
}
