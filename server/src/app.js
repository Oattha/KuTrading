import express from 'express'
import cors from 'cors'
import dotenv from "dotenv"
dotenv.config()
import passport from './utils/passport.js'
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import postRoutes from './routes/postRoutes.js'
import chatRoutes from './routes/chatRoutes.js'
import tradeRoutes from './routes/tradeRoutes.js'
import tradeChatRoutes from './routes/tradeChatRoutes.js' // ✅ trade chat
import reviewRoutes from './routes/reviewRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import adminRoutes from "./routes/adminRoutes.js"

const app = express()
app.use(cors())
app.use(express.json())

app.get('/', (_req, res) => res.send('Marketplace API is running'))

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/trades', tradeRoutes)
app.use('/api/trade-chat', tradeChatRoutes)  
app.use('/api/reviews', reviewRoutes)
app.use('/api/notifications', notificationRoutes)
app.use("/api/admin", adminRoutes)

app.use(passport.initialize())

export default app
