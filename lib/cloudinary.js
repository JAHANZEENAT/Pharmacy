import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

/**
 * Uploads a file to Cloudinary
 * @param {string|Buffer} file - The file data or path
 * @param {string} folder - The folder to upload to
 * @returns {Promise<{url: string, publicId: string}>}
 */
export const uploadToCloudinary = async (file, folder = 'pharmacy') => {
    try {
        // Determine if file is a Buffer or a string (URL/path)
        const options = {
            folder: `pharmacy/${folder}`,
            resource_type: 'auto',
        };

        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                options,
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );

            // If it's a buffer, write it to the stream
            if (Buffer.isBuffer(file)) {
                uploadStream.end(file);
            } else if (typeof file === 'string' && file.startsWith('data:')) {
                // Base64 string
                cloudinary.uploader.upload(file, options)
                    .then(resolve)
                    .catch(reject);
            } else {
                // Assume file is already a path or URL
                cloudinary.uploader.upload(file, options)
                    .then(resolve)
                    .catch(reject);
            }
        });

        return {
            url: result.secure_url,
            publicId: result.public_id,
        };
    } catch (error) {
        console.error('Cloudinary Upload Error:', error);
        throw error;
    }
};

/**
 * Deletes a file from Cloudinary
 * @param {string} publicId - The public ID of the file
 * @returns {Promise<any>}
 */
export const deleteFromCloudinary = async (publicId) => {
    try {
        return await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error('Cloudinary Delete Error:', error);
        throw error;
    }
};

export default cloudinary;
