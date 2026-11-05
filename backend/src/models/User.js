import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  googleId: { type: String, unique: true, sparse: true },
  passwordHash: { type: String, default: '' },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  avatar: String,
  githubUsername: { type: String, default: '' },
  githubUrl: { type: String, default: '' },
  linkedinUrl: { type: String, default: '' },
  portfolioUrl: { type: String, default: '' },
  bio: { type: String, default: '' },
  knownSkills: [String],
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  disabled: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
