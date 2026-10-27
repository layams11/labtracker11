import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './data/store.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import instrumentRoutes from './routes/instrumentRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import utilizationRoutes from './routes/utilizationRoutes.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load server-specific .env first, then fallback to root .env
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect Database
connectDB(process.env.MONGO_URI);

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/instruments', instrumentRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/utilization', utilizationRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    project: 'Centralized Scientific Instrument Booking & Utilization Tracking System (2-Role Auth)',
    timestamp: new Date().toISOString(),
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`Scientific Instrument Booking Backend Running`);
    console.log(`Port: http://localhost:${PORT}`);
    console.log(`API Base: http://localhost:${PORT}/api`);
    console.log(`====================================================`);
  });
}

export default app;
