import { createEffect, createEvent, createStore, sample } from 'effector';
import WaveSurfer from 'wavesurfer.js';
import { createAction } from 'effector-action';
import RegionsPlugin, {
  Region,
} from 'wavesurfer.js/dist/plugins/regions.esm.js';
import { FFmpeg } from '@ffmpeg/ffmpeg';

const ffmpeg = new FFmpeg();
const audioContexts = new Map<number, AudioContext>();

// A factory function to get or create an AudioContext for a specific sample rate
const getAudioContext = (sampleRate: number): AudioContext => {
  if (audioContexts.has(sampleRate)) {
    return audioContexts.get(sampleRate)!;
  }

  try {
    const context = new (window.AudioContext ||
      (window as any).webkitAudioContext)({
      sampleRate: sampleRate,
    });
    audioContexts.set(sampleRate, context);
    return context;
  } catch (e) {
    console.error(
      `Failed to create an AudioContext with sample rate ${sampleRate}. Falling back.`,
      e
    );
    // Fallback for older browsers or systems that don't support specifying sample rate
    const fallbackKey = 0; // Use 0 as the key for the default context
    if (audioContexts.has(fallbackKey)) {
      return audioContexts.get(fallbackKey)!;
    }
    const fallbackContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    audioContexts.set(fallbackKey, fallbackContext);
    return fallbackContext;
  }
};

export const audioSelected = createEvent<{
  file: File;
  originalId: string;
  reversedId: string;
}>();
export const regionCreated = createEvent<{
  waveformId: string;
  region: Region;
}>();

export const regionUpdated = createEvent<{
  waveformId: string;
  region: Region;
}>();

export const playButtonClicked = createEvent<{
  waveformId: string;
  action: 'play' | 'pause';
}>();

export const userRegionUpdateRequested = createEvent<{
  duration: number;
}>();

const dataLoaded = createEvent<string>();
export const exportClicked = createEvent();
export const durationChanged = createEvent<number>();
export const userDurationChanged = createEvent<number>();

const $audios = createStore<Record<string, AudioBuffer>>({});
export const $playingState = createStore<Record<string, boolean>>({});
const $waveforms = createStore<Record<string, WaveSurfer>>({});
const $regions = createStore<Record<string, Region>>({});
export const $dataState = createStore<Record<string, boolean>>({});
const $trackName = createStore<string>('Track');
export const errorOccurred = createEvent<Error>();
const processAudioFx = createEffect<
  {
    file: File;
    originalId: string;
    reversedId: string;
  },
  {
    original: {
      id: string;
      waveForm: WaveSurfer;
      audioBuffer: AudioBuffer;
    };
    reversed: {
      id: string;
      waveForm: WaveSurfer;
      audioBuffer: AudioBuffer;
    };
  }
>();

const mirrorRegionFx = createEffect<
  {
    waveformId: string;
    duration: number;
    region: Region;
    regions: Record<string, Region>;
  },
  void
>();
const logErrorFx = createEffect<Error, void>(console.error);
const playRegionsFx = createEffect<
  {
    regions: Record<string, Region>;
    waveforms: Record<string, WaveSurfer>;
    action: 'play' | 'pause';
    waveformId: string;
  },
  void
>();

const updateRegionsFromUserInputFx = createEffect<
  {
    duration: number;
    regions: Record<string, Region>;
    waveforms: Record<string, WaveSurfer>;
  },
  void
>();

createAction({
  clock: audioSelected,
  target: { processAudioFx, $trackName },
  fn: (target, change) => {
    target.processAudioFx(change);
    target.$trackName(change.file.name.replace(/\.[^/.]+$/, '') || 'Track');
  },
});

const exportRegionsFx = createEffect<
  {
    regions: Record<string, Region>;
    waveforms: Record<string, WaveSurfer>;
    trackName: string;
    options?: {
      bitrate?: number;
      filenames?: [string, string];
      onProgress?: (file: string, percent: number) => void;
    };
  },
  void
