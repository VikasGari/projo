const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  importContacts,
  exportContacts,
  batchCreateContacts
} = require('../controllers/contactController');

// All routes require authentication
router.use(protect);

// Contact routes
router.get('/', getContacts);
router.get('/:id', getContact);
router.post('/', createContact);
router.post('/batch', batchCreateContacts);
router.post('/import', importContacts);
router.get('/export', exportContacts);
router.put('/:id', updateContact);
router.delete('/:id', deleteContact);

module.exports = router; 