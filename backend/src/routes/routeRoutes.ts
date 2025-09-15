import express from 'express';
import { Request, Response } from 'express';
import User from '../models/User';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Find nearby students with similar routes
router.get('/nearby', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find users within 2km of starting point and destination
    const nearbyUsers = await User.find({
      $and: [
        {
          homeLocation: {
            $near: {
              $geometry: user.homeLocation,
              $maxDistance: 2000 // 2km radius
            }
          }
        },
        {
          destination: {
            $near: {
              $geometry: user.destination,
              $maxDistance: 2000 // 2km radius
            }
          }
        },
        { _id: { $ne: user._id } } // Exclude current user
      ]
    }).select('anonymousUsername homeLocation destination schedule');

    res.json(nearbyUsers);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user route
router.put('/update-route', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { homeLocation, destination, schedule } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      {
        homeLocation: {
          type: 'Point',
          coordinates: homeLocation
        },
        destination: {
          type: 'Point',
          coordinates: destination
        },
        schedule
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;