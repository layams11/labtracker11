import { dbService } from '../data/store.js';

// @desc    Get dashboard metrics and recent bookings
// @route   GET /api/dashboard
export const getDashboardData = async (req, res) => {
  try {
    const instruments = await dbService.getAllInstruments();
    const bookings = await dbService.getAllBookings();

    const totalInstruments = instruments.length;
    const availableInstruments = instruments.filter((i) => i.status === 'Available').length;
    const activeBookings = bookings.filter((b) => b.status === 'Booked').length;
    const totalBookings = bookings.length;

    // Recent 5 bookings
    const recentBookings = bookings.slice(0, 5);

    // Available instruments preview
    const availableInstrumentList = instruments
      .filter((i) => i.status === 'Available')
      .slice(0, 4);

    res.status(200).json({
      totalInstruments,
      availableInstruments,
      activeBookings,
      totalBookings,
      recentBookings,
      availableInstrumentList,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch dashboard data', error: error.message });
  }
};
