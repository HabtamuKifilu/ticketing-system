const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Ticket = require('../models/Ticket');
const ApiError = require('../utils/errors');
const config = require('../config');
const logger = require('../utils/logger');
const router = express.Router();

const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) throw new ApiError(401, 'No token, authorization denied');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    throw new ApiError(401, 'Token is not valid or has expired');
  }
};

router.post(
  '/',
  auth,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category').optional().isIn(['Bug', 'Feature Request', 'Support']).withMessage('Invalid category'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, category = 'Support' } = req.body;
    try {
      const ticket = new Ticket({
        title,
        description,
        category,
        user: req.user.id,
      });
      await ticket.save();
      logger.info('Ticket created', { title, user: req.user.id, category });
      res.status(201).json(ticket);
    } catch (err) {
      next(err);
    }
  }
);

router.get('/', auth, async (req, res, next) => {
  try {
    let tickets;
    if (req.user.role === 'admin') {
      tickets = await Ticket.find().populate('user', 'email firstName lastName').sort({ createdAt: -1 }); // Updated populate
    } else {
      tickets = await Ticket.find({ user: req.user.id }).sort({ createdAt: -1 });
    }
    logger.info('Tickets fetched', { role: req.user.role, count: tickets.length });
    res.json(tickets);
  } catch (err) {
    next(err);
  }
});

router.put(
  '/:id',
  auth,
  [
    body('status').isIn(['Open', 'In Progress', 'Closed']).withMessage('Invalid status value'),
  ],
  async (req, res, next) => {
    if (req.user.role !== 'admin') throw new ApiError(403, 'Admin access required');

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status } = req.body;
    try {
      const ticket = await Ticket.findById(req.params.id);
      if (!ticket) throw new ApiError(404, 'Ticket not found');

      ticket.status = status;
      await ticket.save();
      logger.info('Ticket status updated', { ticketId: req.params.id, status });
      res.json(ticket);
    } catch (err) {
      next(err);
    }
  }
);

router.delete('/:id', auth, async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) throw new ApiError(404, 'Ticket not found');
    if (ticket.user.toString() !== req.user.id && req.user.role !== 'admin') {
      throw new ApiError(403, 'Not authorized to delete this ticket');
    }
    await ticket.remove();
    logger.info('Ticket deleted', { ticketId: req.params.id, user: req.user.id });
    res.json({ msg: 'Ticket deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;