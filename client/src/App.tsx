import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import ProtectedRoute from "@/components/ProtectedRoute"

// ===== Admin Pages =====
import AdminLogin from "@/pages/admin/AdminLogin"
import Dashboard from "@/pages/admin/Dashboard"
import Users from "@/pages/admin/Users"
import Kyc from "@/pages/admin/Kyc"
import Reports from "@/pages/admin/Reports"
import Reviews from "@/pages/admin/Reviews"
import Logs from "@/pages/admin/Logs"
import AdminLayout from "@/pages/admin/AdminLayout"

// ===== User Pages =====
import Login from "@/pages/Login"
import Register from "@/pages/Register"
import UserLayout from "@/layouts/UserLayout"

import Home from "@/pages/user/Home"
import Profile from "@/pages/user/Profile"
import EditProfile from "@/pages/user/EditProfile"
import KycUpload from "@/pages/user/KycUpload"

// Posts
import MyPosts from "@/pages/user/posts/MyPosts"
import CreatePost from "@/pages/user/posts/CreatePost"
import PostDetail from "@/pages/user/posts/PostDetail"

// Trades
import MyTrades from "@/pages/user/trades/MyTrades"
import TradeDetail from "@/pages/user/trades/TradeDetail"
import TradeCreate from "@/pages/user/trades/TradeCreate"
import TradeReview from "@/pages/user/trades/TradeReview"

// Reviews
import UserReviews from "@/pages/user/Reviews"

// Chat
import ChatList from "@/pages/user/chats/ChatList"
import ChatRoom from "@/pages/user/chats/ChatRoom"
import TradeChatRoom from "@/pages/user/chats/TradeChatRoom"
import TradeChatList from "@/pages/user/chats/TradeChatList"

// Notifications
import Notifications from "@/pages/user/Notifications"

// Settings
import Settings from "@/pages/user/Settings"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ===== User Auth ===== */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ===== Protected User Pages (ใช้ UserLayout ครอบ) ===== */}
        <Route
          path="/"
          element={
            <ProtectedRoute role="user">
              <UserLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Home />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:id" element={<Profile />} />
          <Route path="profile/edit" element={<EditProfile />} />
          <Route path="kyc-upload" element={<KycUpload />} />
          <Route path="posts" element={<MyPosts />} />
          <Route path="posts/create" element={<CreatePost />} />
          <Route path="posts/:id" element={<PostDetail />} />
          <Route path="trades" element={<MyTrades />} />
          <Route path="trades/:id" element={<TradeDetail />} />
          <Route path="reviews" element={<UserReviews />} />

{/* ✅ Chat routes */}
<Route path="chats" element={<ChatList />} />
<Route path="chats/trades" element={<TradeChatList />} /> {/* ต้องมาก่อน chats/:id */}
<Route path="chats/:id" element={<ChatRoom />} />

<Route path="notifications" element={<Notifications />} />
<Route path="settings" element={<Settings />} />
<Route path="trades/create" element={<TradeCreate />} />

{/* ✅ Trade Chat ใช้ tradeId + conversationId */}
<Route path="trades/:tradeId/chat/:conversationId" element={<TradeChatRoom />} />
<Route path="trades/:tradeId/review" element={<TradeReview />} />

        </Route>

        {/* ===== Admin Routes ===== */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="kyc" element={<Kyc />} />
          <Route path="reports" element={<Reports />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="logs" element={<Logs />} />
        </Route>

        {/* 404 redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
