import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  technologies: [{ type: String, trim: true }],
  githubRepo: { type: String, default: '' },
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roles: [{ name: { type: String, required: true }, required: { type: Number, min: 1 }, filled: { type: Number, default: 0 } }],
  members: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, roleId: mongoose.Schema.Types.ObjectId, status: { type: String, default: 'active' }, warningCount: { type: Number, default: 0 }, warnings: [{ reason: String, issuedAt: { type: Date, default: Date.now } }] }],
  joinRequests: [{ user: mongoose.Schema.Types.ObjectId, roleId: mongoose.Schema.Types.ObjectId, status: { type: String, default: 'pending' }, createdAt: { type: Date, default: Date.now } }],
  deleted: { type: Boolean, default: false }
}, { timestamps: true });

projectSchema.index({ name: 'text', description: 'text', technologies: 'text' });
export default mongoose.model('Project', projectSchema);
