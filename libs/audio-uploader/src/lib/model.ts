import { createEvent, createEffect, createStore, sample } from 'effector';

// --- Types & Constants ---
type FileInfo = {
  file: File;
  name: string;
  size: number;
  type: string;
};

// --- Events ---
export const fileSelected = createEvent<FileInfo>();
export const fileInputChanged = createEvent<{ files: FileList | null }>();
export const filesDropped = createEvent<FileList>();
export const youtubeUrlChanged = createEvent<string>();
export const clearFile = createEvent<void>();
export const clearYoutubeUrl = createEvent<void>();

// --- Effects ---
export const uploadFileFx = createEffect<File, void, Error>();
export const downloadFromYoutubeFx = createEffect<string, FileInfo, Error>();

// --- Stores & Derived Stores ---
export const $selectedFile = createStore<FileInfo | null>(null);
export const $youtubeUrl = createStore<string>('');
export const $isUploading = uploadFileFx.pending;
export const $isDownloading = downloadFromYoutubeFx.pending;
export const $hasFile = $selectedFile.map((file) => !!file);

// --- Logic ---
sample({
  clock: sample({
    clock: fileInputChanged,
    fn: ({ files }) => extractFileInfo(files),
  }),

  filter: (fileInfo): fileInfo is FileInfo => !!fileInfo,
  target: fileSelected,
});

sample({
  clock: sample({
    clock: filesDropped,
    fn: extractFileInfo,
  }),

  filter: (fileInfo): fileInfo is FileInfo => !!fileInfo,
  target: fileSelected,
});

sample({
  clock: fileSelected,
  target: $selectedFile,
});

sample({
  clock: youtubeUrlChanged,
  target: $youtubeUrl,
});

sample({
  clock: clearFile,
  fn: () => null,
  target: $selectedFile,
});

sample({
  clock: clearYoutubeUrl,
  fn: () => '',
  target: $youtubeUrl,
});

sample({
  clock: downloadFromYoutubeFx.doneData,
  target: fileSelected,
});

// --- Implementation ---
function extractFileInfo(files: FileList | null): FileInfo | null {
  if (!files || files.length === 0) return null;
  const file = files[0];

  // Validate file type
  const allowedTypes = [
    'audio/mpeg',
    'audio/wav',
    'audio/flac',
    'audio/mp4',
    'audio/m4a',
  ];
  if (!allowedTypes.includes(file.type)) {
    console.warn('Invalid file type. Please select an audio file.');
    return null;
  }

  // Validate file size (50MB limit)
  const maxSize = 50 * 1024 * 1024; // 50MB in bytes
  if (file.size > maxSize) {
    console.warn('File too large. Maximum size is 50MB.');
    return null;
  }

  return {
    file,
    name: file.name,
    size: file.size,
    type: file.type,
  };
}

uploadFileFx.use(async (file) => {
  // Implement your upload logic here
  const formData = new FormData();
  formData.append('file', file);
  await fetch('/api/upload', { method: 'POST', body: formData });
});

downloadFromYoutubeFx.use(async (url: string): Promise<FileInfo> => {
  // Implement YouTube audio download logic here
  const response = await fetch('/api/youtube-download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    throw new Error('Failed to download audio from YouTube');
  }

  const blob = await response.blob();
  const file = new File([blob], 'youtube-audio.mp3', { type: 'audio/mpeg' });

  return {
    file,
    name: file.name,
    size: file.size,
    type: file.type,
  };
});
