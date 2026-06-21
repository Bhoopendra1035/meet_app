const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const http = require('http');
const cors = require('cors');
const { AccessToken } = require('livekit-server-sdk');

const app = express();
app.use(cors());

app.use(express.json());

// Serve static frontend client build files
app.use(express.static(path.join(__dirname, '../client/dist')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.send('Signaling server is running.');
});

// In-memory queue for the Waiting Room feature
// activeRooms[roomId] = { hostName: string, waiting: { reqId: { username, status, token } } }
const activeRooms = {};

const generateLiveKitToken = async (room, username) => {
  const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
  const apiSecret = process.env.LIVEKIT_API_SECRET || 'secret';
  const serverUrl = process.env.LIVEKIT_URL || 'ws://localhost:7800';

  const safeUsername = username.replace(/[^a-zA-Z0-9_-]/g, '');
  const uniqueIdentity = `${safeUsername}-${Math.random().toString(36).substring(2, 8)}`;
  
  const at = new AccessToken(apiKey, apiSecret, {
    identity: uniqueIdentity,
    name: username,
  });
  
  at.addGrant({
    roomJoin: true,
    room: room,
    canPublish: true,
    canSubscribe: true,
  });

  const token = await at.toJwt();
  return { token, serverUrl };
};

// 1. Host requests token instantly
app.get('/api/token', async (req, res) => {
  try {
    const { room, username, isHost } = req.query;
    if (!room || !username) {
      return res.status(400).json({ error: 'room and username are required' });
    }

    // Register room and host if isHost is true
    if (isHost === 'true') {
      if (!activeRooms[room]) {
        activeRooms[room] = { hostName: username, waiting: {} };
      } else {
        activeRooms[room].hostName = username;
      }
    }

    const credentials = await generateLiveKitToken(room, username);
    res.json(credentials);
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Guest requests to join the waiting room
app.post('/api/request-join', (req, res) => {
  const { room, username } = req.body;
  if (!room || !username) return res.status(400).json({ error: 'Missing params' });

  // Initialize room if it doesn't exist
  if (!activeRooms[room]) {
    activeRooms[room] = { hostName: null, waiting: {} };
  }

  const reqId = `req_${Math.random().toString(36).substring(2, 9)}`;
  activeRooms[room].waiting[reqId] = {
    username,
    status: 'pending',
    token: null,
    serverUrl: null
  };

  res.json({ reqId });
});

// 3. Guest polls their admission status
app.get('/api/join-status', (req, res) => {
  const { room, reqId } = req.query;
  const roomData = activeRooms[room];
  
  if (!roomData || !roomData.waiting[reqId]) {
    return res.status(404).json({ error: 'Request not found' });
  }

  const reqData = roomData.waiting[reqId];
  res.json({
    status: reqData.status,
    token: reqData.token,
    serverUrl: reqData.serverUrl
  });
});

// 4. Host polls the waiting list for their room
app.get('/api/waiting-list', (req, res) => {
  const { room } = req.query;
  const roomData = activeRooms[room];

  if (!roomData) return res.json({ waiting: [] });

  // Return only pending requests
  const pendingRequests = Object.entries(roomData.waiting)
    .filter(([_, data]) => data.status === 'pending')
    .map(([id, data]) => ({ reqId: id, username: data.username }));

  res.json({ waiting: pendingRequests });
});

// 5. Host admits or denies a request
app.post('/api/handle-request', async (req, res) => {
  try {
    const { room, reqId, action } = req.body; // action = 'admit' | 'deny'
    const roomData = activeRooms[room];

    if (!roomData || !roomData.waiting[reqId]) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (action === 'admit') {
      const username = roomData.waiting[reqId].username;
      const credentials = await generateLiveKitToken(room, username);
      
      roomData.waiting[reqId].status = 'admitted';
      roomData.waiting[reqId].token = credentials.token;
      roomData.waiting[reqId].serverUrl = credentials.serverUrl;
    } else if (action === 'deny') {
      roomData.waiting[reqId].status = 'denied';
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Single port fallback wildcard router
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path === '/health') {
    return next();
  }
  res.sendFile(path.join(__dirname, '../client/dist/index.html'), (err) => {
    if (err) {
      res.status(404).send('Frontend client build is not found.');
    }
  });
});

const server = http.createServer(app);

const PORT = process.env.PORT || 5052;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server listening on port ${PORT}`);
});
