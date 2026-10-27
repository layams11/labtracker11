import { dbService } from '../data/store.js';

// Authenticate user middleware
export const requireAuth = async (req, res, next) => {
  try {
    let userId = null;

    // Check Authorization header: "Bearer <userId>"
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      userId = req.headers.authorization.split(' ')[1];
    } else if (req.headers['x-user-id']) {
      userId = req.headers['x-user-id'];
    }

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required. Please log in.' });
    }

    const user = await dbService.getUserById(userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid session or user not found. Please log in again.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Authentication failed', error: error.message });
  }
};

// Require Admin Role middleware
export const requireAdmin = async (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Access forbidden: Administrator privileges required to access this resource.',
    });
  }
  next();
};

// Require Regular User or Admin middleware
export const requireUser = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Please log in to continue.' });
  }
  next();
};
