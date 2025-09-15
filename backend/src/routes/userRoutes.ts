import express from 'express';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const router = express.Router();

// Register user
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, homeLocation, destination, schedule } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({
      email,
      password,
      homeLocation: {
        type: 'Point',
        coordinates: homeLocation
      },
      destination: {
        type: 'Point',
        coordinates: destination
      },
      schedule
    });

    await user.save();
    
    const token = jwt.sign(
      { userId: user._id, anonymousUsername: user.anonymousUsername },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      anonymousUsername: user.anonymousUsername
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login user
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, anonymousUsername: user.anonymousUsername },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      anonymousUsername: user.anonymousUsername
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;