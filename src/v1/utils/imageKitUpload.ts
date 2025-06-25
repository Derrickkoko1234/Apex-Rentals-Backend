import ImageKit from "imagekit";
import dotenv from "dotenv";

dotenv.config();

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

export const imagekitUploader = {
  async uploadBuffer(buffer: Buffer, fileName: string, fileType: string) {
    try {
      const result = await imagekit.upload({
        file: buffer,
        fileName,
        folder: `/apex-rentals/${fileType}`,
      });
      return {
        success: true,
        url: result.url,
        message: "File uploaded successfully",
        result,
      };
    } catch (error: any) {
      return {
        success: false,
        url: null,
        message: error.message || "ImageKit upload failed",
        error,
      };
    }
  },
};
