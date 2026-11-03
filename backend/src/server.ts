import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app.js';
import { config } from './config/env.js';
import { initializeSocketGateway } from './socket/gateway.js';

const app = createApp();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH'],
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

initializeSocketGateway(io);

server.listen(config.port, () => {
  console.log(`====================================================`);
  console.log(`🚀 AI Proctor Backend listening on port ${config.port}`);
  console.log(`📡 Socket.IO Gateway active on ws://localhost:${config.port}`);
  console.log(`🤖 Connected to AI Service at ${config.aiServiceUrl}`);
  console.log(`====================================================`);
});

