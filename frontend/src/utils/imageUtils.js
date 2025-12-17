import { API_URL } from '../api';

/**
 * Returns the correct image URL, handling both Cloudinary URLs and local paths.
 * 
 * @param {string} imageUrl - The image URL from the backend
 * @returns {string} - The complete, usable URL
 * 
 * @example
 * // Cloudinary URL (already complete)
 * getImageUrl('https://res.cloudinary.com/demo/image/upload/v1234/qr/qr_123.png')
 * // Returns: 'https://res.cloudinary.com/demo/image/upload/v1234/qr/qr_123.png'
 * 
 * @example
 * // Local path (needs API_URL prepended)
 * getImageUrl('/uploads/qr/qr_123.png')
 * // Returns: 'http://localhost:8000/uploads/qr/qr_123.png'
 */
export const getImageUrl = (imageUrl) => {
  if (!imageUrl) return '';
  
  // If it's already a complete URL (Cloudinary or any external source), return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Otherwise, it's a local path, prepend API_URL
  return `${API_URL}${imageUrl}`;
};
