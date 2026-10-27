import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, dbService } from './server/data/store.js';
import authRoutes from './server/routes/authRoutes.js';
import userRoutes from './server/routes/userRoutes.js';
import adminRoutes from './server/routes/adminRoutes.js';
import instrumentRoutes from './server/routes/instrumentRoutes.js';
import bookingRoutes from './server/routes/bookingRoutes.js';
import dashboardRoutes from './server/routes/dashboardRoutes.js';
import utilizationRoutes from './server/routes/utilizationRoutes.js';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(cors());
  app.use(express.json());

  // Initialize DB connection
  await connectDB(process.env.MONGO_URI);

  // Mount API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/instruments', instrumentRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/utilization', utilizationRoutes);

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'online',
      project: 'Centralized Scientific Instrument Booking & Utilization Tracking System (2-Role Auth)',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/database', async (req, res) => {
    try {
      const isConnected = dbService.getIsConnected();
      const users = await dbService.getAllUsers();
      const instruments = await dbService.getAllInstruments();
      const bookings = await dbService.getAllBookings();
      res.json({
        status: 'online',
        databaseEngine: isConnected ? 'MongoDB (Local / Atlas)' : 'Resilient Mongoose In-Memory Datastore',
        databaseName: 'scientific_instrument_booking',
        isConnected,
        stats: {
          usersCount: users.length,
          instrumentsCount: instruments.length,
          bookingsCount: bookings.length,
        },
        collections: {
          users,
          instruments,
          bookings,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Mount Vite development server
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n==================================================================`);
    console.log(`🔬 Centralized Scientific Instrument Booking & Utilization System`);
    console.log(`==================================================================`);
    console.log(`  ➜  Frontend App:  http://localhost:${PORT}/`);
    console.log(`  ➜  API Health:    http://localhost:${PORT}/api/health`);
    console.log(`  ➜  DB Explorer:   http://localhost:${PORT}/api/database`);
    console.log(`==================================================================\n`);
  });
}

startServer();
