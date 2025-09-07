import { createClient } from "./client";

const supabase = createClient();

export const uploadFile = async (file: File, folder: string) => {
  const filePath = `files/${folder}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage
    .from("courses-resources")
    .upload(filePath, file);

  if (error) throw new Error(error.message);

  const { data } = supabase.storage
    .from("courses-resources")
    .getPublicUrl(filePath);

  return data.publicUrl;
};
