const Request = require('../models/Request');

// Submit request (public)
exports.submitRequest = async (req, res) => {
  try {
    const { type, fullName, email, positionOfInterest, coverLetter, ideaTitle, briefIdeaDescription, companyName, serviceNeeded, projectDetails } = req.body;

    // Validation
    if (!type || !fullName || !email) {
      return res.status(400).json({ 
        message: 'Type, full name, and email are required' 
      });
    }

    if (!['join-our-team', 'new-ideas', 'hire-expert'].includes(type)) {
      return res.status(400).json({ 
        message: 'Invalid request type' 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Invalid email address' 
      });
    }

    // Type-specific validation
    if (type === 'join-our-team' && (!positionOfInterest || !coverLetter)) {
      return res.status(400).json({ 
        message: 'Position of interest and cover letter are required for Join Our Team requests' 
      });
    }

    if (type === 'new-ideas' && (!ideaTitle || !briefIdeaDescription)) {
      return res.status(400).json({ 
        message: 'Idea title and brief idea description are required for New Ideas requests' 
      });
    }

    if (type === 'hire-expert' && (!serviceNeeded || !projectDetails)) {
      return res.status(400).json({ 
        message: 'Service needed and project details are required for Hire Expert requests' 
      });
    }

    // Handle document upload
    let documentPath = '';
    let documentName = '';
    if (req.file) {
      documentPath = `/uploads/requests/${req.file.filename}`;
      documentName = req.file.originalname;
    }

    // Create request
    const request = await Request.create({
      type,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      positionOfInterest: positionOfInterest?.trim() || '',
      coverLetter: coverLetter?.trim() || '',
      ideaTitle: ideaTitle?.trim() || '',
      briefIdeaDescription: briefIdeaDescription?.trim() || '',
      companyName: companyName?.trim() || '',
      serviceNeeded: serviceNeeded?.trim() || '',
      projectDetails: projectDetails?.trim() || '',
      document: documentPath,
      documentName: documentName,
      status: 'new',
      isRead: false
    });

    res.status(201).json({
      message: 'Request submitted successfully',
      id: request._id
    });
  } catch (error) {
    console.error('Error submitting request:', error);
    res.status(500).json({ 
      message: 'Failed to submit request',
      error: error.message 
    });
  }
};

// Get all requests (admin only)
exports.getAllRequests = async (req, res) => {
  try {
    const { type, status, isRead, search, page = 1, limit = 20 } = req.query;
    
    const filter = {};
    
    if (type) {
      filter.type = type;
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (isRead !== undefined) {
      filter.isRead = isRead === 'true';
    }
    
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { positionOfInterest: { $regex: search, $options: 'i' } },
        { coverLetter: { $regex: search, $options: 'i' } },
        { ideaTitle: { $regex: search, $options: 'i' } },
        { briefIdeaDescription: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { serviceNeeded: { $regex: search, $options: 'i' } },
        { projectDetails: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [requests, total] = await Promise.all([
      Request.find(filter)
        .populate('readBy', 'email')
        .populate('repliedBy', 'email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Request.countDocuments(filter)
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
    console.error('Error fetching requests:', error);
    res.status(500).json({ 
      message: 'Failed to fetch requests',
      error: error.message 
    });
  }
};

// Get request by ID (admin only)
exports.getRequestById = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('readBy', 'email')
      .populate('repliedBy', 'email');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.json(request);
  } catch (error) {
    console.error('Error fetching request:', error);
    res.status(500).json({ 
      message: 'Failed to fetch request',
      error: error.message 
    });
  }
};

// Mark as read (admin only)
exports.markAsRead = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.isRead = true;
    request.readAt = new Date();
    request.readBy = req.user._id;
    if (request.status === 'new') {
      request.status = 'read';
    }
    
    await request.save();

    res.json({
      message: 'Request marked as read',
      request
    });
  } catch (error) {
    console.error('Error marking request as read:', error);
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

    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
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
      message: 'Request updated successfully',
      request
    });
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(500).json({ 
      message: 'Failed to update request',
      error: error.message 
    });
  }
};

// Delete request (admin only)
exports.deleteRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    await Request.findByIdAndDelete(req.params.id);

    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Error deleting request:', error);
    res.status(500).json({ 
      message: 'Failed to delete request',
      error: error.message 
    });
  }
};

// Get statistics (admin only)
exports.getStatistics = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = type ? { type } : {};

    const [total, newCount, readCount, repliedCount, archivedCount] = await Promise.all([
      Request.countDocuments(filter),
      Request.countDocuments({ ...filter, status: 'new' }),
      Request.countDocuments({ ...filter, status: 'read' }),
      Request.countDocuments({ ...filter, status: 'replied' }),
      Request.countDocuments({ ...filter, status: 'archived' })
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
