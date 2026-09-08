import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface UploadResult {
  url: string;
  mediaType: 'image' | 'audio' | 'video';
  fileName: string;
}

export const uploadMediaFile = async (file: File): Promise<UploadResult> => {
  let mediaType: 'image' | 'audio' | 'video' = 'image';
  if (file.type.startsWith('audio/')) {
    mediaType = 'audio';
  } else if (file.type.startsWith('video/')) {
    mediaType = 'video';
  }

  // If Supabase is configured, upload to Supabase Storage bucket
  if (isSupabaseConfigured()) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('quiz-media')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from('quiz-media')
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          return {
            url: publicUrlData.publicUrl,
            mediaType,
            fileName: file.name
          };
        }
      }
    } catch (e) {
      console.warn('Supabase storage upload failed, falling back to local Blob URL', e);
    }
  }

  // Fallback: Create Local Object URL (instant offline browser support)
  const localUrl = URL.createObjectURL(file);
  return {
    url: localUrl,
    mediaType,
    fileName: file.name
  };
};
