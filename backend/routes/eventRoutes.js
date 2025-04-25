const express = require('express');
const router = express.Router();
const {
  getEvents,
  getEventsByDateRange,
  createEvent,
  updateEvent,
  deleteEvent
} = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected and require authentication
router.use(protect);

router.route('/')
  .get(getEvents)
  .post(createEvent);

router.get('/range', getEventsByDateRange);

router.route('/:id')
  .put(updateEvent)
  .delete(deleteEvent);

module.exports = router; 