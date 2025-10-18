import passport from "passport"
import { Strategy as GoogleStrategy } from "passport-google-oauth20"
import prisma from "../config/prisma.js"
import { signToken } from "../utils/jwt.js"
import jwt from "jsonwebtoken"

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL, // เช่น http://localhost:5001/auth/google/callback
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value
        console.log("✅ Google Profile:", JSON.stringify(profile, null, 2))
        // หาผู้ใช้ใน DB ตาม email
        let user = await prisma.user.findUnique({ where: { email } })

        if (!user) {
          // ถ้าไม่มี → สร้างใหม่ (คุณอาจจะใส่ name, avatarUrl จาก profile)
          user = await prisma.user.create({
            data: {
              email,
              name: profile.displayName,
              avatarUrl: profile.photos?.[0]?.value,
              // คุณอาจจะตั้ง password dummy หรือ null แล้วให้ login แบบ Google เท่านั้น
            },
          })
        }

        // สร้าง token & refreshToken
        const token = signToken(user)
        const refreshTokenJwt = jwt.sign(
          { id: user.id, email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: "7d" }
        )

        return done(null, { user, token, refreshToken: refreshTokenJwt })
      } catch (err) {
        console.error("GoogleStrategy error:", err)
        return done(err, null)
      }
    }
  )
)

// ถ้าใช้ session (ไม่ได้ใช้ JWT) — แต่ถ้าคุณใช้ JWT อาจไม่ต้อง serialize/deserialize
passport.serializeUser((obj, done) => {
  done(null, obj)
})
passport.deserializeUser((obj, done) => {
  done(null, obj)
})

export default passport