>();

sample({
  clock: [
    processAudioFx.failData,
    mirrorRegionFx.failData,
    exportRegionsFx.failData,
  ],
  target: [errorOccurred, logErrorFx]
});

sample({
  clock: exportClicked,
  source: { regions: $regions, waveforms: $waveforms, trackName: $trackName },
  fn: ({ regions, waveforms, trackName }) => ({
    regions,
    waveforms,
    trackName,
  }),
  target: exportRegionsFx,
});

sample({
  clock: userRegionUpdateRequested,
  source: { regions: $regions, waveforms: $waveforms },
  fn: ({ regions, waveforms }, { duration }) => ({
    duration,
    regions,
    waveforms,
  }),
  target: updateRegionsFromUserInputFx,
});

processAudioFx.use(async ({ file, originalId, reversedId }) => {
  const arrayBuffer = await file.arrayBuffer();

  // --- Step 1: Initial "offline" decode to get the true sample rate ---
  // We create a temporary, throwaway context for this.
  const tempContext = new (window.AudioContext ||
    (window as any).webkitAudioContext)();
  const preliminaryBuffer = await tempContext.decodeAudioData(
    arrayBuffer.slice(0)
  ); // Use slice to create a copy
  const sourceSampleRate = preliminaryBuffer.sampleRate;
  await tempContext.close(); // Clean up the temporary context

  console.log(`Original file sample rate detected: ${sourceSampleRate} Hz`);

  // --- Step 2: Get or create the main AudioContext with the CORRECT sample rate ---
  const audioContext = getAudioContext(sourceSampleRate);
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  const originalAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  const reversedAudioBuffer = reverseAudioBuffer(
    originalAudioBuffer,
    audioContext
  );

  const { waveform: originalWaveform } = await initializeWaveform(
    originalId,
    originalAudioBuffer,
    () => 0,
    (duration) => Math.min(10, duration)
  );
  const { waveform: reversedWaveform } = await initializeWaveform(
    reversedId,
    reversedAudioBuffer,
    (duration) => Math.max(0, duration - 10),
    (duration) => duration
  );

  return {
    original: {
      id: originalId,
      waveForm: originalWaveform,
      audioBuffer: originalAudioBuffer,
    },
    reversed: {
      id: reversedId,
      waveForm: reversedWaveform,
      audioBuffer: reversedAudioBuffer,
    },
  };
});

mirrorRegionFx.use(async ({ region, regions, waveformId, duration }) => {
  Object.entries(regions).forEach(([id, r]) => {
    if (id === waveformId) {
      // do nothing
    } else {
      const newRegion =
        waveformId === 'original'
          ? {
              start: duration - region.end,
              end: duration - region.start,
            }
          : {
              start: duration - region.end,
              end: duration - region.start,
            };

      r.setOptions({
        start: newRegion.start,
        end: newRegion.end,
      });
    }
  });
});

createAction({
  clock: playButtonClicked,
  source: { $regions, $waveforms },
  target: { $playingState, playRegionsFx },
  fn: (target, { regions, waveforms }, change) => {
    const newPlayingState = Object.keys(waveforms).reduce<
      Record<string, boolean>
    >((acc, curr) => {
      acc[curr] =
        change.action === 'pause' ? false : curr === change.waveformId;
      return acc;
    }, {});
    target.$playingState(newPlayingState);
    target.playRegionsFx({
      regions,
      waveforms,
      action: change.action,
      waveformId: change.waveformId,
    });
  },
});

sample({
  clock: regionCreated,
  batch: false,
  source: $regions,
  fn: (regions, { waveformId, region }) => ({
    ...regions,
    [waveformId]: region,
  }),
  target: $regions,
});

