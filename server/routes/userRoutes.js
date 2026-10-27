import express from 'express';
import {
  getUserDashboard,
  getUserBookings,
  createUserBooking,
  cancelUserBooking,
  checkInstrumentAvailability,
} from '../controllers/userController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// All user routes require authentication
router.use(requireAuth);

router.get('/dashboard', getUserDashboard);
router.get('/bookings', getUserBookings);
router.post('/bookings', createUserBooking);
router.patch('/bookings/:id/cancel', cancelUserBooking);
router.post('/check-availability', checkInstrumentAvailability);

export default router;
