const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Get all notes
router.get('/', noteController.getAllNotes);

// Get a single note
router.get('/:id', noteController.getNoteById);

// Create a new note
router.post('/', noteController.createNote);

// Update a note
router.put('/:id', noteController.updateNote);

// Delete a note
router.delete('/:id', noteController.deleteNote);

module.exports = router; 