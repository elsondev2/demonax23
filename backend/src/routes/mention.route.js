import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import User from '../models/User.js';
import Group from '../models/Group.js';

const router = express.Router();

// Search for users, groups, and communities
router.get('/search', protectRoute, async (req, res) => {
  try {
    const { q, type = 'all' } = req.query;
    const query = q?.trim() || '';

    if (!query) {
      return res.json({ users: [], groups: [], communities: [] });
    }

    const results = {
      users: [],
      groups: [],
      communities: []
    };

    // Search users
    if (type === 'all' || type === 'user') {
      const users = await User.find({
        $or: [
          { fullName: { $regex: query, $options: 'i' } },
          { username: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ],
        _id: { $ne: req.user._id } // Exclude current user
      })
        .select('fullName username email profilePic')
        .limit(20)
        .lean();

      results.users = users.map(user => ({
        ...user,
        id: user._id,
        isOnline: false // TODO: Add online status check
      }));
    }

    // Search groups
    if (type === 'all' || type === 'group') {
      const groups = await Group.find({
        name: { $regex: query, $options: 'i' },
        members: req.user._id, // Only groups user is a member of
        isCommunity: { $ne: true }
      })
        .select('name groupPic members description')
        .limit(20)
        .lean();

      results.groups = groups.map(group => ({
        ...group,
        id: group._id,
        memberCount: group.members?.length || 0
      }));
    }

    // Search community groups
    if (type === 'all' || type === 'community') {
      const communities = await Group.find({
        name: { $regex: query, $options: 'i' },
        isCommunity: true
      })
        .select('name groupPic members description')
        .limit(20)
        .lean();

      results.communities = communities.map(community => ({
        ...community,
        id: community._id,
        memberCount: community.members?.length || 0
      }));
    }

    res.json(results);
  } catch (error) {
    console.error('Error in mention search:', error);
    res.status(500).json({ message: 'Failed to search mentions' });
  }
});

// Get entity details (for popover)
router.get('/details/:type/:id', protectRoute, async (req, res) => {
  try {
    const { type, id } = req.params;

    let entity = null;

    if (type === 'user') {
      entity = await User.findById(id)
        .select('fullName username email profilePic bio')
        .lean();
      
      if (entity) {
        entity.type = 'user';
        entity.isOnline = false; // TODO: Add online status check
        entity.canMessage = true; // TODO: Add permission check
      }
    } else if (type === 'group' || type === 'community') {
      entity = await Group.findById(id)
        .populate('admin', 'fullName profilePic')
        .select('name groupPic description members admin isCommunity')
        .lean();
      
      if (entity) {
        entity.type = entity.isCommunity ? 'community' : 'group';
        entity.memberCount = entity.members?.length || 0;
        entity.isMember = entity.members?.some(m => m.toString() === req.user._id.toString());
        entity.canJoin = !entity.isMember;
      }
    }

    if (!entity) {
      return res.status(404).json({ message: 'Entity not found' });
    }

    res.json(entity);
  } catch (error) {
    console.error('Error fetching entity details:', error);
    res.status(500).json({ message: 'Failed to fetch entity details' });
  }
});

export default router;
