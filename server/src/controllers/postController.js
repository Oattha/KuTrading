import prisma from "../config/prisma.js"
import { v2 as cloudinary } from "cloudinary"
import fs from "fs/promises"
// ---------------- GET POSTS ----------------
export const getPosts = async (_req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, ratingAverage: true, ratingCount: true } },
        images: { orderBy: { position: "asc" } },
        comments: { include: { author: true } },
        likes: true,
      },
      orderBy: { createdAt: "desc" },
    })
    return res.json(posts)
  } catch {
    return res.status(500).json({ message: "Error getting posts" })
  }
}

// ---------------- COMMENT ----------------
export const addComment = async (req, res) => {
  try {
    const { postId, content } = req.body
    if (!postId || !content) return res.status(400).json({ message: "postId & content required" })
    const c = await prisma.comment.create({
      data: { postId: Number(postId), content, authorId: req.user.id },
      include: { author: true },
    })
    return res.json(c)
  } catch {
    return res.status(500).json({ message: "Error adding comment" })
  }
}

// ---------------- LIKE ----------------
export const likePost = async (req, res) => {
  try {
    const { postId } = req.body
    if (!postId) return res.status(400).json({ message: "postId required" })

    const like = await prisma.like.create({
      data: { postId: Number(postId), userId: req.user.id },
    })

    return res.json(like)
  } catch (e) {
    return res.status(400).json({ message: "Already liked or error", error: e.message })
  }
}

// ---------------- CREATE POST ----------------
export const createPost = async (req, res) => {
  try {
    const { content, visibility } = req.body

    if (!content || content.trim() === "") {
      return res.status(400).json({ ok: false, message: "content is required" })
    }

    const post = await prisma.post.create({
      data: {
        authorId: req.user.id,
        content,
        visibility: visibility === "friendsOnly" ? "friendsOnly" : "public",
      },
    })

    // ✅ อัปโหลดไฟล์แนบไป Cloudinary
    if (req.files && req.files.length > 0) {
      const imagesData = []
      for (let i = 0; i < req.files.length; i++) {
        const f = req.files[i]
        try {
          const result = await cloudinary.uploader.upload(f.path, {
            folder: "marketplace/posts",
          })
          imagesData.push({
            postId: post.id,
            url: result.secure_url,
            position: i,
          })
          await fs.unlink(f.path).catch(() => {})
        } catch (err) {
          console.error("Cloudinary upload error:", err)
        }
      }
      if (imagesData.length > 0) {
        await prisma.postImage.createMany({ data: imagesData })
      }
    }

    const full = await prisma.post.findUnique({
      where: { id: post.id },
      include: {
        images: true,
        author: { select: { id: true, name: true, avatarUrl: true } },
        comments: true,
        likes: true,
      },
    })

    return res.status(201).json({ ok: true, post: full })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ ok: false, message: "Error creating post" })
  }
}

// ---------------- ADD IMAGES ----------------
export const addPostImages = async (req, res) => {
  try {
    const postId = Number(req.params.postId)
    if (!postId) return res.status(400).json({ ok: false, message: "Invalid post id" })

    const post = await prisma.post.findUnique({ where: { id: postId } })
    if (!post) return res.status(404).json({ ok: false, message: "Post not found" })
    if (post.authorId !== req.user.id) return res.status(403).json({ ok: false, message: "Forbidden" })

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ ok: false, message: "No files uploaded" })
    }

    const currentCount = await prisma.postImage.count({ where: { postId } })
    const imagesData = []

    for (let i = 0; i < req.files.length; i++) {
      const f = req.files[i]
      try {
        const result = await cloudinary.uploader.upload(f.path, {
          folder: "marketplace/posts",
        })
        imagesData.push({
          postId,
          url: result.secure_url,
          position: currentCount + i,
        })
        await fs.unlink(f.path).catch(() => {})
      } catch (err) {
        console.error("Cloudinary upload error:", err)
      }
    }

    if (imagesData.length > 0) {
      await prisma.postImage.createMany({ data: imagesData })
    }

    const full = await prisma.post.findUnique({
      where: { id: postId },
      include: { images: true },
    })

    return res.json({ ok: true, images: full.images })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ ok: false, message: "Error adding images" })
  }
}

