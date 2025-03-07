const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const ApiError = require('../utils/errors');
const config = require('../config');
const logger = require('../utils/logger');
const router = express.Router();

// GET /api/auth/admin-exists - Check if an admin exists
router.get('/admin-exists', async (req, res, next) => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    res.json({ exists: !!adminExists });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/signup
router.post(
  '/signup',
  [
    body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('confirmPassword')
      .custom((value, { req }) => value === req.body.password)
      .withMessage('Passwords do not match'),
    body('role').optional().isIn(['user', 'admin']).withMessage('Role must be "user" or "admin"'),
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('phoneNumber')
      .matches(/^\+\d{1,4}\d{6,14}$/)
      .withMessage('Phone number must include country code (e.g., +12025550123)'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, role, firstName, lastName, phoneNumber } = req.body;
    try {
      const user = await User.findOne({ email });
      if (user) throw new ApiError(400, 'User already exists');

      // Check if an admin already exists
      if (role === 'admin') {
        const adminExists = await User.findOne({ role: 'admin' });
        if (adminExists) throw new ApiError(400, 'An admin already exists; only one admin is allowed');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ 
        email, 
        password: hashedPassword, 
        role: role || 'user', // Default to 'user' if not provided
        firstName, 
        lastName, 
        phoneNumber 
      });
      await newUser.save();

      const token = jwt.sign(
        { id: newUser._id, role: newUser.role, firstName, lastName }, 
        process.env.JWT_SECRET,
        { expiresIn: config.jwt.expiresIn }
      );
      logger.info('User signed up', { email, role: newUser.role });
      res.status(201).json({ token });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/login (unchanged)
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) throw new ApiError(400, 'Invalid credentials');

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) throw new ApiError(400, 'Invalid credentials');

      const token = jwt.sign(
        { id: user._id, role: user.role, firstName: user.firstName, lastName: user.lastName }, 
        process.env.JWT_SECRET,
        { expiresIn: config.jwt.expiresIn }
      );
      logger.info('User logged in', { email });
      res.json({ token });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;