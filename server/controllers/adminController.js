import { dbService, timeToMinutes } from '../data/store.js';

// @desc    Get admin dashboard metrics
// @route   GET /api/admin/dashboard
export const getAdminDashboard = async (req, res) => {
  try {
    const instruments = await dbService.getAllInstruments();
    const bookings = await dbService.getAllBookings();

    const totalInstruments = instruments.length;
    const availableInstruments = instruments.filter((i) => i.status === 'Available').length;
    const maintenanceInstruments = instruments.filter((i) => i.status === 'Maintenance').length;

    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter((b) => b.status === 'Confirmed').length;
    const inProgressBookings = bookings.filter((b) => b.status === 'In Progress').length;
    const completedBookings = bookings.filter((b) => b.status === 'Completed').length;
    const cancelledBookings = bookings.filter((b) => b.status === 'Cancelled').length;

    const recentBookings = bookings.slice(0, 6);

    res.status(200).json({
      totalInstruments,
      availableInstruments,
      maintenanceInstruments,
      totalBookings,
      confirmedBookings,
      inProgressBookings,
      completedBookings,
      cancelledBookings,
      recentBookings,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load admin dashboard', error: error.message });
  }
};

// @desc    Get all bookings for admin management
// @route   GET /api/admin/bookings
export const getAdminBookings = async (req, res) => {
  try {
    const bookings = await dbService.getAllBookings();
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch bookings', error: error.message });
  }
};

// @desc    Admin: Start Actual Usage Tracking
// @route   POST /api/admin/bookings/:id/start-usage
export const startUsage = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await dbService.getBookingById(id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    if (booking.status !== 'Confirmed') {
      return res.status(400).json({
        message: `Cannot start usage for booking with status "${booking.status}". Must be "Confirmed".`,
      });
    }

    const updated = await dbService.startUsage(id);

    res.status(200).json({
      message: 'Instrument usage started successfully. Status changed to "In Progress".',
      booking: updated,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to start usage', error: error.message });
  }
};

// @desc    Admin: End Actual Usage Tracking
// @route   POST /api/admin/bookings/:id/end-usage
export const endUsage = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await dbService.getBookingById(id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    if (booking.status !== 'In Progress') {
      return res.status(400).json({
        message: `Cannot end usage for booking with status "${booking.status}". Must be "In Progress".`,
      });
    }

    const updated = await dbService.endUsage(id);

    res.status(200).json({
      message: 'Instrument usage ended successfully. Status changed to "Completed".',
      booking: updated,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to end usage', error: error.message });
  }
};

// @desc    Admin: Cancel a booking (Frees the instrument slot)
// @route   POST /api/admin/bookings/:id/cancel
export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await dbService.getBookingById(id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    if (booking.status === 'Cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled.' });
    }

    if (booking.status === 'Completed') {
      return res.status(400).json({ message: 'Completed booking cannot be cancelled.' });
    }

    const updated = await dbService.cancelBooking(id);

    res.status(200).json({
      message: 'Booking cancelled successfully. The time slot is now available.',
      booking: updated,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to cancel booking', error: error.message });
  }
};

// @desc    Admin: Add new instrument
// @route   POST /api/admin/instruments
export const addInstrument = async (req, res) => {
  try {
    const { name, category, location, description, status } = req.body;

    if (!name || !category || !location || !description) {
      return res.status(400).json({
        message: 'Name, Category, Location, and Description are required.',
      });
    }

    const newInst = await dbService.createInstrument({
      name,
      category,
      location,
      description,
      status: status || 'Available',
    });

    res.status(201).json({
      message: 'Instrument created successfully.',
      instrument: newInst,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create instrument', error: error.message });
  }
};

// @desc    Admin: Edit instrument
// @route   PUT /api/admin/instruments/:id
export const editInstrument = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, location, description, status } = req.body;

    const existing = await dbService.getInstrumentById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Instrument not found.' });
    }

    const updated = await dbService.updateInstrument(id, {
      name: name ?? existing.name,
      category: category ?? existing.category,
      location: location ?? existing.location,
      description: description ?? existing.description,
      status: status ?? existing.status,
    });

    res.status(200).json({
      message: 'Instrument updated successfully.',
      instrument: updated,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update instrument', error: error.message });
  }
};

// @desc    Admin: Delete instrument
// @route   DELETE /api/admin/instruments/:id
export const deleteInstrument = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await dbService.getInstrumentById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Instrument not found.' });
    }

    await dbService.deleteInstrument(id);
    res.status(200).json({ message: 'Instrument deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete instrument', error: error.message });
  }
};

// @desc    Admin: Get Scheduled vs Actual Utilization Tracking
// @route   GET /api/admin/utilization
export const getAdminUtilization = async (req, res) => {
  try {
    const instruments = await dbService.getAllInstruments();
    const bookings = await dbService.getAllBookings();

    // Exclude cancelled bookings completely
    const validBookings = bookings.filter((b) => b.status !== 'Cancelled');
    const completedBookings = bookings.filter((b) => b.status === 'Completed');

    const utilizationData = instruments.map((inst) => {
      const instId = String(inst._id);

      // All active/valid bookings for this instrument
      const instValidBookings = validBookings.filter((b) => {
        const bInstId =
          typeof b.instrumentId === 'object' && b.instrumentId !== null
            ? String(b.instrumentId._id)
            : String(b.instrumentId);
        return bInstId === instId;
      });

      // Completed bookings for this instrument
      const instCompletedBookings = completedBookings.filter((b) => {
        const bInstId =
          typeof b.instrumentId === 'object' && b.instrumentId !== null
            ? String(b.instrumentId._id)
            : String(b.instrumentId);
        return bInstId === instId;
      });

      // 1. Scheduled Usage Duration (from endTime - startTime)
      let totalScheduledMinutes = 0;
      let latestDate = null;

      instValidBookings.forEach((b) => {
        const startMins = timeToMinutes(b.startTime);
        const endMins = timeToMinutes(b.endTime);
        const durationMins = Math.max(0, endMins - startMins);
        totalScheduledMinutes += durationMins;

        if (b.date) {
          if (!latestDate || b.date > latestDate) {
            latestDate = b.date;
          }
        }
      });

      // 2. Actual Usage Duration (from actualUsageDuration in minutes for COMPLETED bookings only)
      let totalActualMinutes = 0;
      instCompletedBookings.forEach((b) => {
        if (typeof b.actualUsageDuration === 'number') {
          totalActualMinutes += b.actualUsageDuration;
        }
      });

      const averageUsageMinutes =
        instCompletedBookings.length > 0
          ? Number((totalActualMinutes / instCompletedBookings.length).toFixed(1))
          : 0;

      const scheduledHours = Number((totalScheduledMinutes / 60).toFixed(1));
      const actualUsageHours = Number((totalActualMinutes / 60).toFixed(1));

      return {
        instrumentId: inst._id,
        instrumentName: inst.name,
        category: inst.category,
        location: inst.location,
        status: inst.status,
        totalBookings: instValidBookings.length,
        completedCount: instCompletedBookings.length,
        scheduledHours,
        totalScheduledMinutes,
        actualUsageMinutes: totalActualMinutes,
        actualUsageHours,
        averageUsageMinutes,
        lastUsedDate: latestDate || 'Never Used',
      };
    });

    // Sort by scheduledHours descending
    utilizationData.sort((a, b) => b.scheduledHours - a.scheduledHours);

    res.status(200).json(utilizationData);
  } catch (error) {
    res.status(500).json({ message: 'Failed to calculate utilization statistics', error: error.message });
  }
};
