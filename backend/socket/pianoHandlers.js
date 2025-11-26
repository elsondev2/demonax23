import PianoStream from '../models/pianoStream.model.js';

export const setupPianoHandlers = (io, socket) => {
  // Start streaming
  socket.on('piano:startStream', async ({ instrument, streamId }) => {
    try {
      socket.pianoStreamId = streamId;
      socket.join(`piano-stream-${streamId}`);

      console.log(`🎹 User ${socket.userId} started piano stream ${streamId}`);

      // Broadcast to all users that a new stream started
      io.emit('piano:streamStarted', {
        streamId,
        streamerId: socket.userId,
        instrument,
      });
    } catch (error) {
      console.error('Error starting piano stream:', error);
    }
  });

  // End streaming
  socket.on('piano:endStream', async ({ streamId }) => {
    try {
      socket.leave(`piano-stream-${streamId}`);
      socket.pianoStreamId = null;

      console.log(`🎹 User ${socket.userId} ended piano stream ${streamId}`);

      // Broadcast to all listeners
      io.to(`piano-stream-${streamId}`).emit('piano:streamEnded', { streamId });
    } catch (error) {
      console.error('Error ending piano stream:', error);
    }
  });

  // Join stream as listener
  socket.on('piano:joinStream', async ({ streamId }) => {
    try {
      socket.join(`piano-stream-${streamId}`);
      socket.listeningToStream = streamId;

      // Add listener to stream
      const stream = await PianoStream.findById(streamId);
      if (stream && !stream.listeners.includes(socket.userId)) {
        stream.listeners.push(socket.userId);
        stream.totalListeners = Math.max(stream.totalListeners, stream.listeners.length);
        await stream.save();
      }

      // Get current listener count
      const room = io.sockets.adapter.rooms.get(`piano-stream-${streamId}`);
      const listenerCount = room ? room.size : 0;

      // Notify streamer and all listeners
      io.to(`piano-stream-${streamId}`).emit('piano:listenerCount', {
        streamId,
        count: listenerCount,
      });

      console.log(`🎹 User ${socket.userId} joined piano stream ${streamId} (${listenerCount} listeners)`);
    } catch (error) {
      console.error('Error joining piano stream:', error);
    }
  });

  // Leave stream
  socket.on('piano:leaveStream', async ({ streamId }) => {
    try {
      socket.leave(`piano-stream-${streamId}`);
      socket.listeningToStream = null;

      // Remove listener from stream
      const stream = await PianoStream.findById(streamId);
      if (stream) {
        stream.listeners = stream.listeners.filter((id) => id.toString() !== socket.userId);
        await stream.save();
      }

      // Get current listener count
      const room = io.sockets.adapter.rooms.get(`piano-stream-${streamId}`);
      const listenerCount = room ? room.size : 0;

      // Notify streamer and remaining listeners
      io.to(`piano-stream-${streamId}`).emit('piano:listenerCount', {
        streamId,
        count: listenerCount,
      });

      console.log(`🎹 User ${socket.userId} left piano stream ${streamId} (${listenerCount} listeners)`);
    } catch (error) {
      console.error('Error leaving piano stream:', error);
    }
  });

  // MIDI Events - Note On
  socket.on('piano:noteOn', ({ streamId, note, velocity, timestamp }) => {
    if (socket.pianoStreamId === streamId) {
      // Broadcast to all listeners
      socket.to(`piano-stream-${streamId}`).emit('piano:noteOn', {
        note,
        velocity,
        timestamp,
      });
    }
  });

  // MIDI Events - Note Off
  socket.on('piano:noteOff', ({ streamId, note, timestamp }) => {
    if (socket.pianoStreamId === streamId) {
      // Broadcast to all listeners
      socket.to(`piano-stream-${streamId}`).emit('piano:noteOff', {
        note,
        timestamp,
      });
    }
  });

  // MIDI Events - Sustain
  socket.on('piano:sustain', ({ streamId, value, timestamp }) => {
    if (socket.pianoStreamId === streamId) {
      // Broadcast to all listeners
      socket.to(`piano-stream-${streamId}`).emit('piano:sustain', {
        value,
        timestamp,
      });
    }
  });

  // Instrument Change
  socket.on('piano:instrumentChange', ({ streamId, instrument }) => {
    if (socket.pianoStreamId === streamId) {
      // Broadcast to all listeners
      socket.to(`piano-stream-${streamId}`).emit('piano:instrumentChange', {
        instrument,
      });
    }
  });

  // Emoji Reaction
  socket.on('piano:reaction', async ({ streamId, emoji }) => {
    try {
      // Broadcast to all in stream (including streamer)
      io.to(`piano-stream-${streamId}`).emit('piano:reaction', {
        emoji,
        userId: socket.userId,
        username: socket.username,
      });

      console.log(`🎹 ${socket.username} sent ${emoji} to stream ${streamId}`);
    } catch (error) {
      console.error('Error sending piano reaction:', error);
    }
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    try {
      // If user was streaming, end the stream
      if (socket.pianoStreamId) {
        const stream = await PianoStream.findById(socket.pianoStreamId);
        if (stream) {
          stream.isLive = false;
          stream.endedAt = new Date();
          await stream.save();

          io.to(`piano-stream-${socket.pianoStreamId}`).emit('piano:streamEnded', {
            streamId: socket.pianoStreamId,
          });
        }
      }

      // If user was listening, remove from stream
      if (socket.listeningToStream) {
        const stream = await PianoStream.findById(socket.listeningToStream);
        if (stream) {
          stream.listeners = stream.listeners.filter((id) => id.toString() !== socket.userId);
          await stream.save();

          const room = io.sockets.adapter.rooms.get(`piano-stream-${socket.listeningToStream}`);
          const listenerCount = room ? room.size : 0;

          io.to(`piano-stream-${socket.listeningToStream}`).emit('piano:listenerCount', {
            streamId: socket.listeningToStream,
            count: listenerCount,
          });
        }
      }
    } catch (error) {
      console.error('Error handling piano disconnect:', error);
    }
  });
};
