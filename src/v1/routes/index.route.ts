import { Router } from "express";
import multer from "multer";
import authRoutes from "./auth.route";
import userRoutes from "./user.route";
import propertyRoutes from "./property.route";
import bookingRoutes from "./booking.route";
import chatRoutes from "./chat.route";
import { imagekitUploader } from "../utils/imageKitUpload";
import { verifyToken } from "../middlewares/token";

const router = Router();

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/property", propertyRoutes);
router.use("/bookings", bookingRoutes);
router.use("/chat", chatRoutes);

type FileType = "images" | "pdf" | "audio" | "video";

// Configure multer with file size limits
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
});

function determineFileType(mimetype: string, originalname: string): FileType {
  // Check MIME type first
  if (mimetype.startsWith("image/")) {
    return "images";
  }
  if (mimetype === "application/pdf") {
    return "pdf";
  }
  if (mimetype.startsWith("audio/")) {
    return "audio";
  }
  if (mimetype.startsWith("video/")) {
    return "video";
  }

  // Fallback to file extension if MIME type is not specific enough
  const extension = originalname.toLowerCase().split(".").pop();
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
  const audioExtensions = ["mp3", "wav", "ogg", "m4a", "aac"];
  const pdfExtensions = ["pdf"];
  const videoExtensions = ["mp4", "avi", "mov", "wmv", "mkv"];

  if (imageExtensions.includes(extension || "")) {
    return "images";
  }
  if (audioExtensions.includes(extension || "")) {
    return "audio";
  }
  if (pdfExtensions.includes(extension || "")) {
    return "pdf";
  }
  if (videoExtensions.includes(extension || "")) {
    return "video";
  }

  // Default to images if type cannot be determined
  return "images";
}

// Helper function to validate file size
function validateFileSize(size: number, type: FileType): boolean {
  const limits: Record<FileType, number> = {
    images: 10 * 1024 * 1024, // 10MB
    pdf: 50 * 1024 * 1024, // 50MB
    audio: 100 * 1024 * 1024, // 100MB
    video: 500 * 1024 * 1024, // 500MB
  };
  return size <= limits[type];
}

router.post("/upload", verifyToken, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: false,
        message: "No file uploaded",
        data: null,
      });
    }

    const { buffer, originalname, mimetype, size } = req.file;
    const fileType = determineFileType(mimetype, originalname);

    if (!validateFileSize(size, fileType)) {
      return res.status(400).json({
        status: false,
        message: `File size exceeds the limit for ${fileType}`,
        data: null,
      });
    }

    // Use ImageKit for upload
    const result = await imagekitUploader.uploadBuffer(
      buffer,
      originalname,
      fileType
    );

    if (!result.success) {
      return res.status(500).json({
        status: false,
        message: result.message,
        data: null,
      });
    }

    res.json({
      status: true,
      message: result.message,
      url: result.url,
      fileType,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({
      status: false,
      message: "Failed to upload file",
      data: null,
      error: (error as Error).message,
    });
  }
});

export default router;
