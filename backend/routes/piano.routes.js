import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import PianoStream from '../models/pianoStream.model.js';
import PianoStats from '../models/pianoStats.model.js';

const router = express.Router();

// Get all active streams
router.get('/streams', protectRoute, async (req, res) => {
  try {
    const streams = await PianoStream.find({ isLive: true })
      .populate('streamerId', 'username profilePic')
      .sort({ startedAt: -1 })
      .lean();

    // Add listener count
    const streamsWithCount = streams.map((stream) => ({
      ...stream,
      listenerCount: stream.listeners.length,
    }));

    res.json(streamsWithCount);
  } catch (error) {
    console.error('Error fetching streams:', error);
    res.status(500).json({ error: 'Failed to fetch streams' });
  }
});

// Get stream details
router.get('/streams/:id', protectRoute, async (req, res) => {
  try {
    const stream = await PianoStream.findById(req.params.id)
      .populate('streamerId', 'username profilePic')
      .populate('listeners', 'username profilePic')
      .lean();

    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    res.json(stream);
  } catch (error) {
    console.error('Error fetching stream:', error);
    res.status(500).json({ error: 'Failed to fetch stream' });
  }
});

// Start streaming
router.post('/streams/start', protectRoute, async (req, res) => {
  try {
    const { instrument } = req.body;

    // Check if user already has an active stream
    const existingStream = await PianoStream.findOne({
      streamerId: req.user._id,
      isLive: true,
    });

    if (existingStream) {
      return res.status(400).json({ error: 'You already have an active stream' });
    }

    // Create new stream
    const stream = await PianoStream.create({
      streamerId: req.user._id,
      instrument: instrument || 'grand-piano',
    });

    // Update stats
    await PianoStats.findOneAndUpdate(
      { userId: req.user._id },
      {
        $inc: { totalStreams: 1 },
        $set: { lastPlayedAt: new Date() },
      },
      { upsert: true }
    );

    const populatedStream = await stream.populate('streamerId', 'username profilePic');

    res.json(populatedStream);
  } catch (error) {
    console.error('Error starting stream:', error);
    res.status(500).json({ error: 'Failed to start stream' });
  }
});

// End streaming
router.post('/streams/end', protectRoute, async (req, res) => {
  try {
    const stream = await PianoStream.findOne({
      streamerId: req.user._id,
      isLive: true,
    });

    if (!stream) {
      return res.status(404).json({ error: 'No active stream found' });
    }

    stream.isLive = false;
    stream.endedAt = new Date();
    await stream.save();

    // Update stats with total listeners
    await PianoStats.findOneAndUpdate(
      { userId: req.user._id },
      { $inc: { totalListeners: stream.totalListeners } },
      { upsert: true }
    );

    res.json({ message: 'Stream ended successfully' });
  } catch (error) {
    console.error('Error ending stream:', error);
    res.status(500).json({ error: 'Failed to end stream' });
  }
});

// Get user stats
router.get('/stats/:userId', protectRoute, async (req, res) => {
  try {
    const stats = await PianoStats.findOne({ userId: req.params.userId }).lean();

    if (!stats) {
      return res.json({
        totalPlayTime: 0,
        totalStreams: 0,
        totalListeners: 0,
        totalRecordings: 0,
      });
    }

    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
