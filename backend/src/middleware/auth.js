import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    User.findById(decoded.userId)
      .then((user) => {
        if (!user || !user.isActive) {
          return res.status(401).json({ error: 'Invalid or inactive user' });
        }
        req.user = user;
        next();
      })
      .catch(() => res.status(401).json({ error: 'Invalid token' }));
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    const userRole = req.user.role;
    if (roles.includes(userRole)) return next();
    return res.status(403).json({ error: 'Insufficient permissions' });
  };
}