// ---------------- PAGINATION ----------------
export const listPosts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page ?? "1", 10), 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize ?? "10", 10), 1), 50);

    const [total, items] = await Promise.all([
      prisma.post.count(),
      prisma.post.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          images: { orderBy: { position: "asc" } },
          author: { select: { id: true, name: true, avatarUrl: true, ratingAverage: true, ratingCount: true } },
          comments: true,
          likes: true,
        },
      }),
    ]);

    return res.json({ ok: true, total, page, pageSize, items });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Error listing posts" });
  }
};

// ---------------- DELETE IMAGE ----------------
export const deletePostImage = async (req, res) => {
  try {
    const imageId = Number(req.params.imageId);
    const image = await prisma.postImage.findUnique({ where: { id: imageId }, include: { post: true } });
    if (!image) return res.status(404).json({ ok: false, message: "Image not found" });
    if (image.post.authorId !== req.user.id) return res.status(403).json({ ok: false, message: "Forbidden" });

    await prisma.postImage.delete({ where: { id: imageId } });
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Error deleting image" });
  }
};

// ---------------- UPDATE POST ----------------
export const updatePost = async (req, res) => {
  try {
    const postId = Number(req.params.postId);
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return res.status(404).json({ ok: false, message: "Post not found" });
    if (post.authorId !== req.user.id) return res.status(403).json({ ok: false, message: "Forbidden" });

    const { content, visibility } = req.body;
    const updated = await prisma.post.update({
      where: { id: postId },
      data: {
        ...(content != null ? { content } : {}),
        ...(visibility ? { visibility: visibility === "friendsOnly" ? "friendsOnly" : "public" } : {}),
      },
      include: { images: true },
    });

    return res.json({ ok: true, post: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Error updating post" });
  }
};

// ---------------- DELETE POST ----------------
export const deletePost = async (req, res) => {
  try {
    const postId = Number(req.params.postId);
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return res.status(404).json({ ok: false, message: "Post not found" });
    if (post.authorId !== req.user.id) return res.status(403).json({ ok: false, message: "Forbidden" });

    await prisma.post.delete({ where: { id: postId } });
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Error deleting post" });
  }
};


// ดึงโพสต์เดียว พร้อมคอมเมนต์และรูปภาพ
export const getPostById = async (req, res) => {
  try {
    const { id } = req.params

    const post = await prisma.post.findUnique({
      where: { id: Number(id) },
      include: {
        images: true, // ดึงรูปทั้งหมดที่แนบกับโพสต์
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true
              }
            }
          },
          orderBy: { createdAt: "asc" } // เรียงคอมเมนต์ตามเวลา
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        }
      }
    })

    if (!post) {
      return res.status(404).json({ message: "Post not found" })
    }

    res.json(post)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error fetching post" })
  }
}

// ✅ Toggle Like
export const toggleLike = async (req, res) => {
  try {
    const { postId } = req.body
    const userId = req.user.id

    // ตรวจว่ามี Like อยู่แล้วไหม
    const existing = await prisma.like.findUnique({
      where: {
        userId_postId: { userId, postId },
      },
    })

    if (existing) {
      // 👉 ถ้ามีแล้ว = ยกเลิกถูกใจ
      await prisma.like.delete({
        where: {
          userId_postId: { userId, postId },
        },
      })
      return res.json({ liked: false })
    } else {
      // 👉 ถ้ายังไม่มี = กดถูกใจ
      await prisma.like.create({
        data: {
          userId,
          postId,
        },
      })
      return res.json({ liked: true })
    }
  } catch (err) {
    console.error("Error toggling like:", err)
    return res.status(500).json({ message: "Error toggling like" })
  }
}