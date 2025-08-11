const express = require("express");
const mongoose = require("mongoose");
const { StatusCodes } = require("http-status-codes");
const dotenv = require("dotenv");
const userRouter = require("./routes/userRoutes");
const artistRouter = require("./routes/artistRoutes");
const albumRouter = require("./routes/albumRoutes");
const songRouter = require("./routes/songRoutes");
const playlistRouter = require("./routes/playlistRoutes");
//Load environment variables
dotenv.config();
//Initialize app
const app = express();

//Connect to database
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("Database connected...");
  })
  .catch((err) => {
    console.log("Error connecting to database..", err.message);
  });

//Pass incoming data
app.use(express.json());
//Routes
app.use("/api/users", userRouter);
app.use("/api/artists", artistRouter);
app.use("/api/albums", albumRouter);
app.use("/api/songs", songRouter);
app.use("/api/playlists", playlistRouter);

//Error Handling middleware
//404
app.use((req, res, next) => {
  const error = new Error("Not Found");
  error.status = StatusCodes.NOT_FOUND;
  next(error);
});
//Global error handler
app.use((err, req, res, next) => {
  res.status(err.status || StatusCodes.INTERNAL_SERVER_ERROR).json({
    message: err.message || "Internal server Error",
    status: "error",
  });
});
//Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server is running on the port", PORT);
});
