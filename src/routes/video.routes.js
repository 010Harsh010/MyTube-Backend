import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import { 
  uploadVideo, 
  getVideoById, 
  updateVideo, 
  deleteVideo, 
  togglePublishStatus, 
  getAllVideos, 
  dataVideos 
} from "../controllers/video.controler.js";

const router = Router();

// Apply `verifyJWT` middleware only to specific routes
router.post(
  "/upload-video",
  verifyJWT,
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 }
  ]),
  uploadVideo
);

router.get("/video-details/:getvideoid", getVideoById);
router.patch(
  "/updateVideo/:videoid",
  verifyJWT,
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  updateVideo
);

router.delete("/deletevideo/:videoId", verifyJWT, deleteVideo); // Delete video

router.patch("/video-publish/:videoid", verifyJWT, togglePublishStatus); // Toggle publish status

router.get("/getvideos/:userId", verifyJWT, getAllVideos); // Get all videos for a user

// Route that does NOT require `verifyJWT`
router.get("/getallvideos", dataVideos);

export default router;
