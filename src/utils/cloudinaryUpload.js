const cloudinary = require("../config/cloudinary");
const fs = require("fs");

const uploadToCloudinary = async (filePath, folder) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "auto",
    });
    //Delete the local file after successful upload
    fs.unlinkSync(filePath);
    return result;
  } catch (error) {
    // Delete the local file in case of error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw new Error("Failed to upload to cloudinary", error.message);
  }
};

module.exports = { uploadToCloudinary };
