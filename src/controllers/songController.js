const asyncHandler = require("express-async-handler");
const { StatusCodes } = require("http-status-codes");
const Artist = require("../models/Artist");
const Album = require("../models/Album");
const Song = require("../models/Song");
const { uploadToCloudinary } = require("../utils/cloudinaryUpload");

//@desc - Create a new song
//@route - POST /api/songs
//@Access - Private/admin

const createSong = asyncHandler(async (req, res) => {
  const {
    title,
    artistId,
    albumId,
    duration,
    genre,
    lyrics,
    isExplicit,
    featuredArtists,
  } = req.body;
  //Check if artist exists
  const artist = await Artist.findById(artistId);
  if (!artist) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("Artist not found");
  }
  // Check if album exists if albumId is provided
  if (albumId) {
    const album = await Album.findById(albumId);
    if (!album) {
      res.status(StatusCodes.NOT_FOUND);
      throw new Error("Album not found");
    }
  }
  //Upload audio file
  if (!req.files || !req.files.audio) {
    res.status(StatusCodes.BAD_REQUEST);
    throw new Error("Audio file is required");
  }
  const audioResult = await uploadToCloudinary(
    req.files.audio[0].path,
    "spotify/songs"
  );
  // Upload cover image if provided
  let coverImageUrl = "";
  if (req.files && req.files.cover) {
    const imageResult = await uploadToCloudinary(
      req.files.cover[0].path,
      "spotify/covers"
    );
    coverImageUrl = imageResult.secure_url;
  }
  //Crete song
  const song = await Song.create({
    title,
    artist: artistId,
    album: albumId || null,
    duration,
    audioUrl: audioResult.secure_url,
    genre,
    lyrics,
    isExplicit: isExplicit === "true",
    featuredArtists: featuredArtists ? JSON.parse(featuredArtists) : [],
    coverImage: coverImageUrl,
  });

  //Add song to artist's songs
  artist.songs.push(song._id);
  await artist.save();
  //add song to album if album id is provided
  if (albumId) {
    const album = await Album.findById(albumId);
    album.songs.push(song._id);
    await album.save();
  }
  res.status(StatusCodes.CREATED).json(song);
});

//@desc -  Get all songs with filtering and pagination
//@route - GET /api/songs?genre=Rock&artist=3939kkd&search=comfort&page=1&limit=10
//@Access - Public
const getSongs = asyncHandler(async (req, res) => {
  const { genre, artist, search, page = 1, limit = 10 } = req.query;
  //Build filter object
  const filter = {};
  if (genre) filter.genre = genre;
  if (artist) filter.artist = artist;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { genre: { $regex: search, $options: "i" } },
    ];
  }

  //Count total Songs with filter
  const count = await Song.countDocuments(filter);
  //Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  //Get Songs
  const songs = await Song.find(filter)
    .sort({ releaseDate: -1 })
    .limit(parseInt(limit))
    .skip(skip)
    .populate("artist", "name image")
    .populate("album", "name coverImage")
    .populate("featuredArtists", "name");
  res.status(StatusCodes.OK).json({
    songs,
    page: parseInt(page),
    pages: Math.ceil(count / parseInt(limit)),
    totalSongs: count,
  });
});

//@desc -  Get a song ID
//@route - GET /api/songs/:id
//@Access - Public

const getSongById = asyncHandler(async (req, res) => {
  const song = await Song.findById(req.params.id)
    .populate("artist", "name image bio")
    .populate("album", "title coverImage releasedDate")
    .populate("featuredArtists", "name image");
  if (song) {
    //Increment plays count
    song.plays += 1;
    await song.save();
    res.status(StatusCodes.OK).json(song);
  } else {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("Song not found");
  }
});

//@desc - Update song Details
//@route - PUT /api/songs/:id
//@Access - Private

const updateSong = asyncHandler(async (req, res) => {
  const {
    title,
    artistId,
    albumId,
    duration,
    genre,
    lyrics,
    isExplicit,
    featuredArtists,
  } = req.body;

  const song = await Song.findById(req.params.id);
  if (!song) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("Song not found");
  }
  //Update song details
  song.title = title || song.title;
  song.album = albumId || song.album;
  song.genre = genre || song.genre;
  song.lyrics = lyrics || song.lyrics;
  song.artist = artistId || song.artist;
  song.duration = duration || song.duration;
  song.isExplicit =
    isExplicit !== undefined ? isExplicit === "true" : song.isExplicit;
  song.featuredArtists = featuredArtists
    ? JSON.parse(featuredArtists)
    : song.featuredArtists;
  //Update cover image if provided
  if (req.files && req.files.cover) {
    const imageResult = await uploadToCloudinary(
      req.files.cover[0].path,
      "spotify/covers"
    );
    song.coverImage = imageResult.secure_url;
  }

  //Update audio file if provided
  if (req.files && req.files.audio) {
    const audioResult = await uploadToCloudinary(
      req.files.audio[0].path,
      "spotify/songs"
    );
    song.audioUrl = audioResult.secure_url;
  }

  const updatedSong = await song.save();
  res.status(StatusCodes.OK).json(updatedSong);
});

//@desc - Delete Song
//@route - DELETE /api/songs/:id
//@Access - Private

const deleteSong = asyncHandler(async (req, res) => {
  const song = await Song.findById(req.params.id);
  if (!song) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("Song not found");
  }
  // Remove song from artist's songs
  await Artist.updateOne({ _id: song.artist }, { $pull: { songs: song._id } });

  // Remove song from album if it belongs to one
  if (song.album) {
    await Album.updateOne({ _id: song.album }, { $pull: { songs: song._id } });
  }
  await song.deleteOne();
  res.status(StatusCodes.OK).json({ message: "Song removed" });
});

//@desc - Get Top songs by plays
//@route - GET /api/songs/top?limit=10
//@Access - Public

const getTopSongs = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const songs = await Song.find()
    .sort({ plays: -1 })
    .limit(limit)
    .populate("artist", "name image")
    .populate("album", "title, coverImage");
  res.status(StatusCodes.OK).json(songs);
});

//@desc - Get new releases (recently added songs)
//@route - GET /api/songs/new-releases?limit=10
//@Access - Public

const getNewReleases = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const songs = await Song.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("artist", "name image")
    .populate("album", "title, coverImage");
  res.status(StatusCodes.OK).json(songs);
});

module.exports = {
  createSong,
  getSongs,
  getSongById,
  updateSong,
  deleteSong,
  getTopSongs,
  getNewReleases,
};
