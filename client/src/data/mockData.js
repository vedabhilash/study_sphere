export const COURSES = [
  'CS 101: Introduction to Programming',
  'MATH 201: Calculus II',
  'PHYS 102: General Physics',
  'CHEM 101: General Chemistry',
  'BIO 202: Cell Biology',
  'LIT 105: Modern World Literature',
  'HIST 201: American History'
];

export const STUDY_STYLES = [
  { id: 'discussion', name: 'Discussion-Based', description: 'Interactive discussions, verbal explaining, and group debates.' },
  { id: 'visual', name: 'Visual Learning', description: 'Sharing diagrams, flowcharts, video explanations, and screen sharing.' },
  { id: 'intensive', name: 'Intensive Practice', description: 'Solving hard practice problems, working through study guides step-by-step.' },
  { id: 'review', name: 'Quick Review', description: 'Briefly checking notes, clarifying doubts, and reviewing key definitions before exams.' }
];

export const GOALS = [
  'Prepare for Midterm Exam',
  'Complete Weekly Homework Assignments',
  'Collaborative Project Development',
  'Review Lecture Notes & Clarify Doubts',
  'Solve Past Practice Exams'
];

export const TIME_SLOTS = ['Morning (8AM - 12PM)', 'Afternoon (12PM - 5PM)', 'Evening (5PM - 9PM)'];
export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const mockStudents = [
  {
    id: 's1',
    name: 'Alex Rivera',
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
    id: 's2',
    name: 'Priya Patel',
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
    id: 's3',
    name: 'Marcus Vance',
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
    id: 's4',
    name: 'Chloe Zheng',
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
    id: 's5',
    name: 'Sarah Jenkins',
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
    id: 's6',
    name: 'Ethan Hunt',
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

export const mockGroups = [
  {
    id: 'g1',
    name: 'Calculus II Grinders',
    course: 'MATH 201: Calculus II',
    description: 'A study group focused on getting through the challenging integration and series topics of Calc II. We solve practice sheets and review past midterms.',
    members: ['s1', 's3', 's5'],
    maxSize: 5,
    studyStyle: 'intensive',
    goals: [
      {
        id: 'goal-1',
        title: 'Review Chapter 7: Techniques of Integration',
        completed: true,
        subtasks: [
          { id: 'sub-1', title: 'Integration by Parts problems 1-10', completed: true },
          { id: 'sub-2', title: 'Trigonometric Substitutions rules sheet', completed: true }
        ]
      },
      {
        id: 'goal-2',
        title: 'Solve Practice Midterm 1',
        completed: false,
        subtasks: [
          { id: 'sub-3', title: 'Time ourselves for 60 mins', completed: false },
          { id: 'sub-4', title: 'Peer-grade and discuss hard questions', completed: false }
        ]
      }
    ],
    meetings: [
      {
        id: 'm1',
        title: 'Integration Techniques Review',
        date: '2026-06-23',
        time: 'Evening (5PM - 9PM)',
        duration: 90,
        location: 'Virtual Room',
        attendees: ['s1', 's3']
      }
    ],
    resources: [
      {
        id: 'r1',
        title: 'Ultimate Calculus II Cheat Sheet',
        type: 'link',
        content: 'https://tutorial.math.lamar.edu/pdf/CalcII_Cheat_Sheet.pdf',
        postedBy: 'Alex Rivera',
        upvotes: 4,
        category: 'Cheat Sheets'
      },
      {
        id: 'r2',
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
        id: 'msg1',
        senderId: 's3',
        senderName: 'Marcus Vance',
        content: 'Hey guys, did anyone manage to solve practice question 4 on polar coordinates?',
        timestamp: '10:05 AM'
      },
      {
        id: 'msg2',
        senderId: 's1',
        senderName: 'Alex Rivera',
        content: 'I worked on it! I think we need to use the symmetry of the cardioid. We can draw it out in our virtual room session on Tuesday.',
        timestamp: '10:12 AM'
      },
      {
        id: 'msg3',
        senderId: 's5',
        senderName: 'Sarah Jenkins',
        content: 'That sounds perfect. I was getting stuck on the bounds of integration as well. Tuesday evening works for me!',
        timestamp: '10:15 AM'
      }
    ]
  },
  {
    id: 'g2',
    name: 'CS 101 Projects & Chat',
    course: 'CS 101: Introduction to Programming',
    description: 'We discuss programming logic, help debug syntax errors, and collaborate on understanding standard coding concepts. Beginners welcome!',
    members: ['s1', 's5'],
    maxSize: 4,
    studyStyle: 'discussion',
    goals: [
      {
        id: 'goal-3',
        title: 'Understand Python Dictionary Comprehensions',
        completed: false,
        subtasks: [
          { id: 'sub-5', title: 'Write 3 sample scripts using dictionaries', completed: false },
          { id: 'sub-6', title: 'Review complexity (Big O) of lookups', completed: false }
        ]
      }
    ],
    meetings: [],
    resources: [
      {
        id: 'r3',
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
        id: 'msg4',
        senderId: 's1',
        senderName: 'Alex Rivera',
        content: 'Welcome to the CS group! Let\'s use this workspace to share logic ideas.',
        timestamp: 'Yesterday'
      }
    ]
  }
];
