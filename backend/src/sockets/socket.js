import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import Project from '../models/Project.js';

export let io;

export function initSocket(server, clientUrl) {
  io = new Server(server, {
    cors: { origin: clientUrl, methods: ['GET', 'POST'] }
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = payload.userId;
      next();
    } catch {
      next(new Error('Invalid socket session'));
    }
  });

  io.on('connection', socket => {
    socket.join(`user:${socket.userId}`);
    socket.on('project:join', async id => {
      try {
        const project = await Project.findOne({ _id: id, deleted: false, $or: [{ leader: socket.userId }, { members: { $elemMatch: { user: socket.userId, status: 'active' } } }] }).select('_id');
        if (project) socket.join(`project:${id}`);
      } catch { /* Ignore invalid project ids. */ }
    });
    socket.on('project:leave', id => socket.leave(`project:${id}`));
  });

  return io;
}
