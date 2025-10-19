import User from '../models/User.js';
import Group from '../models/Group.js';

export const searchMentions = async (req, res) => {
  try {
    const { q, type = 'all' } = req.query;
    const currentUserId = req.user._id;

    const result = {
      users: [],
      groups: [],
      communities: []
    };

    // Search users
    if (type === 'user' || type === 'all') {
      const users = await User.find({
        _id: { $ne: currentUserId },
        $or: [
          { fullName: { $regex: q, $options: 'i' } },
          { username: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } }
        ]
      })
        .select('fullName username email profilePic')
        .limit(20)
        .lean();

      result.users = users.map(user => ({
        ...user,
        id: user._id,
        isOnline: false // Will be updated by frontend with online users
      }));
    }

    // Search groups (user is member of)
    if (type === 'group' || type === 'all') {
      const groups = await Group.find({
        members: currentUserId,
        isCommunity: false,
        name: { $regex: q, $options: 'i' }
      })
        .select('name groupPic members')
        .limit(20)
        .lean();

      result.groups = groups.map(group => ({
        ...group,
        id: group._id,
        memberCount: group.members?.length || 0
      }));
    }

    // Search communities
    if (type === 'community' || type === 'all') {
      const communities = await Group.find({
        isCommunity: true,
        name: { $regex: q, $options: 'i' }
      })
        .select('name groupPic members')
        .limit(20)
        .lean();

      result.communities = communities.map(community => ({
        ...community,
        id: community._id,
        memberCount: community.members?.length || 0
      }));
    }

    res.json(result);
  } catch (error) {
    console.error('Search mentions error:', error);
    res.status(500).json({ error: 'Failed to search mentions' });
  }
};

export const getMentionDetails = async (req, res) => {
  try {
    const { type, id } = req.params;
    const currentUserId = req.user._id;

    if (type === 'user') {
      const user = await User.findById(id)
        .select('fullName username email profilePic bio')
        .lean();

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get mutual friends count (simplified)
      const mutualFriends = 0; // TODO: Implement mutual friends logic

      res.json({
        type: 'user',
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
        bio: user.bio,
        mutualFriends,
        canMessage: true
      });
    } else if (type === 'group' || type === 'community') {
      const group = await Group.findById(id)
        .populate('admin', 'fullName profilePic')
        .select('name groupPic description members isCommunity admin')
        .lean();

      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      const isMember = group.members.some(m => m.toString() === currentUserId.toString());

      res.json({
        type: group.isCommunity ? 'community' : 'group',
        id: group._id,
        name: group.name,
        groupPic: group.groupPic,
        description: group.description,
        memberCount: group.members?.length || 0,
        isMember,
        canJoin: !isMember,
        admin: group.admin ? {
          id: group.admin._id,
          fullName: group.admin.fullName
        } : null
      });
    } else {
      res.status(400).json({ error: 'Invalid type' });
    }
  } catch (error) {
    console.error('Get mention details error:', error);
    res.status(500).json({ error: 'Failed to get mention details' });
  }
};
