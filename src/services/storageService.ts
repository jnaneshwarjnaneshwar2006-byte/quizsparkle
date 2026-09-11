export interface UploadResult {
  url: string;
  mediaType: 'image' | 'audio' | 'video';
  fileName: string;
}

/** MySQL version: media is kept as a browser object URL for now. */
export const uploadMediaFile = async (file: File): Promise<UploadResult> => {
  let mediaType: 'image' | 'audio' | 'video' = 'image';
  if (file.type.startsWith('audio/')) mediaType = 'audio';
  else if (file.type.startsWith('video/')) mediaType = 'video';
  return { url: URL.createObjectURL(file), mediaType, fileName: file.name };
};
