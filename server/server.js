require('dotenv').config();
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { socketHandler } = require('./socket/socketHandler');

// Validate critical environment variables
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET) {
    console.error('CRITICAL: JWT_SECRET must be defined in production!');
    process.exit(1);
  }
  if (!process.env.MONGODB_URI) {
    console.error('CRITICAL: MONGODB_URI must be defined in production!');
    process.exit(1);
  }
}

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
  if (!origin || origin === 'null') return true;
  // Match localhost, 127.0.0.1, and private IPv4 address spaces (192.168.x.x, 10.x.x.x, 172.16.x.x-172.31.x.x)
  return /^https?:\/\/((localhost|127\.0\.0\.1)|(10\.\d+|192\.168\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+)\.\d+)(:\d+)?$/.test(origin);
};

const corsOptions = {
  origin: (origin, callback) => {
    if (
      process.env.NODE_ENV !== 'production' ||
      !origin ||
      origin === 'null' ||
      isLocalOrigin(origin) ||
      allowedOrigins.includes(origin)
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};

// Rate limiting configurations
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Max 10 login/register requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts, please try again after 15 minutes' }
});

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(mongoSanitize());
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Apply rate limits
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api', apiLimiter);

// Serve uploaded static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/groups', require('./routes/groupRoutes'));
app.use('/api/resources', require('./routes/resourceRoutes'));
app.use('/api', require('./routes/skillsRoutes'));

// Root path check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Study Group API is fully functional' });
});

// Centralized error handlers
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
app.use(notFound);
app.use(errorHandler);

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
