import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { CloudinaryUploadResult } from '../types';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadImage = async (filePath: string): Promise<CloudinaryUploadResult> => {
  return cloudinary.uploader.upload(filePath, {
    folder: 'commercebridge/users',
    resource_type: 'image',
  });
}; 