# Piano Room - Complete Specification

## Overview
Piano Room is a social music app within the main app where users can play virtual piano, stream live performances, watch other pianists, and interact through reactions and follows.

---

## Core Features

### 1. Practice Mode (Play)
- **Virtual Piano**: Full keyboard with mouse/touch support
- **MIDI Support**: Connect external MIDI devices
- **35+ Instruments**: Pianos, Organs, Strings, Brass, Woodwinds, Synths, Guitars, Percussion, Ethnic
- **Sustain Pedal**: Space bar or MIDI sustain pedal
- **Octave Shift**: -2 to +2 octave range
- **Recording**: Record MIDI events locally
- **Go Live**: Toggle to start streaming to Piano Hall
- **Audience View**: See who's listening when live

### 2. Piano Hall (Listen)
- **Live Streams List**: Browse active pianists
- **Join Stream**: Listen to live performances
- **Real-time MIDI**: Hear notes as pianist plays
- **Emoji Reactions**: Send floating animated emojis (🎹 👏 🔥 ❤️ 🎵 ⭐)
- **Follow System**: Follow favorite pianists
- **Listener Count**: See how many people are watching
- **Authentication Required**: Must be logged in to listen

### 3. Profile & Stats
- **My Recordings**: Local and cloud recordings
- **Followers/Following**: Social connections
- **Leaderboard**: Rankings by play time, listeners, followers
- **Statistics**: Total play time, streams, total listeners
- **Cloud Storage**: Premium feature for cloud recordings

---

## Technical Architecture

### Frontend Components

```
piano/
├── PianoRoom.jsx          # Main container with tabs
├── PracticeMode.jsx       # Play interface
├── PianoHall.jsx          # Live streams list
├── PianoStream.jsx        # Individual stream viewer
├── ProfileStats.jsx       # User stats & recordings
├── VirtualPiano.jsx       # Piano keyboard (existing)
├── InstrumentSelector.jsx # Instrument picker (existing)
├── RecordingControls.jsx  # Record/playback (existing)
├── EmojiReaction.jsx      # Floating emoji animations
├── AudienceList.jsx       # Show listeners
└── Leaderboard.jsx        # Rankings
```

### Backend Models

```javascript
// Piano Stream
{
  _id: ObjectId,
  streamerId: ObjectId (ref: User),
  instrument: String,
  isLive: Boolean,
  listeners: [ObjectId],
  startedAt: Date,
  endedAt: Date,
  totalListeners: Number
}

// Piano Recording
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  title: String,
  midiEvents: [{
    type: 'noteOn' | 'noteOff' | 'sustain',
    note: String,
    velocity: Number,
    timestamp: Number
  }],
  duration: Number,
  instrument: String,
  isCloud: Boolean,
  isPremium: Boolean,
  createdAt: Date
}

// Piano Follow
{
  _id: ObjectId,
  followerId: ObjectId (ref: User),
  pianistId: ObjectId (ref: User),
  createdAt: Date
}

// Piano Stats
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  totalPlayTime: Number, // seconds
  totalStreams: Number,
  totalListeners: Number,
  totalRecordings: Number,
  lastPlayedAt: Date
}
```

### Socket Events

```javascript
// Streaming
'piano:startStream' - { instrument, streamerId }
'piano:endStream' - { streamId }
'piano:joinStream' - { streamId, userId }
'piano:leaveStream' - { streamId, userId }
'piano:listenerCount' - { streamId, count }

// MIDI Events (real-time)
'piano:noteOn' - { streamId, note, velocity, timestamp }
'piano:noteOff' - { streamId, note, timestamp }
'piano:sustain' - { streamId, value, timestamp }
'piano:instrumentChange' - { streamId, instrument }

// Reactions
'piano:reaction' - { streamId, emoji, userId, username }

// Notifications
'piano:pianistLive' - { pianistId, pianistName, streamId }
```

### API Routes

```
GET    /api/piano/streams              # Get active streams
GET    /api/piano/streams/:id          # Get stream details
POST   /api/piano/streams/start        # Start streaming
POST   /api/piano/streams/end          # End streaming

GET    /api/piano/recordings           # Get user recordings
GET    /api/piano/recordings/:id       # Get recording
POST   /api/piano/recordings           # Save recording
DELETE /api/piano/recordings/:id       # Delete recording
POST   /api/piano/recordings/:id/cloud # Upload to cloud (Premium)

POST   /api/piano/follow/:pianistId    # Follow pianist
DELETE /api/piano/follow/:pianistId    # Unfollow pianist
GET    /api/piano/followers/:userId    # Get followers
GET    /api/piano/following/:userId    # Get following

GET    /api/piano/stats/:userId        # Get user stats
GET    /api/piano/leaderboard          # Get rankings
```

