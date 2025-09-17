import { createClient } from "./client";

const supabase = createClient();

export const uploadImage = async (file: File, bucketName: string = "courses-resources", folderName: string | null = null): Promise<string | null> => {

  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}.${fileExt}`;
  let filePath = `images/${folderName}/${fileName}`;
  if (folderName === null) {
    filePath = `images/${fileName}`;
  }

  const { error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file);

  if (error) {
    console.error("Upload error:", error);
    return null;
  }

  // Assuming the bucket is public
  const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);

  return data.publicUrl;
};
