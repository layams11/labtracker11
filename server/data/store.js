import mongoose from 'mongoose';
import User from '../models/User.js';
import Instrument from '../models/Instrument.js';
import Booking from '../models/Booking.js';
import { initialUsers, initialInstruments, initialBookings } from './seedData.js';

let isMongoConnected = false;

// In-memory fallback stores
let memoryUsers = JSON.parse(JSON.stringify(initialUsers));
let memoryInstruments = JSON.parse(JSON.stringify(initialInstruments));
let memoryBookings = JSON.parse(JSON.stringify(initialBookings));

export async function connectDB(mongoUri) {
  const uri = mongoUri || process.env.MONGO_URI || 'mongodb://localhost:27017/scientific_instrument_booking';

  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
    });
    isMongoConnected = true;
    console.log(`[Database] MongoDB Connected successfully to: ${uri}`);

    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Database] Seeding initial users...');
      await User.insertMany(initialUsers);
    }

    const instrumentCount = await Instrument.countDocuments();
    if (instrumentCount === 0) {
      console.log('[Database] Seeding initial instruments...');
      await Instrument.insertMany(initialInstruments);
    }

    const bookingCount = await Booking.countDocuments();
    if (bookingCount === 0) {
      console.log('[Database] Seeding initial bookings...');
      await Booking.insertMany(initialBookings);
    }
  } catch (error) {
    isMongoConnected = false;
    console.log('[Database] Local MongoDB not reachable (' + error.message + ').');
    console.log('[Database] Operating with resilient Mongoose in-memory datastore.');
  }
}

function generateObjectId() {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const random = Math.floor(Math.random() * 0xffffffffffff).toString(16).padStart(12, '0');
  const counter = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
  return timestamp + random + counter;
}

export const timeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const parts = timeStr.trim().split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
};