---

## UI Design (BandLab-Inspired)

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ SIDEBAR (Chat) │           PIANO ROOM                       │
│                │                                            │
│  ResizableSidebar │ ┌────────────────────────────────────┐ │
│  with ChatsView   │ │ TABS: Practice | Piano Hall | Stats│ │
│                   │ ├────────────────────────────────────┤ │
│                   │ │                                    │ │
│                   │ │  [CONTENT BASED ON ACTIVE TAB]     │ │
│                   │ │                                    │ │
│                   │ └────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Practice Mode Layout

```
┌────────────────────────────────────────────────────────────┐
│ Instrument Panel                                           │
│ [< ] Piano > Grand Piano [> ]  | Treble Reverb Pan Volume │
├────────────────────────────────────────────────────────────┤
│ [Sustain] [< Octave 0 >] [🔴 Go Live] [👥 Audience: 0]    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│                    PIANO KEYBOARD                          │
│  ┌─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┐              │
│  │ │█│ │█│ │ │█│ │█│ │█│ │ │█│ │█│ │ │█│ │              │
│  │ └┬┘ └┬┘ │ └┬┘ └┬┘ └┬┘ │ └┬┘ └┬┘ │ └┬┘ │              │
│  │  │   │  │  │   │   │  │  │   │  │  │   │              │
│  └──┴───┴──┴──┴───┴───┴──┴──┴───┴──┴──┴───┴──┘              │
│   C3      C4       C5       C6                             │
├────────────────────────────────────────────────────────────┤
│ 🔊── | 00:00 | ⏮ ◀ ▶ ⏭ ⏺ | 120bpm | 4/4                  │
└────────────────────────────────────────────────────────────┘
```

### Piano Hall Layout

```
┌────────────────────────────────────────────────────────────┐
│ Live Now (12 pianists streaming)                           │
├────────────────────────────────────────────────────────────┤
│ ┌──────────────────┐ ┌──────────────────┐                 │
│ │ 👤 John Doe      │ │ 👤 Jane Smith    │                 │
│ │ 🎹 Grand Piano   │ │ 🎹 Rhodes        │                 │
│ │ 👥 45 listening  │ │ 👥 23 listening  │                 │
│ │ [Join Stream]    │ │ [Join Stream]    │                 │
│ └──────────────────┘ └──────────────────┘                 │
│                                                            │
│ ┌──────────────────┐ ┌──────────────────┐                 │
│ │ 👤 Mike Johnson  │ │ 👤 Sarah Lee     │                 │
│ │ 🎹 Strings       │ │ 🎹 Synth Lead    │                 │
│ │ 👥 12 listening  │ │ 👥 8 listening   │                 │
│ │ [Join Stream]    │ │ [Join Stream]    │                 │
│ └──────────────────┘ └──────────────────┘                 │
└────────────────────────────────────────────────────────────┘
```

### Stream Viewer Layout

