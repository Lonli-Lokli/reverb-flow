import { Innertube, ProtoUtils, UniversalCache, Utils } from 'youtubei.js';
import { BG } from 'bgutils-js';

import { createEvent, createEffect, createStore, sample } from 'effector';
import { createAction } from 'effector-action';

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

createAction({
  clock: youtubeUrlChanged,
  target: { $youtubeUrl },
  fn: (target, change) => {
    // Only update if the URL is a valid YouTube link
    if (
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//.test(change.trim())
    ) {
      target.$youtubeUrl(change);
    } else {
      target.$youtubeUrl('');
      alert('Invalid YouTube URL');
    }
  },
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
  const visitorData = ProtoUtils.encodeVisitorData(
    Utils.generateRandomString(11),
    Math.floor(Date.now() / 1000)
  );

  // Immediately mint a cold start token so we can start playback without delays.
  const coldStartToken = BG.PoToken.generateColdStartToken(visitorData);
  const poToken = await getPo(visitorData);

  const yt = await Innertube.create({
    po_token: poToken || coldStartToken,
    visitor_data: visitorData,
    fetch: fetchFn,
    generate_session_locally: true,
    cache: new UniversalCache(false),
  });

  const endpoint = await yt.resolveURL(url);

  if (!endpoint.payload.videoId) {
    throw new Error('Failed to resolve Video ID');
  }

  const audioStream = await yt.download(endpoint.payload.videoId, {
    type: 'audio',
    quality: 'best',
    client: 'YTMUSIC',
  });

  // Convert ReadableStream<Uint8Array> to Blob
  const reader = audioStream.getReader();
  const chunks: Uint8Array[] = [];
  let done = false;
  while (!done) {
    const { value, done: isDone } = await reader.read();
    if (value) chunks.push(value);
    done = isDone;
  }
  const totalLength = chunks.reduce((acc, cur) => acc + cur.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  const blob = new Blob([merged], { type: 'audio/mpeg' });
  const file = new File([blob], 'youtube-audio.mp3', { type: 'audio/mpeg' });

  return {
    file,
    name: file.name,
    size: file.size,
    type: file.type,
  };
});

function fetchFn(input: RequestInfo | URL, init?: RequestInit) {
  const url =
    typeof input === 'string'
      ? new URL(input)
      : input instanceof URL
      ? input
      : new URL(input.url);

  // Transform the url for use with our proxy.
  url.searchParams.set('__host', url.host);
  url.host = 'localhost:8080';
  url.protocol = 'http';

  const headers = init?.headers
    ? new Headers(init.headers)
    : input instanceof Request
    ? input.headers
    : new Headers();

  // Now serialize the headers.
  url.searchParams.set('__headers', JSON.stringify([...headers as any]));

  // Copy over the request.
  const request = new Request(
    url,
    input instanceof Request ? input : undefined
  );

  headers.delete('user-agent');

  return fetch(
    request,
    init
      ? {
          ...init,
          headers,
        }
      : {
          headers,
        }
  );
}

async function getPo(identifier: string): Promise<string | undefined> {
  const requestKey = 'O43z0dpjhgX20SCx4KAo';

  const bgConfig = {
    fetch: (input: string | URL | globalThis.Request, init?: RequestInit) =>
      fetch(input, init),
    globalObj: window,
    requestKey,
    identifier,
  };

  const bgChallenge = await BG.Challenge.create(bgConfig);

  if (!bgChallenge) throw new Error('Could not get challenge');

  const interpreterJavascript =
    bgChallenge.interpreterJavascript
      .privateDoNotAccessOrElseSafeScriptWrappedValue;

  if (interpreterJavascript) {
    new Function(interpreterJavascript)();
  } else throw new Error('Could not load VM');

  const poTokenResult = await BG.PoToken.generate({
    program: bgChallenge.program,
    globalName: bgChallenge.globalName,
    bgConfig,
  });

  return poTokenResult.poToken;
}
