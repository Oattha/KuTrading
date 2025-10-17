// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import ProtectedRoute from "@/components/ProtectedRoute"
import { Toaster } from "react-hot-toast"

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
import PostDetailPage from "@/pages/user/posts/PostDetailPage"
import EditPost from "@/pages/user/posts/EditPost"

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
      {/* ✅ global toast */}
      <Toaster position="top-right" reverseOrder={false} />

      <Routes>
        {/* ===== User Auth ===== */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ===== Protected User Pages ===== */}
        <Route
          path="/"
          element={
            <ProtectedRoute role="user">
              <UserLayout /> {/* ฟัง socket ที่นี่แทน */}
            </ProtectedRoute>
          }
        >
          <Route index element={<Home />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:id" element={<Profile />} />
          <Route path="profile/edit" element={<EditProfile />} />
          <Route path="kyc-upload" element={<KycUpload />} />

          {/* Posts */}
          <Route path="posts" element={<MyPosts />} />
          <Route path="posts/create" element={<CreatePost />} />
          <Route path="posts/:id" element={<PostDetailPage />} />
          <Route path="posts/:id/edit" element={<EditPost />} />

          {/* Trades */}
          <Route path="trades" element={<MyTrades />} />
          <Route path="trades/create" element={<TradeCreate />} />
          <Route path="trades/:id" element={<TradeDetail />} />
          <Route path="trades/:tradeId/review" element={<TradeReview />} />
          <Route path="trades/:tradeId/chat/:conversationId" element={<TradeChatRoom />} />

          {/* Chats */}
          <Route path="chats" element={<ChatList />} />
          <Route path="chats/trades" element={<TradeChatList />} />
          <Route path="chats/:id" element={<ChatRoom />} />

          {/* Notifications / Settings */}
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<Settings />} />
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
