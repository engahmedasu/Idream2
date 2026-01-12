const Video = require('../models/Video');

// Get all videos
exports.getAllVideos = async (req, res) => {
  try {
    const { isActive, category } = req.query;
    const filter = {};

    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    // Filter by category if provided (videos that have this category in their categories array)
    if (category) {
      filter.categories = { $in: [category] };
    }

    // For public access, only return active videos sorted by priority
    const videos = await Video.find(filter)
      .populate('createdBy', 'email')
      .populate('updatedBy', 'email')
      .populate('categories', 'name')
      .sort({ priority: -1, createdAt: -1 });

    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get video by ID
exports.getVideoById = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('createdBy', 'email')
      .populate('updatedBy', 'email')
      .populate('categories', 'name');

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    res.json(video);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create video
exports.createVideo = async (req, res) => {
  try {
    // Get the highest priority value and add 1
    const maxPriorityVideo = await Video.findOne().sort({ priority: -1 });
    const nextPriority = maxPriorityVideo ? maxPriorityVideo.priority + 1 : 0;

    // Parse categories from request body (can be array, JSON string, or comma-separated string)
    let categories = [];
    if (req.body.categories) {
      if (Array.isArray(req.body.categories)) {
        categories = req.body.categories;
      } else if (typeof req.body.categories === 'string') {
        try {
          // Try parsing as JSON first
          const parsed = JSON.parse(req.body.categories);
          if (Array.isArray(parsed)) {
            categories = parsed;
          } else {
            // Fallback to comma-separated
            categories = req.body.categories.split(',').map(id => id.trim()).filter(Boolean);
          }
        } catch {
          // Not JSON, treat as comma-separated string
          categories = req.body.categories.split(',').map(id => id.trim()).filter(Boolean);
        }
      }
    }

    const videoData = {
      title: req.body.title,
      description: req.body.description || '',
      videoUrl: req.files?.video ? `/uploads/videos/${req.files.video[0].filename}` : req.body.videoUrl || '',
      thumbnailUrl: req.files?.thumbnail ? `/uploads/videos/thumbnails/${req.files.thumbnail[0].filename}` : req.body.thumbnailUrl || '',
      priority: req.body.priority !== undefined ? parseInt(req.body.priority) : nextPriority,
      isActive: req.body.isActive !== undefined ? req.body.isActive === 'true' : true,
      categories: categories,
      createdBy: req.user._id
    };

    if (!videoData.videoUrl) {
      return res.status(400).json({ message: 'Video URL or video file is required' });
    }

    const video = await Video.create(videoData);
    const populatedVideo = await Video.findById(video._id)
      .populate('categories', 'name');
    res.status(201).json(populatedVideo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update video
exports.updateVideo = async (req, res) => {
  try {
    const updateData = {
      title: req.body.title,
      description: req.body.description,
      priority: req.body.priority !== undefined ? parseInt(req.body.priority) : undefined,
      isActive: req.body.isActive !== undefined ? req.body.isActive === 'true' : undefined,
      updatedBy: req.user._id
    };

    // Parse categories from request body (can be array, JSON string, or comma-separated string)
    if (req.body.categories !== undefined) {
      let categories = [];
      if (Array.isArray(req.body.categories)) {
        categories = req.body.categories;
      } else if (typeof req.body.categories === 'string') {
        try {
          // Try parsing as JSON first
          const parsed = JSON.parse(req.body.categories);
          if (Array.isArray(parsed)) {
            categories = parsed;
          } else {
            // Fallback to comma-separated
            categories = req.body.categories.split(',').map(id => id.trim()).filter(Boolean);
          }
        } catch {
          // Not JSON, treat as comma-separated string
          categories = req.body.categories.split(',').map(id => id.trim()).filter(Boolean);
        }
      }
      updateData.categories = categories;
    }

    if (req.files?.video) {
      updateData.videoUrl = `/uploads/videos/${req.files.video[0].filename}`;
    } else if (req.body.videoUrl !== undefined) {
      updateData.videoUrl = req.body.videoUrl;
    }

    if (req.files?.thumbnail) {
      updateData.thumbnailUrl = `/uploads/videos/thumbnails/${req.files.thumbnail[0].filename}`;
    } else if (req.body.thumbnailUrl !== undefined) {
      updateData.thumbnailUrl = req.body.thumbnailUrl;
    }

    // Remove undefined fields
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const video = await Video.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('categories', 'name');

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    res.json(video);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete video
exports.deleteVideo = async (req, res) => {
  try {
    const video = await Video.findByIdAndDelete(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Activate/Deactivate video
exports.toggleVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    video.isActive = !video.isActive;
    video.updatedBy = req.user._id;
    await video.save();

    res.json(video);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update video priority order
exports.updatePriority = async (req, res) => {
  try {
    const { videos } = req.body; // Array of { id, priority }

    const updatePromises = videos.map(({ id, priority }) =>
      Video.findByIdAndUpdate(id, { priority: parseInt(priority), updatedBy: req.user._id }, { new: true })
    );

    await Promise.all(updatePromises);

    const updatedVideos = await Video.find().sort({ priority: -1, createdAt: -1 });
    res.json(updatedVideos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

