import { createClient } from "./client";

const supabase = createClient();

export const uploadVideo = async (file: File, folderName: string): Promise<string | null> => {
  // Validate file type
  const allowedTypes = [
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/avi",
    "video/mov",
  ];
  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      "Invalid video format. Please upload MP4, WebM, OGG, AVI, or MOV files."
    );
  }

  // Check file size (1GB limit)
  const maxSize = 1 * 1024 * 1024 * 1024; // 1GB
  if (file.size > maxSize) {
    throw new Error("File size too large. Maximum allowed size is 1GB.");
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `videos/${folderName}/${fileName}`;
  const bucketName = "courses-resources";

  // Upload with progress tracking
  const { error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Video upload error:", error);
    throw new Error(`Upload failed: ${error.message}`);
  }

  // For private bucket, generate signed URL
  const { data, error: signedError } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(filePath, 3600); // 1-hour expiry
  if (signedError) {
    console.error("Signed URL error:", signedError);
    throw new Error(`Failed to generate signed URL: ${signedError.message}`);
  }

  return data.signedUrl;
};
