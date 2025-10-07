import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { checkUserStatus } from "../middlewares/checkUserStatus.js"
import upload from "../middlewares/upload.js";
import {
  getPosts,
  listPosts,
  createPost,
  addPostImages,
  updatePost,
  deletePost,
  deletePostImage,
  addComment,
  likePost,
  getPostById,
  toggleLike 
} from "../controllers/postController.js";

const router = express.Router();

/**
 * ---------------- Public Routes ----------------
 */
// ดึงโพสต์ทั้งหมด (พร้อม author, images, comments, likes)
router.get("/", getPosts);

// ดึงโพสต์แบบมี pagination ?page=1&pageSize=10
router.get("/list/paged", listPosts);

/**
 * ---------------- Protected Routes ----------------
 */
// สร้างโพสต์ใหม่ + แนบรูปหลายไฟล์ (form-data key = "files")
router.post("/", authMiddleware, upload.array("files", 10), createPost);

// เพิ่มรูปเข้าโพสต์ที่มีอยู่แล้ว
router.post("/:postId/images", authMiddleware, upload.array("files", 10), addPostImages);

// อัปเดตโพสต์
router.put("/:postId", authMiddleware, updatePost);

// ลบโพสต์
router.delete("/:postId", authMiddleware, deletePost);

// ลบรูปออกจากโพสต์
router.delete("/images/:imageId", authMiddleware, deletePostImage);

// คอมเมนต์
router.post("/comment", authMiddleware, addComment);

// กดไลก์
router.post("/like", authMiddleware, likePost);

// ดึงโพสต์เดียว
router.get("/:id", authMiddleware, getPostById);

// ✅ Toggle Like
router.post("/:postId/like", authMiddleware, toggleLike)


export default router;
