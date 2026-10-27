import { dbService } from '../data/store.js';
import { timeToMinutes } from './bookingController.js';

// @desc    Get calculated utilization statistics
// @route   GET /api/utilization
export const getUtilizationStats = async (req, res) => {
  try {
    const instruments = await dbService.getAllInstruments();
    const bookings = await dbService.getAllBookings();

    // Filter out Cancelled bookings
    const validBookings = bookings.filter((b) => b.status !== 'Cancelled');

    // Group and calculate for each instrument
    const utilizationData = instruments.map((inst) => {
      const instId = String(inst._id);
      const instBookings = validBookings.filter((b) => {
        const bInstId = typeof b.instrumentId === 'object' && b.instrumentId !== null
          ? String(b.instrumentId._id)
          : String(b.instrumentId);
        return bInstId === instId;
      });

      // Calculate total usage hours
      let totalUsageMinutes = 0;
      let latestDate = null;

      instBookings.forEach((b) => {
        const startMins = timeToMinutes(b.startTime);
        const endMins = timeToMinutes(b.endTime);
        const durationMins = Math.max(0, endMins - startMins);
        totalUsageMinutes += durationMins;

        if (b.date) {
          if (!latestDate || b.date > latestDate) {
            latestDate = b.date;
          }
        }
      });

      const totalUsageHours = Number((totalUsageMinutes / 60).toFixed(1));

      return {
        instrumentId: inst._id,
        instrumentName: inst.name,
        category: inst.category,
        location: inst.location,
        status: inst.status,
        bookingCount: instBookings.length,
        totalUsageHours: totalUsageHours,
        lastUsedDate: latestDate || 'Never Used',
      };
    });

    // Sort by bookingCount descending, then totalUsageHours descending
    utilizationData.sort((a, b) => b.totalUsageHours - a.totalUsageHours);

    res.status(200).json(utilizationData);
  } catch (error) {
    res.status(500).json({ message: 'Failed to calculate utilization statistics', error: error.message });
  }
};