sample({
  clock: regionCreated,
  fn: (r) => r.region.end - r.region.start,
  target: durationChanged,
});
createAction({
  clock: regionUpdated,
  source: { $waveforms, $regions },
  target: { mirrorRegionFx, durationChanged },
  fn: (target, { waveforms, regions }, change) => {
    target.mirrorRegionFx({
      waveformId: change.waveformId,
      regions: regions,
      duration: waveforms[change.waveformId].getDuration(),
      region: change.region,
    });

    target.durationChanged(Math.round(change.region.end - change.region.start));
  },
});

sample({
  clock: dataLoaded,
  batch: false,
  source: $dataState,
  fn: (dataState, id) => ({
    ...dataState,
    [id]: true,
  }),
  target: $dataState,
});

createAction({
  clock: processAudioFx.doneData,
  target: { $audios, $waveforms },
  fn: (target, change) => {
    target.$audios((audios) => ({
      ...audios,
      [change.original.id]: change.original.audioBuffer,
      [change.reversed.id]: change.reversed.audioBuffer,
    }));

    target.$waveforms((waveforms) => ({
      ...waveforms,
      [change.original.id]: change.original.waveForm,
      [change.reversed.id]: change.reversed.waveForm,
    }));
  },
});

playRegionsFx.use(({ action, regions, waveforms, waveformId }) => {
  Object.entries(waveforms).forEach(([id, waveform]) => {
    if (action === 'pause') {
      waveform.pause();
    } else {
      if (id === waveformId) {
        waveform.play(regions[id]?.start || 0, regions[id]?.end);
      } else {
        waveform.pause();
      }
    }
  });
});

updateRegionsFromUserInputFx.use(({ duration, regions, waveforms }) => {
  Object.entries(regions).forEach(([id, region]) => {
    if (waveforms[id]) {
      const totalDuration = waveforms[id].getDuration();

      const start = regions[id]!.start;
      const end = Math.min(duration, totalDuration);

      region.setOptions({
        start,
        end,
      });
    }
  });
});

function reverseAudioBuffer(
  audioBuffer: AudioBuffer,
  audioContext: AudioContext
): AudioBuffer {
  const reversedBuffer = audioContext.createBuffer(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );

  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const originalData = audioBuffer.getChannelData(channel);
    const reversedData = reversedBuffer.getChannelData(channel);

    for (let i = 0; i < originalData.length; i++) {
      reversedData[i] = originalData[originalData.length - 1 - i];
    }
  }

  return reversedBuffer;
}

const random = (min: number, max: number) => Math.random() * (max - min) + min;
const randomColor = () =>
  `rgba(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)}, 0.5)`;
exportRegionsFx.use(async ({ regions, waveforms, options, trackName }) => {
  const {
    bitrate = 320,
    filenames = [`[ORIGINAL] ${trackName}.mp3`, `[REVERSED] ${trackName}.mp3`],
    onProgress = () => {
      console.log('Progress');
    },
  } = options || {};

  await ffmpeg.load();

  const buffer1 = extractBuffer(
    waveforms['original'].getDecodedData()!,
    regions['original'].start,
    regions['original'].end,
    getAudioContext(waveforms['original'].getDecodedData()!.sampleRate) // Pass the correct context
  );
  const buffer2 = extractBuffer(
    waveforms['reversed'].getDecodedData()!,
    regions['reversed'].start,
    regions['reversed'].end,
    getAudioContext(waveforms['reversed'].getDecodedData()!.sampleRate) // Pass the correct context
  );

  // Prepare WAV files
  const wavBlob1 = audioBufferToWavBlob(buffer1);
  const wavBlob2 = audioBufferToWavBlob(buffer2);
  const wavArray1 = new Uint8Array(await wavBlob1.arrayBuffer());
  const wavArray2 = new Uint8Array(await wavBlob2.arrayBuffer());

  // Write WAVs into virtual FS
  ffmpeg.writeFile('input1.wav', wavArray1);
  ffmpeg.writeFile('input2.wav', wavArray2);

  // Encode both files in sequence
  await ffmpeg.exec([
    '-i',
    'input1.wav',
    '-b:a',
    `${bitrate}k`,
    '-vn',
    'output1.mp3',
  ]);
  onProgress(filenames[0], 50);

  await ffmpeg.exec([
    '-i',
    'input2.wav',
    '-b:a',
    `${bitrate}k`,
    '-vn',
    'output2.mp3',
  ]);
  onProgress(filenames[1], 100);

  // Read back MP3s and download
  const mp3Data1 = await ffmpeg.readFile('output1.mp3');
  const mp3Data2 = await ffmpeg.readFile('output2.mp3');

  downloadBlob(new Blob([mp3Data1], { type: 'audio/mp3' }), filenames[0]);
  downloadBlob(new Blob([mp3Data2], { type: 'audio/mp3' }), filenames[1]);
});

