import prisma from "../config/prisma.js"

import fs from "fs/promises"
import { getIO } from "../socket.js"
import cloudinary from "../config/cloudinary.js"

// ---------------- GET POSTS ----------------
export const getPosts = async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        author: { 
          select: { id: true, name: true, avatarUrl: true, ratingAverage: true, ratingCount: true } 
        },
        images: { orderBy: { position: "asc" } },
        videos: true,  // ✅ เพิ่มตรงนี้
        comments: { include: { author: true } },
        likes: true,
        trades: {
          orderBy: { updatedAt: "desc" }, // ✅ เอา trade ล่าสุด
          take: 1,                        // ✅ จำกัดให้ดึงมา trade เดียว
          select: { id: true, status: true, buyerId: true, sellerId: true }
        }
      },
      orderBy: { createdAt: "desc" },
    })

    const withStatus = posts.map(p => ({
      ...p,
      tradeStatus: p.trades.length > 0 ? p.trades[0].status : null
    }))

    return res.json(withStatus)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Error getting posts" })
  }
}



// ---------------- COMMENT ----------------
export const addComment = async (req, res) => {
  try {
    const { postId, content } = req.body
    if (!postId || !content) {
      return res.status(400).json({ message: "postId & content required" })
    }

    // สร้าง comment
    const c = await prisma.comment.create({
      data: {
        postId: Number(postId),
        content,
        authorId: req.user.id
      },
      include: { 
        author: true,
        post: { include: { author: true } }   // ✅ ดึงเจ้าของโพสต์ด้วย
      },
    })

    // ✅ ถ้าเม้นท์ไม่ใช่เจ้าของโพสต์เอง → สร้าง notification
    if (c.post.authorId !== req.user.id) {
      const noti = await prisma.notification.create({
        data: {
          userId: c.post.authorId,    // เจ้าของโพสต์
          type: "message",            // หรือ "comment" ถ้า schema มี enum
          title: `${c.author.name || "ผู้ใช้"} แสดงความคิดเห็นบนโพสต์ของคุณ`,
          body: content.slice(0, 50),
          postId: c.postId
        }
      })

      // 🔔 realtime → ส่งไปยังเจ้าของโพสต์
      getIO().to(`user_${c.post.authorId}`).emit("notification:new", noti)
    }

    return res.json(c)
  } catch (e) {
    console.error("Error adding comment:", e)
    return res.status(500).json({ message: "Error adding comment" })
  }
}


// ---------------- LIKE ----------------
export const likePost = async (req, res) => {
  try {
    const { postId } = req.body
    if (!postId) return res.status(400).json({ message: "postId required" })

    // ✅ toggle like
    const existing = await prisma.like.findUnique({
      where: { userId_postId: { userId: req.user.id, postId: Number(postId) } }
    })

    if (existing) {
      // ถ้ามีแล้ว → unlike
      await prisma.like.delete({
        where: { userId_postId: { userId: req.user.id, postId: Number(postId) } }
      })
      return res.json({ unliked: true })
    }

    // ถ้าไม่มี → like ใหม่
    const like = await prisma.like.create({
      data: { postId: Number(postId), userId: req.user.id },
      include: { post: { include: { author: true } } }
    })

    // ✅ สร้าง Notification แจ้งเตือนเจ้าของโพสต์
    if (like.post.authorId !== req.user.id) {
      const noti = await prisma.notification.create({
        data: {
          userId: like.post.authorId,
          type: "like",   // ถ้า schema มี enum "like" จะใช้ได้เลย
          title: `${req.user.name || "ผู้ใช้"} กดถูกใจโพสต์ของคุณ`,
          body: like.post.content?.slice(0, 50) || "",
          postId: like.postId
        }
      })

      // 🔔 realtime → ส่งไปยังเจ้าของโพสต์
      getIO().to(`user_${like.post.authorId}`).emit("notification:new", noti)
    }

    return res.json(like)
  } catch (e) {
    console.error("Error likePost:", e)
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

    // ✅ อัปโหลดรูป
    if (req.files && req.files.length > 0) {
      const imagesData = []
      for (let i = 0; i < req.files.length; i++) {
        const f = req.files[i]
        const result = await cloudinary.uploader.upload(f.path, {
          folder: "marketplace/posts",
        })
        imagesData.push({
          postId: post.id,
          url: result.secure_url,
          position: i,
        })
        await fs.unlink(f.path).catch(() => {})
      }
      if (imagesData.length > 0) {
        await prisma.postImage.createMany({ data: imagesData })
      }
    }

    // ✅ ดึงโพสต์เต็มหลังอัปโหลด
    const full = await prisma.post.findUnique({
      where: { id: post.id },
      include: {
        images: true,
        videos: true,
        author: { select: { id: true, name: true, avatarUrl: true } },
        comments: true,
        likes: true,
      },
    })

    // 🔥 ส่ง id กลับมาด้วย เพื่อให้ frontend เอาไปใช้ต่อกับ /videos
    return res.status(201).json({
      ok: true,
      id: post.id,      // ✅ เพิ่มตรงนี้
      post: full,
    })
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
// ---------------- PAGINATION ----------------
export const listPosts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page ?? "1", 10), 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize ?? "10", 10), 1), 50);

    // 📌 กรองด้วย userId ถ้ามีส่งมา
    const where = {};
    if (req.query.userId) {
      where.authorId = Number(req.query.userId);
    }

    const [total, items] = await Promise.all([
      prisma.post.count({ where }),
      prisma.post.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          images: { orderBy: { position: "asc" } },
          videos: true,
          author: {
            select: { id: true, name: true, avatarUrl: true, ratingAverage: true, ratingCount: true }
          },
          comments: { include: { author: true } },
          likes: true,
          trades: req.user
            ? {
                where: {
                  OR: [
                    { buyerId: req.user.id },
                    { sellerId: req.user.id }
                  ]
                },
                select: { id: true, status: true }
              }
            : false
        },
      }),
    ]);

    const withStatus = items.map(p => ({
      ...p,
      tradeStatus: p.trades && p.trades.length > 0 ? p.trades[0].status : null
    }));

    return res.json({ ok: true, total, page, pageSize, items: withStatus });
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
    const postId = Number(req.params.postId)

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { videos: true } // ✅ ดึง video มาด้วย
    })

    if (!post) return res.status(404).json({ ok: false, message: "Post not found" })
    if (post.authorId !== req.user.id)
      return res.status(403).json({ ok: false, message: "Forbidden" })

    // ✅ ลบวิดีโอทั้งหมดที่ผูกกับโพสต์นี้ก่อน
    await prisma.postVideo.deleteMany({
      where: { postId },
    })

    // ✅ แล้วค่อยลบโพสต์
    await prisma.post.delete({
      where: { id: postId },
    })

    return res.json({ ok: true })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ ok: false, message: "Error deleting post" })
  }
}



