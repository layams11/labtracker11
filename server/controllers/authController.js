import bcrypt from 'bcryptjs';
import { dbService } from '../data/store.js';

// @desc    Authenticate user & return credentials
// @route   POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const { email, password, expectedRole } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await dbService.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Verify password with bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // If login is targeted for a specific portal (User vs Admin), verify role matches
    if (expectedRole && user.role !== expectedRole) {
      if (expectedRole === 'admin') {
        return res.status(403).json({
          message: 'Access Denied: This account does not have administrator privileges.',
        });
      } else {
        return res.status(403).json({
          message: 'This account is an Administrator. Please use the Admin Login portal.',
        });
      }
    }

    res.status(200).json({
      message: 'Login successful.',
      token: String(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
export const getCurrentUser = async (req, res) => {
  try {
    res.status(200).json({ user: req.user });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving profile', error: error.message });
  }
};
