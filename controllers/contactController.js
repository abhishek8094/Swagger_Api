const Contact = require('../models/Contact');

// @desc    Create a new contact
// @route   POST /api/contacts
// @access  Public
exports.createContact = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      const error = new Error('Please provide name, email, subject and message');
      error.statusCode = 400;
      return next(error);
    }

    // Create contact
    const contact = await Contact.create({
      name,
      email,
      subject,
      message
    });

    res.status(201).json({
      success: true,
      data: contact
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Get all contacts
// @route   GET /api/contacts
// @access  Public
exports.getContacts = async (req, res, next) => {
  try {
    const contacts = await Contact.find();

    res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Get single contact
// @route   GET /api/contacts/:id
// @access  Public
exports.getContactById = async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      const error = new Error('Contact not found');
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      data: contact
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Update contact
// @route   PUT /api/contacts/:id
// @access  Public
exports.updateContact = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    // Build update object
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (email !== undefined) updateFields.email = email;
    if (subject !== undefined) updateFields.subject = subject;
    if (message !== undefined) updateFields.message = message;

    // Validate at least one field is provided
    if (Object.keys(updateFields).length === 0) {
      const error = new Error('Please provide at least one field to update');
      error.statusCode = 400;
      return next(error);
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      updateFields,
      {
        new: true,
        runValidators: true
      }
    );

    if (!contact) {
      const error = new Error('Contact not found');
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      data: contact
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Delete contact
// @route   DELETE /api/contacts/:id
// @access  Public
exports.deleteContact = async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      const error = new Error('Contact not found');
      error.statusCode = 404;
      return next(error);
    }

    await Contact.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};
