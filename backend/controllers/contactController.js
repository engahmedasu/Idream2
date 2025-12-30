const ContactRequest = require('../models/ContactRequest');

// Submit contact request (public)
exports.submitContactRequest = async (req, res) => {
  try {
    const { name, email, service, message } = req.body;

    // Validation
    if (!name || !email || !service || !message) {
      return res.status(400).json({ 
        message: 'All fields are required' 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Invalid email address' 
      });
    }

    // Create contact request
    const contactRequest = await ContactRequest.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      service: service.trim(),
      message: message.trim(),
      status: 'new',
      isRead: false
    });

    res.status(201).json({
      message: 'Contact request submitted successfully',
      id: contactRequest._id
    });
  } catch (error) {
    console.error('Error submitting contact request:', error);
    res.status(500).json({ 
      message: 'Failed to submit contact request',
      error: error.message 
    });
  }
};

// Get all contact requests (admin only)
exports.getAllContactRequests = async (req, res) => {
  try {
    const { status, isRead, search, page = 1, limit = 20 } = req.query;
    
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (isRead !== undefined) {
      filter.isRead = isRead === 'true';
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { service: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [requests, total] = await Promise.all([
      ContactRequest.find(filter)
        .populate('readBy', 'email')
        .populate('repliedBy', 'email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ContactRequest.countDocuments(filter)
    ]);

    res.json({
      requests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching contact requests:', error);
    res.status(500).json({ 
      message: 'Failed to fetch contact requests',
      error: error.message 
    });
  }
};

// Get contact request by ID (admin only)
exports.getContactRequestById = async (req, res) => {
  try {
    const request = await ContactRequest.findById(req.params.id)
      .populate('readBy', 'email')
      .populate('repliedBy', 'email');

    if (!request) {
      return res.status(404).json({ message: 'Contact request not found' });
    }

    res.json(request);
  } catch (error) {
    console.error('Error fetching contact request:', error);
    res.status(500).json({ 
      message: 'Failed to fetch contact request',
      error: error.message 
    });
  }
};

// Mark as read (admin only)
exports.markAsRead = async (req, res) => {
  try {
    const request = await ContactRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Contact request not found' });
    }

    request.isRead = true;
    request.readAt = new Date();
    request.readBy = req.user._id;
    if (request.status === 'new') {
      request.status = 'read';
    }
    
    await request.save();

    res.json({
      message: 'Contact request marked as read',
      request
    });
  } catch (error) {
    console.error('Error marking contact request as read:', error);
    res.status(500).json({ 
      message: 'Failed to mark as read',
      error: error.message 
    });
  }
};

// Update status (admin only)
exports.updateStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const validStatuses = ['new', 'read', 'replied', 'archived'];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }

    const request = await ContactRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Contact request not found' });
    }

    if (status) {
      request.status = status;
      if (status === 'replied') {
        request.repliedAt = new Date();
        request.repliedBy = req.user._id;
      }
    }

    if (notes !== undefined) {
      request.notes = notes;
    }

    await request.save();

    res.json({
      message: 'Contact request updated successfully',
      request
    });
  } catch (error) {
    console.error('Error updating contact request:', error);
    res.status(500).json({ 
      message: 'Failed to update contact request',
      error: error.message 
    });
  }
};

// Delete contact request (admin only)
exports.deleteContactRequest = async (req, res) => {
  try {
    const request = await ContactRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Contact request not found' });
    }

    await ContactRequest.findByIdAndDelete(req.params.id);

    res.json({ message: 'Contact request deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact request:', error);
    res.status(500).json({ 
      message: 'Failed to delete contact request',
      error: error.message 
    });
  }
};

// Get statistics (admin only)
exports.getStatistics = async (req, res) => {
  try {
    const [total, newCount, readCount, repliedCount, archivedCount] = await Promise.all([
      ContactRequest.countDocuments(),
      ContactRequest.countDocuments({ status: 'new' }),
      ContactRequest.countDocuments({ status: 'read' }),
      ContactRequest.countDocuments({ status: 'replied' }),
      ContactRequest.countDocuments({ status: 'archived' })
    ]);

    res.json({
      total,
      new: newCount,
      read: readCount,
      replied: repliedCount,
      archived: archivedCount
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ 
      message: 'Failed to fetch statistics',
      error: error.message 
    });
  }
};

