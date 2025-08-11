const express = require("express");
const upload = require("../middlewares/upload");
const { protect, isAdmin } = require("../middlewares/auth");
const {
  createSong,
  getSongs,
  getSongById,
  updateSong,
  deleteSong,
  getTopSongs,
  getNewReleases,
} = require("../controllers/songController");

const songRouter = express.Router();

//Configure multer to handle multiple file types
const songUpload = upload.fields([
  { name: "audio", maxCount: 1 },
  { name: "cover", maxCount: 1 },
]);
//Public Routes
songRouter.get("/", getSongs);
songRouter.get("/top", getSongs);
songRouter.get("/new-releases", getNewReleases);
songRouter.get("/:id", getSongById);

//Admin Routes
songRouter.post("/", protect, isAdmin, songUpload, createSong);
songRouter.put("/:id", protect, isAdmin, songUpload, updateSong);
songRouter.delete("/:id", protect, isAdmin, deleteSong);
module.exports = songRouter;
