const jwt = require('jsonwebtoken');

// Middleware function to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract token from Authorization header

  console.log('Received token:', token); // Log the received token

  if (!token) {
    console.log('Token not found in header');
    return res.sendStatus(401); // Unauthorized if token is missing
  }

  const secret = process.env.JWT_SECRET || 'princezel1234567890';

  jwt.verify(token, secret, (err, user) => {
    if (err) {
      console.log('Error verifying token:', err.message);
      return res.sendStatus(403); // Forbidden if token is invalid
    }
    req.user = user;
    console.log('User:', user);
    next(); 
  });
};

module.exports = authenticateToken;
