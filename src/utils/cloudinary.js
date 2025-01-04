import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({ 
    cloud_name: 'ds7o9juow', 
    api_key: '579429687667266', 
    api_secret: 'qWAp5jfwlDem5wqRqVizUWpkbmA' // Click 'View API Keys' above to copy your API secret
});


const uploadcloudinary = async (localFilePath) => {
    try {
      if (!localFilePath) {
        console.log("Invalid file path");
        return null;
      }
  
      console.log("Uploading file to Cloudinary:", localFilePath);
  
      // Upload to Cloudinary
      const response = await cloudinary.uploader.upload(localFilePath, {
        resource_type: "auto",
      });
  
      console.log("File uploaded successfully:", response.url);
  
      // Delete the local file safely
      if (fs.existsSync(localFilePath)){
        fs.unlinkSync(localFilePath);
        console.log("Local file deleted:", localFilePath);
      }
  
      return response; // Return Cloudinary response
    } catch (error) {
      console.error("Cloudinary upload failed:", error.message);

      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
        console.log("Local file deleted after failure:", localFilePath);
      }
      return null;
    }
  };
  
  export { uploadcloudinary };