import express from 'express';
import { getDashboardData } from '../controllers/dashboardController.js';
import { dbService } from '../data/store.js';

const router = express.Router();

router.get('/', getDashboardData);

// Utility route to reset seed data for demonstrations if user wants
router.post('/reset-seed', async (req, res) => {
  try {
    const result = await dbService.resetSeedData();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Failed to reset seed data', error: error.message });
  }
});

export default router;
