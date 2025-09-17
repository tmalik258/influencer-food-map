import { createClient } from "./client";

const supabase = createClient();

export const fetchImage = async (
  imageUrl: string,
  bucketName: string = "courses-resources"
): Promise<string | null> => {
  try {
    if (!imageUrl || !bucketName) {
      console.error("No image URL or bucket name provided");
      return null;
    }

    // Extract the file path from the public URL based on the bucket name
    const splitPart = `/storage/v1/object/public/${bucketName}/`;
    const filePath = imageUrl.split(splitPart)[1];
    if (!filePath) {
      console.error("Invalid image URL format:", imageUrl);
      return null;
    }

    console.log(
      "Fetching signed URL for file path:",
      filePath,
      "from bucket:",
      bucketName
    );

    // Generate signed URL for the uploaded image
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 60); // URL valid for 60 seconds

    if (error) {
      console.error("Error generating signed URL:", error);
      return null;
    }

    const uploadedUrl = data.signedUrl;
    console.log("Signed URL:", uploadedUrl);

    return uploadedUrl;
  } catch (error) {
    console.error("Error fetching image:", error);
    return null;
  }
};
