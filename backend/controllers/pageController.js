const Page = require('../models/Page');

// Get all pages
exports.getAllPages = async (req, res) => {
  try {
    const { isActive } = req.query;
    const filter = {};

    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const pages = await Page.find(filter)
      .populate('createdBy', 'email')
      .populate('updatedBy', 'email')
      .sort({ order: 1, 'title.en': 1 });

    res.json(pages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get page by slug (public)
exports.getPageBySlug = async (req, res) => {
  try {
    const page = await Page.findOne({ 
      slug: req.params.slug,
      isActive: true 
    });

    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }

    res.json(page);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get page by ID
exports.getPageById = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id)
      .populate('createdBy', 'email')
      .populate('updatedBy', 'email');

    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }

    res.json(page);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create page
exports.createPage = async (req, res) => {
  try {
    // Get the highest order value and add 1
    const maxOrderPage = await Page.findOne().sort({ order: -1 });
    const nextOrder = maxOrderPage ? maxOrderPage.order + 1 : 0;

    const pageData = {
      ...req.body,
      order: req.body.order !== undefined ? req.body.order : nextOrder,
      createdBy: req.user._id
    };

    const page = await Page.create(pageData);
    res.status(201).json(page);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Page with this slug already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};

// Update page
exports.updatePage = async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: req.user._id
    };

    const page = await Page.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }

    res.json(page);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Page with this slug already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};

// Delete page
exports.deletePage = async (req, res) => {
  try {
    const page = await Page.findByIdAndDelete(req.params.id);
    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }

    res.json({ message: 'Page deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle page active status
exports.togglePage = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }

    page.isActive = !page.isActive;
    page.updatedBy = req.user._id;
    await page.save();

    res.json(page);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update page order
exports.updateOrder = async (req, res) => {
  try {
    const { pages } = req.body; // Array of { id, order }

    const updatePromises = pages.map(({ id, order }) =>
      Page.findByIdAndUpdate(id, { order, updatedBy: req.user._id }, { new: true })
    );

    await Promise.all(updatePromises);

    const updatedPages = await Page.find().sort({ order: 1, 'title.en': 1 });
    res.json(updatedPages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

