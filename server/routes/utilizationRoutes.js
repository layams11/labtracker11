import express from 'express';
import { getUtilizationStats } from '../controllers/utilizationController.js';

const router = express.Router();

router.get('/', getUtilizationStats);

export default router;
