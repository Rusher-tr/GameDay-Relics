// we will use middleware of multer to save user uploaded data on server 
// this will be temp storage as we will upload it to cloudinary
// after uploading to cloudinary we will delete it from server
import {v2 as cloudinary} from 'cloudinary'
import fs from "fs"
// file system module(NODE) to delete file from server after uploading to cloudinary

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

const uploadOnCloudinary = async (localFilePath) =>{
    try{
        if(!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath,
            {resource_type: "auto"} //auto for all type of files (image,video,document)
        ) 
        //console.log("File uploaded on cloudinary successfully",response.url);
        fs.unlinkSync(localFilePath)
        return response 
    }
    // catch(err){
    //     fs.unlinkSync(localFilePath) // delete file from server if error occurs
    //     console.log(err);
    //     return null
    // }
        catch (err) {
        console.log("❌ Cloudinary upload failed:", err.message);
        fs.unlinkSync(localFilePath);
        return null;
    }

}
export {uploadOnCloudinary}