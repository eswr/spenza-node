const jwt = require('jsonwebtoken');
const boom = require('@hapi/boom');
require('dotenv').config();

const authenticate = (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return next(boom.unauthorized('Access denied. No token provided.'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, iat, exp }
    next();
  } catch (err) {
    next(boom.unauthorized('Invalid token.'));
  }
};

module.exports = authenticate;
