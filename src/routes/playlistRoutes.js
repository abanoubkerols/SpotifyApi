const express = require("express");
const upload = require("../middlewares/upload");
const { protect, isAdmin } = require("../middlewares/auth");
const {
  createPlaylist,
  getPlaylists,
  getUserPlaylists,
  updatePlaylist,
  deletePlaylist,
  addSongsToPlaylist,
  removeFromPlaylist,
  addCollaborator,
  removeCollaborator,
  getFeaturedPlaylists,
  getPlaylistById,
} = require("../controllers/playlistController");

const playlistRouter = express.Router();

//Public Routes
playlistRouter.get("/", getPlaylists);
playlistRouter.get("/featured", getFeaturedPlaylists);
playlistRouter.get("/:id", getPlaylistById);
//Protect routes
playlistRouter.post("/", protect, upload.single("coverImage"), createPlaylist);

playlistRouter.get("/user/me", protect, getUserPlaylists);
playlistRouter.put(
  "/:id",
  protect,
  upload.single("coverImage"),
  updatePlaylist
);
playlistRouter.delete("/:id", protect, deletePlaylist);
playlistRouter.put("/:id/add-songs", protect, addSongsToPlaylist);
playlistRouter.put("/:id/add-collaborator", protect, addCollaborator);
playlistRouter.put("/:id/remove-song/:songId", protect, removeFromPlaylist);

playlistRouter.put("/:id/remove-collaborator", protect, removeCollaborator);

module.exports = playlistRouter;
