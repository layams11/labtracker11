import { dbService } from '../data/store.js';

// @desc    Get all scientific instruments
// @route   GET /api/instruments
export const getAllInstruments = async (req, res) => {
  try {
    const instruments = await dbService.getAllInstruments();
    res.status(200).json(instruments);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch instruments', error: error.message });
  }
};

// @desc    Get single instrument by ID
// @route   GET /api/instruments/:id
export const getInstrumentById = async (req, res) => {
  try {
    const { id } = req.params;
    const instrument = await dbService.getInstrumentById(id);
    if (!instrument) {
      return res.status(404).json({ message: 'Instrument not found' });
    }
    res.status(200).json(instrument);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch instrument', error: error.message });
  }
};

// @desc    Create new instrument
// @route   POST /api/instruments
export const createInstrument = async (req, res) => {
  try {
    const { name, category, location, description, status } = req.body;

    // Validation
    if (!name || !category || !location || !description) {
      return res.status(400).json({
        message: 'Name, Category, Location, and Description are required fields.',
      });
    }

    const newInstrument = await dbService.createInstrument({
      name,
      category,
      location,
      description,
      status: status || 'Available',
    });

    res.status(201).json(newInstrument);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create instrument', error: error.message });
  }
};

// @desc    Update instrument
// @route   PUT /api/instruments/:id
export const updateInstrument = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, location, description, status } = req.body;

    const existing = await dbService.getInstrumentById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Instrument not found' });
    }

    const updated = await dbService.updateInstrument(id, {
      name: name ?? existing.name,
      category: category ?? existing.category,
      location: location ?? existing.location,
      description: description ?? existing.description,
      status: status ?? existing.status,
    });

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update instrument', error: error.message });
  }
};

// @desc    Delete instrument
// @route   DELETE /api/instruments/:id
export const deleteInstrument = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await dbService.getInstrumentById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Instrument not found' });
    }

    await dbService.deleteInstrument(id);
    res.status(200).json({ message: 'Instrument deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete instrument', error: error.message });
  }
};
