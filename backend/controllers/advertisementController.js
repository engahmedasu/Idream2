const Advertisement = require('../models/Advertisement');
const path = require('path');
const fs = require('fs');

// Helper function to get image URL
const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  return imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
};

// Get all advertisements (admin)
exports.getAllAdvertisements = async (req, res) => {
  try {
    const { category, side, isActive, search } = req.query;
    const filter = {};

    if (category) {
      filter.categories = { $in: [category] };
    }
    if (side) {
      filter.side = side;
    }
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    if (search) {
      filter.$or = [
        { redirectUrl: { $regex: search, $options: 'i' } }
      ];
    }

    const advertisements = await Advertisement.find(filter)
      .populate('categories', 'name')
      .populate('createdBy', 'email')
      .populate('updatedBy', 'email')
      .sort({ priority: -1, createdAt: -1 });

    // Transform image paths to full URLs
    const transformedAds = advertisements.map(ad => ({
      ...ad.toObject(),
      image: getImageUrl(ad.image)
    }));

    res.json(transformedAds);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get active advertisements for frontend (public)
exports.getActiveAdvertisements = async (req, res) => {
  try {
    const { category, side, home } = req.query;
    const now = new Date();
    
    const filter = {
      isActive: true,
      $or: [
        { startDate: null, endDate: null },
        { startDate: null, endDate: { $gte: now } },
        { startDate: { $lte: now }, endDate: null },
        { startDate: { $lte: now }, endDate: { $gte: now } }
      ]
    };

    // If home=true is passed, filter by showInHome flag (only show ads marked for home)
    if (home === 'true') {
      filter.showInHome = true;
    }

    // If category is provided, filter by category (link advertisements to categories)
    if (category) {
      filter.categories = { $in: [category] };
    }
    if (side) {
      filter.side = side;
    }

    const advertisements = await Advertisement.find(filter)
      .populate('categories', 'name')
      .sort({ priority: -1, createdAt: -1 });

    // Transform image paths to full URLs and verify files exist
    const transformedAds = advertisements
      .map(ad => {
        const adObj = ad.toObject();
        let imagePath = getImageUrl(adObj.image);
        
        // Verify file exists if it's a local path
        if (imagePath && !imagePath.startsWith('http://') && !imagePath.startsWith('https://')) {
          // Remove leading slash for path.join to work correctly
          const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
          const filePath = path.join(__dirname, '..', cleanPath);
          if (!fs.existsSync(filePath)) {
            console.warn(`Advertisement image not found: ${filePath} for ad ${adObj._id}`);
            // Return null to filter out this ad
            return null;
          }
        }
        
        return {
          ...adObj,
          image: imagePath
        };
      })
      .filter(ad => ad !== null && ad.image); // Only return ads with valid images

    res.json(transformedAds);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get advertisement by ID
exports.getAdvertisementById = async (req, res) => {
  try {
    const advertisement = await Advertisement.findById(req.params.id)
      .populate('categories', 'name')
      .populate('createdBy', 'email')
      .populate('updatedBy', 'email');

    if (!advertisement) {
      return res.status(404).json({ message: 'Advertisement not found' });
    }

    const transformedAd = {
      ...advertisement.toObject(),
      image: getImageUrl(advertisement.image)
    };

    res.json(transformedAd);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create advertisement
exports.createAdvertisement = async (req, res) => {
  try {
    // Get the highest priority value and add 1
    const maxPriorityAd = await Advertisement.findOne().sort({ priority: -1 });
    const nextPriority = maxPriorityAd ? maxPriorityAd.priority + 1 : 0;

    // Parse categories from request body
    let categories = [];
    if (req.body.categories) {
      if (Array.isArray(req.body.categories)) {
        categories = req.body.categories;
      } else if (typeof req.body.categories === 'string') {
        try {
          const parsed = JSON.parse(req.body.categories);
          if (Array.isArray(parsed)) {
            categories = parsed;
          } else {
            categories = req.body.categories.split(',').map(id => id.trim()).filter(Boolean);
          }
        } catch {
          categories = req.body.categories.split(',').map(id => id.trim()).filter(Boolean);
        }
      }
    }

    if (categories.length === 0) {
      return res.status(400).json({ message: 'At least one category is required' });
    }

    // Handle image upload
    let imagePath = '';
    if (req.file) {
      imagePath = `/uploads/advertisements/${req.file.filename}`;
    } else if (req.body.imageUrl) {
      imagePath = req.body.imageUrl;
    } else {
      return res.status(400).json({ message: 'Image file or image URL is required' });
    }

    const advertisementData = {
      image: imagePath,
      categories: categories,
      side: req.body.side,
      isActive: req.body.isActive !== undefined ? req.body.isActive === 'true' : true,
      showInHome: req.body.showInHome !== undefined ? req.body.showInHome === 'true' : false,
      startDate: req.body.startDate ? new Date(req.body.startDate) : null,
      endDate: req.body.endDate ? new Date(req.body.endDate) : null,
      redirectUrl: req.body.redirectUrl || '',
      priority: req.body.priority !== undefined ? parseInt(req.body.priority) : nextPriority,
      createdBy: req.user._id
    };

    const advertisement = await Advertisement.create(advertisementData);
    const populatedAd = await Advertisement.findById(advertisement._id)
      .populate('categories', 'name');
    
    const transformedAd = {
      ...populatedAd.toObject(),
      image: getImageUrl(populatedAd.image)
    };

    res.status(201).json(transformedAd);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update advertisement
exports.updateAdvertisement = async (req, res) => {
  try {
    const advertisement = await Advertisement.findById(req.params.id);
    if (!advertisement) {
      return res.status(404).json({ message: 'Advertisement not found' });
    }

    // Parse categories from request body
    if (req.body.categories !== undefined) {
      let categories = [];
      if (Array.isArray(req.body.categories)) {
        categories = req.body.categories;
      } else if (typeof req.body.categories === 'string') {
        try {
          const parsed = JSON.parse(req.body.categories);
          if (Array.isArray(parsed)) {
            categories = parsed;
          } else {
            categories = req.body.categories.split(',').map(id => id.trim()).filter(Boolean);
          }
        } catch {
          categories = req.body.categories.split(',').map(id => id.trim()).filter(Boolean);
        }
      }
      
      if (categories.length === 0) {
        return res.status(400).json({ message: 'At least one category is required' });
      }
      advertisement.categories = categories;
    }

    // Handle image update
    if (req.file) {
      // Delete old image if it exists and is a local file
      if (advertisement.image && !advertisement.image.startsWith('http')) {
        const oldImagePath = path.join(__dirname, '..', advertisement.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      advertisement.image = `/uploads/advertisements/${req.file.filename}`;
    } else if (req.body.imageUrl !== undefined) {
      // Delete old image if it exists and is a local file
      if (advertisement.image && !advertisement.image.startsWith('http')) {
        const oldImagePath = path.join(__dirname, '..', advertisement.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      advertisement.image = req.body.imageUrl;
    }

    if (req.body.side !== undefined) advertisement.side = req.body.side;
    if (req.body.isActive !== undefined) advertisement.isActive = req.body.isActive === 'true';
    if (req.body.showInHome !== undefined) advertisement.showInHome = req.body.showInHome === 'true';
    if (req.body.startDate !== undefined) {
      advertisement.startDate = req.body.startDate ? new Date(req.body.startDate) : null;
    }
    if (req.body.endDate !== undefined) {
      advertisement.endDate = req.body.endDate ? new Date(req.body.endDate) : null;
    }
    if (req.body.redirectUrl !== undefined) advertisement.redirectUrl = req.body.redirectUrl || '';
    if (req.body.priority !== undefined) advertisement.priority = parseInt(req.body.priority);
    advertisement.updatedBy = req.user._id;

    await advertisement.save();
    const populatedAd = await Advertisement.findById(advertisement._id)
      .populate('categories', 'name');
    
    const transformedAd = {
      ...populatedAd.toObject(),
      image: getImageUrl(populatedAd.image)
    };

    res.json(transformedAd);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete advertisement
exports.deleteAdvertisement = async (req, res) => {
  try {
    const advertisement = await Advertisement.findById(req.params.id);
    if (!advertisement) {
      return res.status(404).json({ message: 'Advertisement not found' });
    }

    // Delete image file if it exists and is a local file
    if (advertisement.image && !advertisement.image.startsWith('http')) {
      const imagePath = path.join(__dirname, '..', advertisement.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Advertisement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Advertisement deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle advertisement status
exports.toggleAdvertisementStatus = async (req, res) => {
  try {
    const advertisement = await Advertisement.findById(req.params.id);
    if (!advertisement) {
      return res.status(404).json({ message: 'Advertisement not found' });
    }

    advertisement.isActive = !advertisement.isActive;
    advertisement.updatedBy = req.user._id;
    await advertisement.save();

    const populatedAd = await Advertisement.findById(advertisement._id)
      .populate('categories', 'name');
    
    const transformedAd = {
      ...populatedAd.toObject(),
      image: getImageUrl(populatedAd.image)
    };

    res.json(transformedAd);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
