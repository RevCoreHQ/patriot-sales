import { createClient } from './client';

/** Upload a photo to Supabase Storage. Returns the storage path. */
export async function uploadPhoto(
  orgId: string,
  projectId: string,
  photoId: string,
  file: Blob | File
): Promise<{ path: string | null; error?: string }> {
  const supabase = createClient();
  const path = `${orgId}/${projectId}/${photoId}.jpg`;

  const { error } = await supabase.storage
    .from('project-photos')
    .upload(path, file, { contentType: 'image/jpeg', upsert: true });

  if (error) return { path: null, error: error.message };
  return { path };
}

/** Get a signed URL for a photo (1 hour expiry). */
export async function getPhotoUrl(storagePath: string): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from('project-photos')
    .createSignedUrl(storagePath, 3600);

  if (error || !data) return null;
  return data.signedUrl;
}

/** Delete a photo from Storage. */
export async function deletePhoto(storagePath: string): Promise<{ error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.storage
    .from('project-photos')
    .remove([storagePath]);

  return { error: error?.message };
}

/** Convert a base64 dataUrl to a Blob for upload. */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}
