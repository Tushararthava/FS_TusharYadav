import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { customAlphabet } from 'nanoid';

// Generate anonymous usernames like 'student_123xyz'
const nanoid = customAlphabet('123456789abcdefghijklmnopqrstuvwxyz', 6);

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  anonymousUsername: {
    type: String,
    unique: true,
    default: () => `student_${nanoid()}`
  },
  homeLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  destination: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  schedule: {
    departureTime: String,
    returnTime: String,
    daysOfWeek: [String]
  }
});

// Create indexes for geospatial queries
userSchema.index({ homeLocation: '2dsphere' });
userSchema.index({ destination: '2dsphere' });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);