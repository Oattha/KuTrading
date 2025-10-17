// src/lib/socket.ts
import { io } from "socket.io-client"

export const socket = io(import.meta.env.VITE_SOCKET_URL, {
  withCredentials: true,
  transports: ["websocket"],   // ✅ บังคับใช้ WebSocket (เร็วสุด)
  autoConnect: true,           // ✅ ให้ connect ทันทีเมื่อโหลดหน้า
  reconnection: true,          // ✅ auto reconnect
})