import jwt from 'jsonwebtoken'
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret'

export const signToken = (user) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' })

export const verifyToken = (token) => jwt.verify(token, JWT_SECRET)
