import express from 'express';
import {
  getAdminDashboard,
  getAdminBookings,
  startUsage,
  endUsage,
  cancelBooking,
  addInstrument,
  editInstrument,
  deleteInstrument,
  getAdminUtilization,
} from '../controllers/adminController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Strict security: all admin routes require authenticated Admin role
router.use(requireAuth);
router.use(requireAdmin);

router.get('/dashboard', getAdminDashboard);
router.get('/bookings', getAdminBookings);

// Usage Tracking & Cancellation Actions
router.post('/bookings/:id/start-usage', startUsage);
router.post('/bookings/:id/end-usage', endUsage);
router.post('/bookings/:id/cancel', cancelBooking);

// Equipment Management
router.post('/instruments', addInstrument);
router.put('/instruments/:id', editInstrument);
router.delete('/instruments/:id', deleteInstrument);

// Utilization Tracking
router.get('/utilization', getAdminUtilization);

export default router;
