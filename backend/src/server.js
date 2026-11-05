import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { connectDatabase } from './config/database.js';
import { initSocket } from './sockets/socket.js';

const port=process.env.PORT || 5000;
const server=http.createServer(app);

try {
  await connectDatabase();
  initSocket(server,process.env.CLIENT_URL || 'http://localhost:5173');
  server.listen(port,()=>console.log(`CREWLINK API running on port ${port}`));
} catch(error) {
  console.error('Server could not start:',error.message);
  process.exit(1);
}
