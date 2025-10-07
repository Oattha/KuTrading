import { useState } from "react"
import axios from "axios"
import { useAuth, User } from "@/store/auth"
import { useNavigate } from "react-router-dom"

interface LoginResponse {
    user: Omit<User, "token">
    token: string
}

export default function AdminLogin() {
    const { setAuth } = useAuth()

    const navigate = useNavigate()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const res = await axios.post<LoginResponse>(
                "http://localhost:5001/api/auth/login",
                { email, password }
            )

            if (res.data.user && res.data.token) {
                // ✅ ใช้ setAuth แทน setUser
                setAuth(res.data.user, res.data.token, "dummy_refresh_token")

                // ตรวจสอบ role
                if (res.data.user.role === "admin") {
                    navigate("/admin/logs")
                } else {
                    setError("Not authorized: You are not an admin")
                }
            }
        } catch {
            setError("Invalid email or password")
        } finally {
            setLoading(false)
        }
    }


    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-500">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-pink-300/20 via-purple-400/10 to-transparent"></div>

            <div className="relative z-10 w-full max-w-md p-8 rounded-2xl shadow-2xl bg-white/20 backdrop-blur-xl border border-white/40 animate-fadeSlideDown">
                <div className="text-center mb-8">
                    <div className="text-5xl mb-3">🔐</div>
                    <h1 className="text-3xl font-extrabold text-white drop-shadow-lg">
                        Admin Panel
                    </h1>
                    <p className="text-white/80 text-sm mt-1">
                        Sign in to manage the marketplace
                    </p>
                </div>

                {error && (
                    <div className="bg-red-500/90 text-white text-sm px-4 py-2 rounded-lg mb-4 text-center shadow-md">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-white/90 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg bg-white/80 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-pink-400 focus:outline-none shadow-inner"
                            placeholder="admin@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-white/90 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg bg-white/80 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-pink-400 focus:outline-none shadow-inner"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white font-semibold shadow-lg hover:opacity-90 transition disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                Logging in...
                            </>
                        ) : (
                            "Login"
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
