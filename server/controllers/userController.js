import { dbService, timeToMinutes } from '../data/store.js';

// @desc    Get user-specific dashboard metrics
// @route   GET /api/user/dashboard
export const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const instruments = await dbService.getAllInstruments();
    const userBookings = await dbService.getUserBookings(userId);

    const availableInstrumentsCount = instruments.filter((i) => i.status === 'Available').length;
    const unavailableInstrumentsCount = instruments.filter((i) => i.status !== 'Available').length;

    // Active bookings are Confirmed or In Progress
    const activeBookingsCount = userBookings.filter(
      (b) => b.status === 'Confirmed' || b.status === 'In Progress'
    ).length;
    const completedBookingsCount = userBookings.filter((b) => b.status === 'Completed').length;
    const cancelledBookingsCount = userBookings.filter((b) => b.status === 'Cancelled').length;

    const recentBookings = userBookings.slice(0, 5);
    const availableInstruments = instruments.filter((i) => i.status === 'Available').slice(0, 4);

    res.status(200).json({
      user: {
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
      availableInstrumentsCount,
      unavailableInstrumentsCount,
      activeBookingsCount,
      completedBookingsCount,
      cancelledBookingsCount,
      recentBookings,
      availableInstruments,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load user dashboard', error: error.message });
  }
};

// @desc    Get bookings belonging ONLY to the logged in user
// @route   GET /api/user/bookings
export const getUserBookings = async (req, res) => {
  try {
    const userId = req.user._id;
    const bookings = await dbService.getUserBookings(userId);
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch your bookings', error: error.message });
  }
};

// @desc    Check instrument availability for date and time slot
// @route   POST /api/user/check-availability
export const checkInstrumentAvailability = async (req, res) => {
  try {
    const { instrumentId, date, startTime, endTime } = req.body;

    if (!instrumentId || !date || !startTime || !endTime) {
      return res.status(400).json({ message: 'Instrument, date, start time, and end time are required.' });
    }

    const instrument = await dbService.getInstrumentById(instrumentId);
    if (!instrument) {
      return res.status(404).json({ available: false, message: 'Instrument not found.' });
    }

    if (instrument.status === 'Maintenance') {
      return res.status(200).json({
        available: false,
        message: 'Instrument is currently under maintenance. Please select another instrument.',
      });
    }

    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(endTime);

    if (endMins <= startMins) {
      return res.status(400).json({
        available: false,
        message: 'End time must be later than start time.',
      });
    }

    // Backend conflict check: any existing booking on same instrument & date that is NOT Cancelled and overlaps
    const hasConflict = await dbService.checkBookingConflict(instrumentId, date, startTime, endTime);

    if (hasConflict) {
      return res.status(200).json({
        available: false,
        message: 'Instrument is already booked during this time. Please select another time.',
      });
    }

    return res.status(200).json({
      available: true,
      message: 'Available for booking',
    });
  } catch (error) {
    res.status(500).json({ message: 'Availability check failed', error: error.message });
  }
};

// @desc    Create a new booking with automatic confirmation
// @route   POST /api/user/bookings
export const createUserBooking = async (req, res) => {
  try {
    const userId = req.user._id;
    const { instrumentId, date, startTime, endTime, purpose } = req.body;

    // Validation
    if (!instrumentId) {
      return res.status(400).json({ message: 'Please select an instrument.' });
    }
    if (!date) {
      return res.status(400).json({ message: 'Date is required.' });
    }
    if (!startTime) {
      return res.status(400).json({ message: 'Start time is required.' });
    }
    if (!endTime) {
      return res.status(400).json({ message: 'End time is required.' });
    }
    if (!purpose || !purpose.trim()) {
      return res.status(400).json({ message: 'Purpose is required.' });
    }

    const instrument = await dbService.getInstrumentById(instrumentId);
    if (!instrument) {
      return res.status(404).json({ message: 'Selected instrument does not exist.' });
    }

    if (instrument.status === 'Maintenance') {
      return res.status(400).json({
        message: 'This instrument is under maintenance and cannot be booked.',
      });
    }

    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(endTime);

    if (endMins <= startMins) {
      return res.status(400).json({ message: 'End time must be later than start time.' });
    }

    // Backend conflict check:
    // newStartTime < existingEndTime AND newEndTime > existingStartTime
    const hasConflict = await dbService.checkBookingConflict(instrumentId, date, startTime, endTime);

    if (hasConflict) {
      return res.status(409).json({
        message: 'This instrument is already booked during the selected time.',
      });
    }

    // Automatically create the booking with status = "Confirmed"
    const newBooking = await dbService.createBooking({
      userId,
      instrumentId,
      date,
      startTime,
      endTime,
      purpose: purpose.trim(),
      status: 'Confirmed',
    });

    res.status(201).json({
      message: 'Booking confirmed successfully.',
      booking: newBooking,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create booking', error: error.message });
  }
};

// @desc    Cancel user's own booking
// @route   PATCH /api/user/bookings/:id/cancel
export const cancelUserBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const booking = await dbService.getBookingById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    const bookingUserId =
      typeof booking.userId === 'object' && booking.userId !== null
        ? String(booking.userId._id)
        : String(booking.userId);

    if (bookingUserId !== String(userId)) {
      return res.status(403).json({ message: 'You can only cancel your own bookings.' });
    }

    if (booking.status === 'Cancelled') {
      return res.status(400).json({ message: 'This booking is already cancelled.' });
    }

    if (booking.status === 'Completed') {
      return res.status(400).json({ message: 'Completed bookings cannot be cancelled.' });
    }

    // Free the slot
    const updated = await dbService.cancelBooking(id);

    res.status(200).json({
      message: 'Booking cancelled successfully. The time slot is now available.',
      booking: updated,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to cancel booking', error: error.message });
  }
};
