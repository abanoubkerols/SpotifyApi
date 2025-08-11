const express = require("express");
const {
  createAlbum,
  getAlbums,
  getAlbumById,
  updateAlbum,
  deleteAlbum,
  addSongsToAlbum,
  removeSongFromAlbum,
  getNewReleases,
} = require("../controllers/albumController");
const upload = require("../middlewares/upload");
const { protect, isAdmin } = require("../middlewares/auth");

const albumRouter = express.Router();

//Public Routes
albumRouter.get("/", getAlbums);
albumRouter.get("/new-releases", getNewReleases);
albumRouter.get("/:id", getAlbumById);

//Admin Routes
albumRouter.post(
  "/",
  protect,
  isAdmin,
  upload.single("coverImage"),
  createAlbum
);

albumRouter.put(
  "/:id",
  protect,
  isAdmin,
  upload.single("coverImage"),
  updateAlbum
);

albumRouter.delete("/:id", protect, isAdmin, deleteAlbum);

albumRouter.get("/:id/add-songs", protect, isAdmin, addSongsToAlbum);

albumRouter.delete(
  "/:id/remove-songs/:songId",
  protect,
  isAdmin,
  removeSongFromAlbum
);

module.exports = albumRouter;