// ดึงโพสต์เดียว พร้อมคอมเมนต์และรูปภาพ
export const getPostById = async (req, res) => {
  try {
    const { id } = req.params

    const post = await prisma.post.findUnique({
      where: { id: Number(id) },
      include: {
        images: true,
        videos: true,
        comments: {
          include: {
            author: { select: { id: true, name: true, email: true, avatarUrl: true } }
          },
          orderBy: { createdAt: "asc" }
        },
        author: { select: { id: true, name: true, email: true, avatarUrl: true } },
        likes: true,   // ✅ เพิ่มตรงนี้
        trades: req.user
          ? {
              where: {
                OR: [
                  { buyerId: req.user.id },
                  { sellerId: req.user.id }
                ]
              },
              select: { id: true, status: true }
            }
          : false
      }
    })

    if (!post) return res.status(404).json({ message: "Post not found" })

    const withStatus = {
      ...post,
      tradeStatus: post.trades && post.trades.length > 0 ? post.trades[0].status : null
    }

    res.json(withStatus)
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

// ✅ edit comment
export const editComment = async (req, res) => {
  try {
    const { id } = req.params
    const { content } = req.body
    const comment = await prisma.comment.findUnique({ where: { id: Number(id) } })
    if (!comment || comment.authorId !== req.user.id)
      return res.status(403).json({ message: "ไม่มีสิทธิ์แก้ไข" })

    const updated = await prisma.comment.update({
      where: { id: Number(id) },
      data: { content },
    })
    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "แก้ไขไม่สำเร็จ" })
  }
}

// ✅ delete comment
export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params
    const comment = await prisma.comment.findUnique({ where: { id: Number(id) } })
    if (!comment || comment.authorId !== req.user.id)
      return res.status(403).json({ message: "ไม่มีสิทธิ์ลบ" })

    await prisma.comment.delete({ where: { id: Number(id) } })
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "ลบไม่สำเร็จ" })
  }
}


// ✅ อัปโหลดวิดีโอ
export const addPostVideos = async (req, res) => {
  try {
    const postId = Number(req.params.postId);
    const files = req.files || [];

    if (!postId || isNaN(postId)) {
      return res.status(400).json({ message: "Invalid postId" });
    }
    if (files.length === 0) {
      return res.status(400).json({ message: "No video files uploaded" });
    }

    const uploadedVideos = [];

    for (const file of files) {
      try {
        console.log("📤 Uploading video:", file.originalname);

        // ✅ ใช้ upload_large + resource_type: video
        const result = await cloudinary.uploader.upload_large(file.path, {
          resource_type: "video",
          folder: "marketplace/videos",
          chunk_size: 6000000,
        });

        console.log("✅ Uploaded:", result.secure_url);

        uploadedVideos.push({
          postId,
          url: result.secure_url,
        });

        await fs.unlink(file.path).catch(() => {});
      } catch (uploadErr) {
        console.error("❌ Cloudinary upload error:", uploadErr);
        return res.status(500).json({
          message: "Cloudinary upload failed",
          error: uploadErr.message,
        });
      }
    }

    if (uploadedVideos.length === 0) {
      return res.status(500).json({ message: "No videos uploaded successfully" });
    }

    await prisma.postVideo.createMany({
      data: uploadedVideos,
    });

    return res.json({
      ok: true,
      count: uploadedVideos.length,
      message: "อัปโหลดวิดีโอสำเร็จ ✅",
    });
  } catch (err) {
    console.error("❌ Error addPostVideos:", err);
    return res.status(500).json({
      message: "เกิดข้อผิดพลาดในการอัปโหลดวิดีโอ",
      error: err.message,
    });
  }
};



// ---------------- DELETE VIDEO ----------------
export const deletePostVideo = async (req, res) => {
  try {
    const videoId = Number(req.params.videoId);
    const video = await prisma.postVideo.findUnique({
      where: { id: videoId },
      include: { post: true },
    });

    if (!video)
      return res.status(404).json({ ok: false, message: "Video not found" });
    if (video.post.authorId !== req.user.id)
      return res.status(403).json({ ok: false, message: "Forbidden" });

    await prisma.postVideo.delete({ where: { id: videoId } });

    return res.json({ ok: true, message: "ลบวิดีโอสำเร็จ ✅" });
  } catch (err) {
    console.error("❌ Error deleting video:", err);
    return res.status(500).json({ ok: false, message: "Error deleting video" });
  }
};