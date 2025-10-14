import { uploadBase64ImageToSupabase, removeFromSupabase } from './supabase.js';

export const uploadAnnouncementImage = async (fileBuffer, fileName) => {
  try {
    // Convert buffer to base64 with proper MIME type detection
    const mimeType = 'image/jpeg'; // Default, could be enhanced to detect actual type
    const base64 = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;

    const result = await uploadBase64ImageToSupabase({
      base64,
      folder: 'announcements',
    });

    return {
      url: result.url,
      publicId: result.key, // Supabase uses 'key' instead of 'public_id'
    };
  } catch (error) {
    console.error('Supabase upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

export const deleteAnnouncementImage = async (publicId) => {
  try {
    await removeFromSupabase(publicId);
  } catch (error) {
    console.error('Supabase delete error:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};