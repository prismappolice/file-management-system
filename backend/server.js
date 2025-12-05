const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const fileRoutes = require('./fileRoutes');
const programRoutes = require('./programRoutes');
const userRoutes = require('./userRoutes');
const memoRoutes = require('./memoRoutes');

require('./database');   // ✅ Initialize database connection

const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced CORS configuration
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'], // Vite dev server and local
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.method === 'POST' && req.path === '/api/login') {
    console.log('Login attempt for user:', req.body?.username);
  }
  next();
});

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API Routes
app.use('/api', fileRoutes);
app.use('/api', programRoutes);
app.use('/api', userRoutes);
app.use('/api', memoRoutes);

// Root API endpoint
app.get('/api', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'AP POLICE - File Management System API', 
    version: '1.0.0',
    endpoints: [
      'GET /api/health - Health check',
      'POST /api/login - User authentication',
      'GET /api/users - Get all users (admin)',
      'POST /api/users/create - Create user (admin)',
      'GET /api/programs - Get all programs',
      'GET /api/files - Get files by program',
      'POST /api/upload - Upload file'
    ]
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API available at http://0.0.0.0:${PORT}/api`);
  console.log('Press Ctrl+C to stop the server');
});

// Error handlers
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Keep the process running
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Prevent process from exiting
setInterval(() => {}, 1000);

module.exports = app;
