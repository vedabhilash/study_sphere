require('dotenv').config();
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { socketHandler } = require('./socket/socketHandler');

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'https://study-sphere-lemon-seven.vercel.app'
];
if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

const isLocalOrigin = (origin) => {
  if (!origin) return true;
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
};

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || isLocalOrigin(origin) || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/groups', require('./routes/groupRoutes'));
app.use('/api/resources', require('./routes/resourceRoutes'));

// Root path check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Study Group API is fully functional' });
});

// Configure Socket.io
const io = socketio(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || isLocalOrigin(origin) || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Store io instance in app settings to make it accessible to REST controllers
app.set('socketio', io);

// Initialize Socket.io connection logic
socketHandler(io);

// Define PORT and start
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in mode on port ${PORT}`);
});
