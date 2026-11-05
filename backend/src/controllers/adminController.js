import User from '../models/User.js';
import Project from '../models/Project.js';

export async function listUsers(req,res){res.json(await User.find({disabled:false}).select('-googleId'));}
export async function listProjects(req,res){res.json(await Project.find({deleted:false}).populate('leader','name email'));}
export async function deleteUser(req,res){
  if(String(req.user._id)===req.params.id)return res.status(400).json({message:'You cannot deactivate your own admin account'});
  const user=await User.findByIdAndUpdate(req.params.id,{disabled:true},{new:true});
  if(!user)return res.status(404).json({message:'User not found'});
  res.json({message:'User deactivated'});
}
export async function deleteProject(req,res){
  const project=await Project.findByIdAndUpdate(req.params.id,{deleted:true},{new:true});
  if(!project)return res.status(404).json({message:'Project not found'});
  res.json({message:'Project deleted'});
}
