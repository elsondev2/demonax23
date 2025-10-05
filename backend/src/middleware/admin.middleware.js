export const requireAdmin = (req, res, next) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'admin' || user.isBanned) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  } catch (e) {
    res.status(500).json({ message: 'Internal server error' });
  }
};