// audio-buffer-to-wav.ts

export function extractBuffer(
  originalData: AudioBuffer,
  start: number,
  end: number,
  audioContext: AudioContext // Receive the context
): AudioBuffer {
  const sampleRate = originalData.sampleRate;
  const numChannels = originalData.numberOfChannels;
  const startSample = Math.floor(start * sampleRate);
  const endSample = Math.floor(end * sampleRate);
  const frameCount = endSample - startSample;

  const buffer = audioContext.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const originalChannelData = originalData.getChannelData(channel);
    const extractedData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      extractedData[i] = originalChannelData[startSample + i];
    }
  }

  return buffer;
}

export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bitDepth = 32; // Use 32-bit float for maximum quality
  const format = 3; // 3 = IEEE float

  const blockAlign = numChannels * (bitDepth / 8);
  const byteRate = sampleRate * blockAlign;
  const wavLength = buffer.length * blockAlign;

  const arrayBuffer = new ArrayBuffer(44 + wavLength);
  const view = new DataView(arrayBuffer);

  let offset = 0;

  const writeString = (s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset++, s.charCodeAt(i));
  };

  const writeUint16 = (val: number) => {
    view.setUint16(offset, val, true);
    offset += 2;
  };

  const writeUint32 = (val: number) => {
    view.setUint32(offset, val, true);
    offset += 4;
  };

  // WAV file header
  writeString('RIFF');
  writeUint32(36 + wavLength);
  writeString('WAVE');
  writeString('fmt ');
  writeUint32(16); // Subchunk1Size
  writeUint16(format); // AudioFormat (1 = PCM, 3 = IEEE float)
  writeUint16(numChannels);
  writeUint32(sampleRate);
  writeUint32(byteRate);
  writeUint16(blockAlign);
  writeUint16(bitDepth);
  writeString('data');
  writeUint32(wavLength);

  // PCM samples (as 32-bit floats)
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = buffer.getChannelData(ch)[i];
      view.setFloat32(offset, sample, true); // Write as float32
      offset += 4;
    }
  }

  return new Blob([view], { type: 'audio/wav' });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function initializeWaveform(
  id: string,
  audioBuffer: AudioBuffer,
  start: (duration: number) => number,
  end: (duration: number) => number
) {
  const waveform = WaveSurfer.create({
    container: `#${id}`,
    waveColor: randomColor(),
    progressColor: randomColor(),
    sampleRate: audioBuffer.sampleRate,
  });

  const region = RegionsPlugin.create();
  waveform.registerPlugin(region);

  waveform.on('decode', (duration) => {
    dataLoaded(id);
    regionCreated({
      region: region.addRegion({
        start: start(duration),
        end: end(duration),
        color: randomColor(),
        drag: true,
        resize: true,
      }),
      waveformId: id,
    });
  });
  waveform.on('finish', () => {
    playButtonClicked({
      waveformId: id,
      action: 'pause',
    });
  });

  region.enableDragSelection({
    color: 'rgba(255, 0, 0, 0.1)',
  });

  region.on('region-updated', (region) => {
    regionUpdated({
      waveformId: id,
      region: region,
    });
    console.log('Updated region', region);
  });

  await waveform.loadBlob(audioBufferToWavBlob(audioBuffer));

  return {
    waveform,
    region,
  };
}