export const dbService = {
  getIsConnected() {
    return isMongoConnected;
  },

  // USER METHODS
  async getUserByEmail(email) {
    const cleanEmail = (email || '').toLowerCase().trim();
    if (isMongoConnected) {
      return await User.findOne({ email: cleanEmail });
    }
    return memoryUsers.find((u) => u.email.toLowerCase() === cleanEmail) || null;
  },

  async getUserById(id) {
    if (isMongoConnected) {
      return await User.findById(id).select('-password');
    }
    const user = memoryUsers.find((u) => String(u._id) === String(id));
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser;
  },

  async getAllUsers() {
    if (isMongoConnected) {
      return await User.find().select('-password');
    }
    return memoryUsers.map(({ password, ...u }) => u);
  },

  // INSTRUMENT METHODS
  async getAllInstruments() {
    if (isMongoConnected) {
      return await Instrument.find().sort({ createdAt: -1 });
    }
    return [...memoryInstruments];
  },

  async getInstrumentById(id) {
    if (isMongoConnected) {
      return await Instrument.findById(id);
    }
    return memoryInstruments.find((item) => String(item._id) === String(id)) || null;
  },

  async createInstrument(data) {
    if (isMongoConnected) {
      const inst = new Instrument(data);
      return await inst.save();
    }
    const newInst = {
      _id: generateObjectId(),
      name: data.name.trim(),
      category: data.category.trim(),
      location: data.location.trim(),
      description: data.description.trim(),
      status: data.status || 'Available',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryInstruments.unshift(newInst);
    return newInst;
  },

  async updateInstrument(id, data) {
    if (isMongoConnected) {
      return await Instrument.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    }
    const index = memoryInstruments.findIndex((item) => String(item._id) === String(id));
    if (index === -1) return null;
    memoryInstruments[index] = {
      ...memoryInstruments[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return memoryInstruments[index];
  },

  async deleteInstrument(id) {
    if (isMongoConnected) {
      return await Instrument.findByIdAndDelete(id);
    }
    const index = memoryInstruments.findIndex((item) => String(item._id) === String(id));
    if (index === -1) return null;
    const deleted = memoryInstruments.splice(index, 1);
    memoryBookings = memoryBookings.filter((b) => String(b.instrumentId) !== String(id));
    return deleted[0];
  },

  // BOOKING METHODS
  async getAllBookings() {
    if (isMongoConnected) {
      return await Booking.find()
        .populate('userId', 'name email role')
        .populate('instrumentId')
        .sort({ date: -1, startTime: -1 });
    }
    return memoryBookings
      .map((b) => {
        const user = memoryUsers.find((u) => String(u._id) === String(b.userId));
        const inst = memoryInstruments.find((i) => String(i._id) === String(b.instrumentId));
        return {
          ...b,
          userId: user
            ? { _id: user._id, name: user.name, email: user.email, role: user.role }
            : { _id: b.userId, name: 'User', email: '' },
          instrumentId: inst || { _id: b.instrumentId, name: 'Unknown Instrument' },
        };
      })
      .sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime));
  },

  async getUserBookings(userId) {
    if (isMongoConnected) {
      return await Booking.find({ userId })
        .populate('userId', 'name email')
        .populate('instrumentId')
        .sort({ date: -1, startTime: -1 });
    }
    return memoryBookings
      .filter((b) => String(b.userId) === String(userId))
      .map((b) => {
        const user = memoryUsers.find((u) => String(u._id) === String(b.userId));
        const inst = memoryInstruments.find((i) => String(i._id) === String(b.instrumentId));
        return {
          ...b,
          userId: user ? { _id: user._id, name: user.name, email: user.email } : null,
          instrumentId: inst || { _id: b.instrumentId, name: 'Unknown Instrument' },
        };
      })
      .sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime));
  },

  async getBookingById(id) {
    if (isMongoConnected) {
      return await Booking.findById(id).populate('userId', 'name email').populate('instrumentId');
    }
    const b = memoryBookings.find((item) => String(item._id) === String(id));
    if (!b) return null;
    const user = memoryUsers.find((u) => String(u._id) === String(b.userId));
    const inst = memoryInstruments.find((i) => String(i._id) === String(b.instrumentId));
    return {
      ...b,
      userId: user ? { _id: user._id, name: user.name, email: user.email } : null,
      instrumentId: inst || { _id: b.instrumentId, name: 'Unknown Instrument' },
    };
  },

  // Check booking conflict:
  // Same instrument, same date, existing booking status is NOT "Cancelled"
  // Overlap condition: newStartTime < existingEndTime AND newEndTime > existingStartTime
  async checkBookingConflict(instrumentId, date, startTime, endTime, excludeBookingId = null) {
    const newStartMins = timeToMinutes(startTime);
    const newEndMins = timeToMinutes(endTime);

    let activeBookings = [];
    if (isMongoConnected) {
      const query = {
        instrumentId,
        date,
        status: { $ne: 'Cancelled' },
      };
      if (excludeBookingId) {
        query._id = { $ne: excludeBookingId };
      }
      activeBookings = await Booking.find(query);
    } else {
      activeBookings = memoryBookings.filter((b) => {
        const matchesInst = String(b.instrumentId) === String(instrumentId);
        const matchesDate = b.date === date;
        const notCancelled = b.status !== 'Cancelled';
        const notExcluded = !excludeBookingId || String(b._id) !== String(excludeBookingId);
        return matchesInst && matchesDate && notCancelled && notExcluded;
      });
    }

    const hasConflict = activeBookings.some((existing) => {
      const existingStartMins = timeToMinutes(existing.startTime);
      const existingEndMins = timeToMinutes(existing.endTime);
      // Overlap: newStartTime < existingEndTime AND newEndTime > existingStartTime
      return newStartMins < existingEndMins && newEndMins > existingStartMins;
    });

    return hasConflict;
  },

  // Automatically creates booking with status = "Confirmed"
  async createBooking(data) {
    const bookingPayload = {
      userId: data.userId,
      instrumentId: data.instrumentId,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      purpose: data.purpose.trim(),
      status: data.status || 'Confirmed',
      actualStartTime: data.actualStartTime || null,
      actualEndTime: data.actualEndTime || null,
      actualUsageDuration: data.actualUsageDuration || null,
    };

    if (isMongoConnected) {
      const booking = new Booking(bookingPayload);
      const saved = await booking.save();
      return await Booking.findById(saved._id)
        .populate('userId', 'name email')
        .populate('instrumentId');
    }

    const newBooking = {
      _id: generateObjectId(),
      ...bookingPayload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryBookings.unshift(newBooking);
    const user = memoryUsers.find((u) => String(u._id) === String(newBooking.userId));
    const inst = memoryInstruments.find((i) => String(i._id) === String(newBooking.instrumentId));
    return {
      ...newBooking,
      userId: user ? { _id: user._id, name: user.name, email: user.email } : null,
      instrumentId: inst || { _id: newBooking.instrumentId, name: 'Unknown Instrument' },
    };
  },

  // Start Usage: status -> "In Progress", sets actualStartTime
  async startUsage(id) {
    const now = new Date();
    const update = {
      status: 'In Progress',
      actualStartTime: now,
    };

    if (isMongoConnected) {
      return await Booking.findByIdAndUpdate(id, update, { new: true, runValidators: true })
        .populate('userId', 'name email')
        .populate('instrumentId');
    }

    const index = memoryBookings.findIndex((item) => String(item._id) === String(id));
    if (index === -1) return null;
    memoryBookings[index] = {
      ...memoryBookings[index],
      ...update,
      actualStartTime: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    const b = memoryBookings[index];
    const user = memoryUsers.find((u) => String(u._id) === String(b.userId));
    const inst = memoryInstruments.find((i) => String(i._id) === String(b.instrumentId));
    return {
      ...b,
      userId: user ? { _id: user._id, name: user.name, email: user.email } : null,
      instrumentId: inst || { _id: b.instrumentId, name: 'Unknown Instrument' },
    };
  },

  // End Usage: status -> "Completed", sets actualEndTime and calculates actualUsageDuration in minutes
  async endUsage(id) {
    const existing = await this.getBookingById(id);
    if (!existing) return null;

    const endTime = new Date();
    const startTime = existing.actualStartTime ? new Date(existing.actualStartTime) : new Date(Date.now() - 3600000);
    const diffMs = endTime.getTime() - startTime.getTime();
    // Duration in minutes (at least 1 minute if positive)
    const durationMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));

    const update = {
      status: 'Completed',
      actualEndTime: endTime,
      actualUsageDuration: durationMinutes,
    };

    if (isMongoConnected) {
      return await Booking.findByIdAndUpdate(id, update, { new: true, runValidators: true })
        .populate('userId', 'name email')
        .populate('instrumentId');
    }

    const index = memoryBookings.findIndex((item) => String(item._id) === String(id));
    if (index === -1) return null;
    memoryBookings[index] = {
      ...memoryBookings[index],
      status: 'Completed',
      actualEndTime: endTime.toISOString(),
      actualUsageDuration: durationMinutes,
      updatedAt: endTime.toISOString(),
    };
    const b = memoryBookings[index];
    const user = memoryUsers.find((u) => String(u._id) === String(b.userId));
    const inst = memoryInstruments.find((i) => String(i._id) === String(b.instrumentId));
    return {
      ...b,
      userId: user ? { _id: user._id, name: user.name, email: user.email } : null,
      instrumentId: inst || { _id: b.instrumentId, name: 'Unknown Instrument' },
    };
  },

  // Cancel Booking (status -> "Cancelled")
  async cancelBooking(id) {
    const update = { status: 'Cancelled' };
    if (isMongoConnected) {
      return await Booking.findByIdAndUpdate(id, update, { new: true, runValidators: true })
        .populate('userId', 'name email')
        .populate('instrumentId');
    }
    const index = memoryBookings.findIndex((item) => String(item._id) === String(id));
    if (index === -1) return null;
    memoryBookings[index] = {
      ...memoryBookings[index],
      status: 'Cancelled',
      updatedAt: new Date().toISOString(),
    };
    const b = memoryBookings[index];
    const user = memoryUsers.find((u) => String(u._id) === String(b.userId));
    const inst = memoryInstruments.find((i) => String(i._id) === String(b.instrumentId));
    return {
      ...b,
      userId: user ? { _id: user._id, name: user.name, email: user.email } : null,
      instrumentId: inst || { _id: b.instrumentId, name: 'Unknown Instrument' },
    };
  },

  async resetSeedData() {
    memoryUsers = JSON.parse(JSON.stringify(initialUsers));
    memoryInstruments = JSON.parse(JSON.stringify(initialInstruments));
    memoryBookings = JSON.parse(JSON.stringify(initialBookings));
    if (isMongoConnected) {
      await User.deleteMany({});
      await Instrument.deleteMany({});
      await Booking.deleteMany({});
      await User.insertMany(initialUsers);
      await Instrument.insertMany(initialInstruments);
      await Booking.insertMany(initialBookings);
    }
    return { message: 'Database reset to sample state successfully.' };
  },
};
