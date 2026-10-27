import { dbService } from '../data/store.js';

// Helper to convert HH:mm time string to minutes from 00:00
export const timeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const parts = timeStr.trim().split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
};

// @desc    Get all bookings
// @route   GET /api/bookings
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await dbService.getAllBookings();
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch bookings', error: error.message });
  }
};

// @desc    Get single booking by ID
// @route   GET /api/bookings/:id
export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await dbService.getBookingById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch booking', error: error.message });
  }
};

// @desc    Create a new booking with conflict checking
// @route   POST /api/bookings
export const createBooking = async (req, res) => {
  try {
    const { userName, email, instrumentId, date, startTime, endTime, purpose } = req.body;

    // 1. Validation checks
    if (!userName || !userName.trim()) {
      return res.status(400).json({ message: 'Full name is required.' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email address is required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ message: 'Please provide a valid email format.' });
    }

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
      return res.status(400).json({ message: 'Purpose of booking is required.' });
    }

    // 2. Validate instrument exists
    const instrument = await dbService.getInstrumentById(instrumentId);
    if (!instrument) {
      return res.status(404).json({ message: 'Selected instrument does not exist.' });
    }

    if (instrument.status === 'Maintenance') {
      return res.status(400).json({
        message: 'This instrument is currently under maintenance and cannot be booked.',
      });
    }

    // 3. Time comparison
    const newStartMins = timeToMinutes(startTime);
    const newEndMins = timeToMinutes(endTime);

    if (newEndMins <= newStartMins) {
      return res.status(400).json({
        message: 'End time must be later than start time.',
      });
    }

    // 4 & 5. Conflict Checking: Search existing bookings for same instrument, same date, not Cancelled
    const existingBookings = await dbService.getBookingsForConflictCheck(instrumentId, date);

    const hasConflict = existingBookings.some((existing) => {
      const existingStartMins = timeToMinutes(existing.startTime);
      const existingEndMins = timeToMinutes(existing.endTime);

      // Overlap condition: newStart < existingEnd AND newEnd > existingStart
      return newStartMins < existingEndMins && newEndMins > existingStartMins;
    });

    if (hasConflict) {
      return res.status(409).json({
        message: 'This instrument is already booked during the selected time.',
      });
    }

    // 6. Create booking
    const savedBooking = await dbService.createBooking({
      userName: userName.trim(),
      email: email.trim(),
      instrumentId,
      date,
      startTime,
      endTime,
      purpose: purpose.trim(),
      status: 'Booked',
    });

    res.status(201).json({
      message: 'Booking created successfully.',
      booking: savedBooking,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create booking', error: error.message });
  }
};

// @desc    Update booking (status: Booked, Completed, Cancelled)
// @route   PUT /api/bookings/:id
export const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, purpose, date, startTime, endTime } = req.body;

    const existing = await dbService.getBookingById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const updated = await dbService.updateBooking(id, {
      status: status ?? existing.status,
      purpose: purpose ?? existing.purpose,
      date: date ?? existing.date,
      startTime: startTime ?? existing.startTime,
      endTime: endTime ?? existing.endTime,
    });

    res.status(200).json({
      message: 'Booking updated successfully.',
      booking: updated,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update booking', error: error.message });
  }
};

// @desc    Cancel a booking
// @route   PATCH /api/bookings/:id/cancel
export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await dbService.getBookingById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const updated = await dbService.updateBooking(id, {
      status: 'Cancelled',
    });

    res.status(200).json({
      message: 'Booking cancelled successfully.',
      booking: updated,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to cancel booking', error: error.message });
  }
};

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
export const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await dbService.getBookingById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    await dbService.deleteBooking(id);
    res.status(200).json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete booking', error: error.message });
  }
};
