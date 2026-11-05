import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

const email=process.argv[2];
if(!email){console.log('Usage: npm run make-admin -- user@gmail.com');process.exit(1);}
await mongoose.connect(process.env.MONGODB_URI);
const user=await User.findOneAndUpdate({email:email.toLowerCase()},{role:'admin'},{new:true});
if(!user) console.log('User not found. Sign in with Google once, then run this command.');
else console.log(`${user.email} is now an admin.`);
await mongoose.disconnect();
