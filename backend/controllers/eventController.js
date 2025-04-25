const Event = require('../models/Event');
const asyncHandler = require('express-async-handler');

// @desc    Get all events for a user
// @route   GET events
// @access  Private
const getEvents = asyncHandler(async (req, res) => {
  const events = await Event.find({ user: req.user._id }).sort({ date: 1 });
  res.status(200).json(events);
});

// @desc    Get events by date range
// @route   GET /events/range
// @access  Private
const getEventsByDateRange = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    res.status(400);
    throw new Error('Please provide start and end dates');
  }

  const events = await Event.find({
    user: req.user._id,
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).sort({ date: 1 });

  res.status(200).json(events);
});

// @desc    Create a new event
// @route   POST /events
// @access  Private
const createEvent = asyncHandler(async (req, res) => {
  const { title, description, date, tag } = req.body;

  if (!title || !date) {
    res.status(400);
    throw new Error('Please provide title and date');
  }

  const event = await Event.create({
    title,
    description,
    date,
    tag: tag || 'general',
    user: req.user._id
  });

  res.status(201).json(event);
});

// @desc    Update an event
// @route   PUT /events/:id
// @access  Private
const updateEvent = asyncHandler(async (req, res) => {
  const { title, description, date, tag } = req.body;
  const event = await Event.findById(req.params.id);

  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }

  // Check if the event belongs to the user
  if (event.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized');
  }

  event.title = title || event.title;
  event.description = description || event.description;
  event.date = date || event.date;
  event.tag = tag || event.tag;

  const updatedEvent = await event.save();
  res.status(200).json(updatedEvent);
});

// @desc    Delete an event
// @route   DELETE /events/:id
// @access  Private
const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }

  // Check if the event belongs to the user
  if (event.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized');
  }

  await event.remove();
  res.status(200).json({ message: 'Event removed' });
});

module.exports = {
  getEvents,
  getEventsByDateRange,
  createEvent,
  updateEvent,
  deleteEvent
}; 