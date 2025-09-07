const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Check user role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Check if user can access resource
const checkResourceAccess = (resourceType) => {
  return async (req, res, next) => {
    try {
      const userId = req.user._id;
      const resourceId = req.params.id || req.params.userId;

      // Admin can access everything
      if (req.user.role === 'admin') {
        return next();
      }

      // Users can only access their own resources
      if (resourceId && resourceId !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied - you can only access your own resources'
        });
      }

      next();
    } catch (error) {
      console.error('Resource access check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking resource access'
      });
    }
  };
};

// Check membership status
const checkMembership = (req, res, next) => {
  if (!req.user.isMembershipActive) {
    return res.status(403).json({
      success: false,
      message: 'Active membership required',
      code: 'MEMBERSHIP_EXPIRED'
    });
  }
  next();
};

// Check borrowing limits
const checkBorrowingLimits = async (req, res, next) => {
  try {
    const user = req.user;
    const membershipLimits = {
      basic: 3,
      premium: 10,
      student: 5,
      faculty: 8
    };

    const maxBooks = membershipLimits[user.membershipType] || 3;
    const currentBorrowed = user.currentBorrowedBooks.length;

    if (currentBorrowed >= maxBooks) {
      return res.status(400).json({
        success: false,
        message: `Borrowing limit reached. You can borrow up to ${maxBooks} books with ${user.membershipType} membership.`,
        code: 'BORROWING_LIMIT_EXCEEDED'
      });
    }

    next();
  } catch (error) {
    console.error('Borrowing limits check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking borrowing limits'
    });
  }
};

// Rate limiting for sensitive operations
const sensitiveOperationLimit = (req, res, next) => {
  // This would integrate with your rate limiting middleware
  // For now, we'll just pass through
  next();
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
};

module.exports = {
  authenticateToken,
  authorize,
  checkResourceAccess,
  checkMembership,
  checkBorrowingLimits,
  sensitiveOperationLimit,
  optionalAuth
};
