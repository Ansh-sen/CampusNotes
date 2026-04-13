const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const email = 'user@example.com';
const password = 'password123';
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

console.log('Testing JWT_SECRET:', !!JWT_SECRET);
console.log('Testing JWT_REFRESH_SECRET:', !!JWT_REFRESH_SECRET);

try {
  const user = { id: 'test-id', email: email };
  const accessToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: user.id, email: user.email }, JWT_REFRESH_SECRET, { expiresIn: '30d' });
  console.log('✅ JWT Sign Success!');
} catch (error) {
  console.error('❌ JWT Sign Error:', error.message);
}
