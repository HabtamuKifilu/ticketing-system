const express = require('express');
const dotenv = require('dotenv-safe');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const logger = require('./utils/logger');

dotenv.config({
  example: './.env.example',
  allowEmptyValues: true,
});

const app = express();

// Security Middleware
app.use(helmet());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { msg: 'Too many requests, please try again later' },
  })
);

// Basic Middleware
app.use(express.json());
console.log('CORS origin:', process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://your-production-url.com');
app.use(cors({
  origin: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://your-production-url.com',
  methods: ['GET', 'POST', 'PUT'],
  allowedHeaders: ['Content-Type', 'x-auth-token'],
}));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, config.mongoOptions)
  .then(() => logger.info('MongoDB Connected ✅'))
  .catch(err => logger.error('MongoDB Connection Error ❌', { error: err.message }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tickets', require('./routes/tickets'));

// Default Route
app.get('/', (req, res) => {
  logger.info('Accessed default route');
  res.send('Welcome to the Ticketing System API 🎟️');
});

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.stack });
  const status = err.status || 500;
  const response = { msg: err.message || 'Something went wrong' };
  if (process.env.NODE_ENV === 'development') {
    response.error = err.stack;
  }
  res.status(status).json(response);
});

if (process.env.NODE_ENV === 'development') {
  logger.level = 'debug';
} else {
  logger.level = 'info';
}

app.listen(config.port, () => logger.info(`Server running on port ${config.port} 🚀`));