```
┌────────────────────────────────────────────────────────────┐
│ ← Back to Hall | 👤 John Doe | 🎹 Grand Piano | 👥 45     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│                    PIANO KEYBOARD                          │
│  (Shows notes as pianist plays - visual feedback)         │
│                                                            │
│                         🎵                                 │
│                    ❤️        👏                            │
│               🔥                    ⭐                      │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ Reactions: 🎹 👏 🔥 ❤️ 🎵 ⭐                                │
│ [Follow John] [Share]                                      │
└────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Core UI Redesign (2h) ✅ COMPLETE
- [x] Redesign PianoRoom with tabs (Practice, Piano Hall, Stats)
- [x] BandLab-style layout with proper spacing
- [x] Instrument panel with knobs
- [x] Responsive mobile design

### Phase 2: Streaming System (4h) ✅ COMPLETE
**Backend:**
- [x] Create PianoStream model
- [x] Socket events for streaming
- [x] API routes for streams

**Frontend:**
- [x] Go Live button (functional)
- [x] Stream state management
- [x] MIDI event broadcasting
- [x] Audience count display

### Phase 3: Piano Hall (3h) ✅ COMPLETE
- [x] Live streams list
- [x] Join/leave stream functionality
- [x] Real-time MIDI playback
- [x] Stream viewer component
- [x] Listener count display

### Phase 4: Reactions & Social (2h) ✅ COMPLETE
- [x] Floating emoji animations
- [x] Follow/unfollow system (using existing follow API)
- [x] Follow button in streams

### Phase 5: Recordings (2h) ✅ COMPLETE
- [x] Local recording (localStorage)
- [x] Playback system
- [x] Recording list UI
- [x] Download recordings as JSON
- [ ] Cloud upload (Premium) - Future enhancement

### Phase 6: Stats & Leaderboard (1h) ✅ COMPLETE
- [x] Track statistics (play time, streams, listeners)
- [x] Leaderboard component with rankings
- [x] Profile stats page with tabs
- [x] Leaderboard API endpoint

**Total: ~14 hours**

---

## Feature Details

### Emoji Reactions
- **Emojis**: 🎹 👏 🔥 ❤️ 🎵 ⭐
- **Animation**: Float upward from bottom, fade out
- **Duration**: 3 seconds
- **Position**: Random X position
- **Broadcast**: Real-time to all listeners

### Follow System
- Follow/unfollow pianists
- See followers/following count
- Get notified when followed pianist goes live
- Follow button in stream viewer

### Leaderboard Criteria
1. **Total Listeners** (primary)
2. **Total Play Time** (secondary)
3. **Total Streams** (tertiary)
4. **Followers** (quaternary)

### Premium Features
- **Cloud Recordings**: Upload recordings to cloud storage
- **Unlimited Storage**: No limit on cloud recordings
- **Download Recordings**: Download as MIDI files

### Stream Limits
- **Unlimited Listeners**: No cap per stream
- **Concurrent Streams**: 1 per user
- **Stream Duration**: No limit

---

## Questions & Decisions

### 1. Premium System
**Q**: Do you have an existing premium/subscription system?
**A**: [Pending]
**Decision**: If yes, integrate. If no, create basic premium flag on User model.

### 2. Notifications
**Q**: Use existing notification system?
**A**: [Pending]
**Decision**: Reuse existing notification infrastructure.

### 3. User Auth
**Q**: Is auth already enforced app-wide?
**A**: [Pending]
**Decision**: Add auth check on Piano Hall routes.

### 4. Stream Limit
**Q**: Any server concerns with unlimited listeners?
**A**: [Pending]
**Decision**: Monitor and add soft cap if needed (e.g., 1000 listeners).

### 5. Emoji Set
**Q**: Which emojis for reactions?
**A**: 🎹 👏 🔥 ❤️ 🎵 ⭐
**Decision**: Start with these 6, can expand later.

### 6. Leaderboard Criteria
**Q**: Rank by what metric?
**A**: Total listeners (primary), play time (secondary)
**Decision**: Weighted score: (listeners * 10) + (playTime / 60) + (streams * 5) + followers

---

## Success Metrics

- **Engagement**: Average stream duration
- **Social**: Follow rate, reaction rate
- **Retention**: Daily active pianists
- **Premium**: Cloud recording conversion rate

---

## Future Enhancements

- **Duets**: Two pianists play together
- **Challenges**: Daily/weekly piano challenges
- **Sheet Music**: Display sheet music while playing
- **Tutorials**: Learn piano with guided lessons
- **Competitions**: Ranked competitions with prizes
- **Monetization**: Tips/donations to pianists
- **Recording Sharing**: Share recordings on social media
- **Collaboration**: Record with multiple instruments

---

## Technical Notes

### MIDI Streaming
- Use WebSocket for low latency
- Buffer events to handle network jitter
- Compress MIDI data for bandwidth efficiency

### Recording Storage
- **Local**: IndexedDB (unlimited, free)
- **Cloud**: MongoDB GridFS or S3 (Premium)
- **Format**: JSON array of MIDI events

### Performance
- Limit emoji animations to 20 concurrent
- Throttle MIDI events to 60fps
- Use Web Workers for MIDI processing

### Security
- Validate MIDI events server-side
- Rate limit reactions (1 per second)
- Prevent spam streams

---

## Next Steps

1. Create MD spec ✅
2. Implement Phase 1: Core UI Redesign ✅
3. Implement Phase 2: Streaming System ✅
4. Implement Phase 3: Piano Hall ✅
5. Implement Phase 4: Reactions & Social ✅
6. Implement Phase 5: Recordings ✅
7. Implement Phase 6: Stats & Leaderboard ✅
8. Test and deploy

---

**Status**: ✅ IMPLEMENTATION COMPLETE
**Completed**: All 6 phases implemented
**Remaining**: Cloud recordings (Premium feature - future enhancement)
