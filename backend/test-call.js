// Quick test script to manually trigger a call event
// Run with: node backend/test-call.js

const io = require('socket.io-client');

// Connect to your backend
const socket = io('http://localhost:3001', {
  transports: ['websocket'],
  auth: {
    // You'll need to add a valid JWT token here
    token: 'YOUR_JWT_TOKEN_HERE'
  }
});

socket.on('connect', () => {
  console.log('✅ Connected to server:', socket.id);
  
  // Emit a test call request
  setTimeout(() => {
    console.log('📞 Sending test call-request...');
    socket.emit('call-request', {
      to: 'TARGET_USER_ID_HERE', // Replace with actual user ID
      callType: 'voice',
      offer: { type: 'offer', sdp: 'test-sdp' },
      callerInfo: {
        _id: 'test-caller-id',
        fullName: 'Test Caller',
        profilePic: null
      }
    });
    console.log('📞 Test call-request sent');
  }, 1000);
});

socket.on('connect_error', (err) => {
  console.error('❌ Connection error:', err.message);
});

socket.on('call-error', (data) => {
  console.error('❌ Call error:', data);
});

// Keep script running
setTimeout(() => {
  console.log('Closing connection...');
  socket.close();
  process.exit(0);
}, 5000);
