const asyncHandler = require('express-async-handler');
const Contact = require('../models/contactModel');
const { saveAs } = require('file-saver');
const XLSX = require('xlsx');

// @desc Get all contacts for a user
// @route GET /contacts
// @access Private
const getContacts = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { search, tag } = req.query;

  // Build query
  const query = { user: userId };

  // Add search filter if provided
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } }
    ];
  }

  // Add tag filter if provided
  if (tag) {
    query.tags = tag;
  }

  const contacts = await Contact.find(query).sort({ createdAt: -1 });
  res.json(contacts);
});

// @desc Get a single contact
// @route GET /contacts/:id
// @access Private
const getContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findById(req.params.id);
  
  if (!contact) {
    res.status(404);
    throw new Error('Contact not found');
  }

  // Check for user
  if (contact.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to access this contact');
  }

  res.json(contact);
});

// @desc Create a new contact
// @route POST /contacts
// @access Private
const createContact = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const contactData = { ...req.body, user: userId };

  // Check for potential duplicates
  const duplicates = await Contact.findPotentialDuplicates(userId, contactData);
  
  if (duplicates.length > 0) {
    res.status(200);
    res.json({
      duplicates,
      message: 'Potential duplicates found',
      contact: contactData
    });
    return;
  }

  const contact = await Contact.create(contactData);
  res.status(201).json(contact);
});

// @desc Update a contact
// @route PUT /contacts/:id
// @access Private
const updateContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findById(req.params.id);

  if (!contact) {
    res.status(404);
    throw new Error('Contact not found');
  }

  // Check for user
  if (contact.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this contact');
  }

  // Check for potential duplicates, excluding the current contact
  const duplicates = await Contact.findPotentialDuplicates(req.user._id, {
    ...req.body,
    _id: { $ne: contact._id }
  });

  if (duplicates.length > 0) {
    res.status(200);
    res.json({
      duplicates,
      message: 'Potential duplicates found',
      contact: {
        ...contact.toObject(),
        ...req.body
      }
    });
    return;
  }

  const updatedContact = await Contact.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.json(updatedContact);
});

// @desc Delete a contact
// @route DELETE /contacts/:id
// @access Private
const deleteContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findById(req.params.id);

  if (!contact) {
    res.status(404);
    throw new Error('Contact not found');
  }

  // Check for user
  if (contact.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this contact');
  }

  await contact.deleteOne();
  res.json({ message: 'Contact deleted successfully' });
});

// @desc Import contacts from Excel
// @route POST /contacts/import
// @access Private
const importContacts = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { file } = req.files;

  if (!file) {
    res.status(400);
    throw new Error('Please upload a file');
  }

  // Read the Excel file
  const workbook = XLSX.read(file.data, { type: 'buffer' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet);

  // Process each row
  const contacts = [];
  const errors = [];

  for (const row of data) {
    try {
      const contactData = {
        user: userId,
        firstName: row.firstName || row['First Name'],
        lastName: row.lastName || row['Last Name'],
        email: row.email || row.Email,
        phone: row.phone || row.Phone,
        mobile: row.mobile || row.Mobile,
        company: row.company || row.Company,
        jobTitle: row.jobTitle || row['Job Title'],
        address: row.address || row.Address,
        city: row.city || row.City,
        state: row.state || row.State,
        country: row.country || row.Country,
        zipCode: row.zipCode || row['Zip Code'],
        website: row.website || row.Website,
        notes: row.notes || row.Notes,
        tags: row.tags ? row.tags.split(',').map(tag => tag.trim()) : []
      };

      // Check for duplicates
      const duplicates = await Contact.findPotentialDuplicates(userId, contactData);
      if (duplicates.length === 0) {
        const contact = await Contact.create(contactData);
        contacts.push(contact);
      } else {
        errors.push({
          data: contactData,
          message: 'Duplicate contact found'
        });
      }
    } catch (error) {
      errors.push({
        data: row,
        message: error.message
      });
    }
  }

  res.json({
    message: 'Import completed',
    imported: contacts.length,
    errors: errors.length,
    details: {
      successful: contacts,
      failed: errors
    }
  });
});

// @desc Export contacts to Excel
// @route GET /contacts/export
// @access Private
const exportContacts = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { tag } = req.query;

  // Build query
  const query = { user: userId };
  if (tag) {
    query.tags = tag;
  }

  const contacts = await Contact.find(query);

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(contacts.map(contact => ({
    'First Name': contact.firstName,
    'Last Name': contact.lastName,
    'Email': contact.email,
    'Phone': contact.phone,
    'Mobile': contact.mobile,
    'Company': contact.company,
    'Job Title': contact.jobTitle,
    'Address': contact.address,
    'City': contact.city,
    'State': contact.state,
    'Country': contact.country,
    'Zip Code': contact.zipCode,
    'Website': contact.website,
    'Notes': contact.notes,
    'Tags': contact.tags.join(', ')
  })));

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Contacts');

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  // Set headers
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=contacts.xlsx');

  // Send file
  res.send(buffer);
});

// @desc Create multiple contacts in batch
// @route POST /contacts/batch
// @access Private
const batchCreateContacts = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const contactsData = req.body;

  if (!Array.isArray(contactsData)) {
    res.status(400);
    throw new Error('Request body must be an array of contacts');
  }

  const results = {
    created: [],
    duplicates: [],
    errors: []
  };

  for (const contactData of contactsData) {
    try {
      const dataWithUser = { ...contactData, user: userId };
      
      // Check for potential duplicates
      const duplicates = await Contact.findPotentialDuplicates(userId, dataWithUser);
      
      if (duplicates.length > 0) {
        results.duplicates.push({
          data: dataWithUser,
          duplicates
        });
        continue;
      }

      const contact = await Contact.create(dataWithUser);
      results.created.push(contact);
    } catch (error) {
      results.errors.push({
        data: contactData,
        error: error.message
      });
    }
  }

  res.status(201).json(results);
});

module.exports = {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  importContacts,
  exportContacts,
  batchCreateContacts
}; 